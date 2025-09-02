import { getPlans, searchPlans, createPlan, updatePlan, deletePlan } from '../Services/planService.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const addPlanBtn = document.getElementById('addPlanBtn');
    const planModalElement = document.getElementById('planModal');
    const planModal = new bootstrap.Modal(planModalElement);
    const planForm = document.getElementById('planForm');
    const tableBody = document.getElementById('plan-table-body');
    const modalTitle = document.getElementById('planModalLabel');
    const searchInput = document.getElementById('searchInput');
    const searchType = document.getElementById('searchType');
    const pageSizeSelect = document.getElementById('pageSize');
    const paginationContainer = document.getElementById('pagination');

    // --- ESTADO DE LA APLICACIÓN ---
    let state = {
        currentPage: 0,
        pageSize: 10,
        sort: 'idLugarTuristico,asc', // Ordenar por ID por defecto
        currentPlans: [],
        totalPages: 0,
        isEditing: false,
        editingId: null
    };

    // --- FUNCIONES PRINCIPALES ---

    const loadPlans = async () => {
        try {
            const query = searchInput.value.trim();
            const type = searchType.value;
            state.pageSize = parseInt(pageSizeSelect.value, 10);
            
            let data;
            if (query) {
                data = await searchPlans(query, type, state.currentPage, state.pageSize, state.sort);
            } else {
                data = await getPlans(state.currentPage, state.pageSize, state.sort);
            }
            
            state.currentPlans = data.content;
            state.totalPages = data.totalPages;
            renderTable();
            renderPagination(data);

        } catch (error) {
            Swal.fire('Error', `No se pudieron cargar los planes: ${error.message}`, 'error');
        }
    };

    const renderTable = () => {
        tableBody.innerHTML = '';
        if (!state.currentPlans || state.currentPlans.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4">No se encontraron planes turísticos.</td></tr>';
            return;
        }

        state.currentPlans.forEach(plan => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-100 dark:hover:bg-gray-700';
            tr.innerHTML = `
                <td class="px-6 py-4">${plan.idLugarTuristico}</td>
                <td class="px-6 py-4 font-medium">${plan.nombreLugar}</td>
                <td class="px-6 py-4">${plan.ubicacion}</td>
                <td class="px-6 py-4">${plan.tipoLugar || 'N/A'}</td>
                <td class="px-6 py-4 text-gray-600 dark:text-gray-400 truncate max-w-xs">${plan.descripcion}</td>
                <td class="px-6 py-4 text-center">
                    <button class="edit-btn text-blue-500 hover:text-blue-700" data-id="${plan.idLugarTuristico}"><i class="bi bi-pencil-square"></i></button>
                    <button class="delete-btn text-red-500 hover:text-red-700 ml-2" data-id="${plan.idLugarTuristico}"><i class="bi bi-trash-fill"></i></button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    };

    const renderPagination = (pageData) => {
        paginationContainer.innerHTML = '';
        const currentPage = pageData.number;

        if (pageData.totalPages <= 1) return;

        // Botón "Anterior"
        if (!pageData.first) {
            const prevLi = document.createElement('li');
            prevLi.innerHTML = `<button class="page-link relative block py-1.5 px-3 rounded border-0 bg-transparent outline-none transition-all duration-300 hover:bg-gray-200 dark:hover:bg-gray-600" data-page="${currentPage - 1}">Anterior</button>`;
            paginationContainer.appendChild(prevLi);
        }

        // Números de página
        for (let i = 0; i < pageData.totalPages; i++) {
             const pageLi = document.createElement('li');
             const pageButton = document.createElement('button');
             pageButton.dataset.page = i;
             pageButton.textContent = i + 1;
             pageButton.className = `page-link relative block py-1.5 px-3 rounded border-0 outline-none transition-all duration-300 ${i === currentPage ? 'bg-blue-600 text-white' : 'bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600'}`;
             pageLi.appendChild(pageButton);
             paginationContainer.appendChild(pageLi);
        }
        
        // Botón "Siguiente"
        if (!pageData.last) {
            const nextLi = document.createElement('li');
            nextLi.innerHTML = `<button class="page-link relative block py-1.5 px-3 rounded border-0 bg-transparent outline-none transition-all duration-300 hover:bg-gray-200 dark:hover:bg-gray-600" data-page="${currentPage + 1}">Siguiente</button>`;
            paginationContainer.appendChild(nextLi);
        }
    };
    
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(planForm);
        // El DTO de tu API espera un campo 'tipo', no 'tipoLugar'
        const planData = {
            nombreLugar: formData.get('nombreLugar'),
            ubicacion: formData.get('ubicacion'),
            tipo: formData.get('tipoLugar'),
            descripcion: formData.get('descripcion')
        };
        
        try {
            if (state.isEditing) {
                await updatePlan(state.editingId, planData);
                Swal.fire('¡Actualizado!', 'El plan ha sido actualizado correctamente.', 'success');
            } else {
                const response = await createPlan(planData);
                Swal.fire('¡Guardado!', `El nuevo plan "${response.data.nombreLugar}" ha sido guardado.`, 'success');
            }
            planModal.hide();
            loadPlans();
        } catch (error) {
            Swal.fire('Error', `Ocurrió un error al guardar: ${error.message}`, 'error');
        }
    };

    const openModalForEdit = (id) => {
        const planToEdit = state.currentPlans.find(p => p.idLugarTuristico == id);
        if (!planToEdit) return;

        state.isEditing = true;
        state.editingId = id;
        modalTitle.textContent = 'Editar Plan Turístico';
        document.getElementById('nombreLugar').value = planToEdit.nombreLugar;
        document.getElementById('ubicacion').value = planToEdit.ubicacion;
        document.getElementById('tipoLugar').value = planToEdit.tipo; // El DTO devuelve 'tipo'
        document.getElementById('descripcion').value = planToEdit.descripcion;
        planModal.show();
    };

    const openModalForNew = () => {
        state.isEditing = false;
        state.editingId = null;
        modalTitle.textContent = 'Nuevo Plan Turístico';
        planForm.reset();
        planModal.show();
    };
    
    const handleDelete = (id) => {
        const planToDelete = state.currentPlans.find(p => p.idLugarTuristico == id);
        if (!planToDelete) return;
        
        Swal.fire({
            title: `¿Estás seguro de eliminar "${planToDelete.nombreLugar}"?`,
            text: "¡No podrás revertir esta acción!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, ¡eliminar!',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deletePlan(id);
                    Swal.fire('¡Eliminado!', `El plan ha sido eliminado.`, 'success');
                    // Recargar en la página actual o ir a la primera si la página queda vacía
                    if (state.currentPlans.length === 1 && state.currentPage > 0) {
                        state.currentPage--;
                    }
                    loadPlans();
                } catch(error) {
                    Swal.fire('Error', `No se pudo eliminar el plan: ${error.message}`, 'error');
                }
            }
        });
    };

    // --- EVENT LISTENERS ---
    addPlanBtn.addEventListener('click', openModalForNew);
    planForm.addEventListener('submit', handleFormSubmit);

    tableBody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        if (editBtn) {
            openModalForEdit(editBtn.dataset.id);
        }
        if (deleteBtn) {
            handleDelete(deleteBtn.dataset.id);
        }
    });
    
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.currentPage = 0;
            loadPlans();
        }, 300); // Espera 300ms después de que el usuario deja de escribir
    });

    searchType.addEventListener('change', () => {
        state.currentPage = 0;
        loadPlans();
    });
    
    pageSizeSelect.addEventListener('change', () => {
        state.currentPage = 0;
        loadPlans();
    });
    
    paginationContainer.addEventListener('click', (e) => {
        const target = e.target.closest('button.page-link');
        if (target) {
            e.preventDefault();
            state.currentPage = parseInt(target.dataset.page, 10);
            loadPlans();
        }
    });

    // Carga inicial
    loadPlans();
});

