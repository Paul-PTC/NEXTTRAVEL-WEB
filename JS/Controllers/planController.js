import { 
    getLugares, 
    getMediaPorLugar,
    createLugar,
    // createMedia, // La subida de archivos real se simula por ahora
    updateLugar,
    deleteLugar 
} from '../Services/planService.js';

// --- LÓGICA DEL NAVBAR (Reutilizada) ---
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');
const themeToggleBtns = document.querySelectorAll('#theme-toggle, #theme-toggle-mobile');

if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
}
const setInitialTheme = () => {
    if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};
setInitialTheme();
themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('color-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
});
// --- FIN LÓGICA NAVBAR ---

document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS AL DOM ---
    const tableBody = document.getElementById('planes-table-body');
    const searchInput = document.getElementById('searchInput');
    const searchTypeSelect = document.getElementById('searchType');
    const pageSizeSelector = document.getElementById('pageSize');
    const paginationContainer = document.getElementById('pagination');
    const btnAddPlan = document.getElementById('btnAddPlan');
    
    // Modal y Formulario
    const modalElement = document.getElementById('planModal');
    const planModal = new bootstrap.Modal(modalElement);
    const modalLabel = document.getElementById('planModalLabel');
    const form = document.getElementById('planForm');
    const imageInput = document.getElementById('lugarImage');
    const imagePreview = document.getElementById('imagePreview');

    // --- ESTADO DE LA APLICACIÓN ---
    let state = {
        currentPage: 0,
        pageSize: 10,
        sort: 'idLugar,asc',
        searchTerm: '',
        searchType: 'nombre',
        totalPages: 0,
        isEditing: false,
        editingId: null,
        currentPlans: [] // Almacenar los planes actuales para edición rápida
    };
    
    // --- LÓGICA PRINCIPAL ---

    const loadPlans = async () => {
        if (!tableBody) return;
        tableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500">Cargando...</td></tr>`;

        try {
            const params = {
                page: state.currentPage,
                size: state.pageSize,
                sort: state.sort,
                search: state.searchTerm,
                type: state.searchType
            };
            const data = await getLugares(params);
            
            state.totalPages = data.totalPages;
            state.currentPlans = data.content || []; // Guardar los planes cargados
            renderTable(state.currentPlans);
            renderPagination();
        } catch (error) {
            console.error("Error al cargar planes:", error);
            tableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">Error al cargar datos.</td></tr>`;
        }
    };

    const renderTable = async (plans) => {
        tableBody.innerHTML = '';
        if (plans.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center">No se encontraron planes.</td></tr>`;
            return;
        }

        for (const plan of plans) {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-100 dark:hover:bg-gray-700";
            
            const media = await getMediaPorLugar(plan.nombreLugar);
            const imageUrl = media ? media.url : 'https://placehold.co/80x60/EFEFEF/AAAAAA?text=N/A';

            tr.innerHTML = `
                <td class="px-6 py-4 font-medium">${plan.idLugar}</td>
                <td class="px-6 py-4"><img src="${imageUrl}" alt="${plan.nombreLugar}" class="w-20 h-15 object-cover rounded-md"></td>
                <td class="px-6 py-4">${plan.nombreLugar}</td>
                <td class="px-6 py-4">${plan.ubicacion}</td>
                <td class="px-6 py-4">${plan.tipo}</td>
                <td class="px-6 py-4 text-center space-x-2">
                    <button class="edit-btn action-btn bg-yellow-100 text-yellow-800 p-2 rounded-full hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300" data-id="${plan.idLugar}" title="Editar"><i class="bi bi-pencil-square text-lg"></i></button>
                    <button class="delete-btn action-btn bg-red-100 text-red-800 p-2 rounded-full hover:bg-red-200 dark:bg-red-900 dark:text-red-300" data-id="${plan.idLugar}" title="Eliminar"><i class="bi bi-trash-fill text-lg"></i></button>
                </td>
            `;
            tableBody.appendChild(tr);
        }
    };
    
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const planData = {
            nombreLugar: formData.get('nombreLugar'),
            ubicacion: formData.get('ubicacion'),
            tipo: formData.get('tipo'), // CORREGIDO: Se usa 'tipo' en lugar de 'tipoLugar'
            descripcion: formData.get('descripcion')
        };
        
        try {
            let savedPlan;
            if (state.isEditing) {
                savedPlan = await updateLugar(state.editingId, planData);
            } else {
                const response = await createLugar(planData);
                savedPlan = response.data;
            }

            if (imageInput.files.length > 0) {
                console.log(`Simulando subida de imagen para el lugar ID: ${savedPlan.idLugar}`);
            }

            planModal.hide();
            Swal.fire('¡Éxito!', `El plan ha sido ${state.isEditing ? 'actualizado' : 'creado'}.`, 'success');
            
            // MEJORA: Limpiar búsqueda para asegurar que el nuevo item sea visible
            searchInput.value = '';
            state.searchTerm = '';
            
            loadPlans();

        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    const openModalForEdit = async (id) => {
        // MEJORA: Buscar el plan en el estado actual en lugar de hacer una nueva llamada a la API
        const planToEdit = state.currentPlans.find(p => p.idLugar == id);

        if (!planToEdit) {
             Swal.fire('Error', 'No se pudo encontrar el plan para editar.', 'error');
             return;
        }

        state.isEditing = true;
        state.editingId = id;
        modalLabel.textContent = 'Editar Plan Turístico';
        
        form.lugarId.value = planToEdit.idLugar;
        form.nombreLugar.value = planToEdit.nombreLugar;
        form.ubicacion.value = planToEdit.ubicacion;
        form.tipo.value = planToEdit.tipo; // CORREGIDO: El id del input es 'tipo'
        form.descripcion.value = planToEdit.descripcion;

        const media = await getMediaPorLugar(planToEdit.nombreLugar);
        imagePreview.src = media ? media.url : 'https://placehold.co/600x400/EFEFEF/AAAAAA?text=Imagen';

        planModal.show();
    };

    const openModalForNew = () => {
        state.isEditing = false;
        state.editingId = null;
        modalLabel.textContent = 'Crear Nuevo Plan Turístico';
        form.reset();
        imagePreview.src = 'https://placehold.co/600x400/EFEFEF/AAAAAA?text=Imagen';
        planModal.show();
    };
    
    const handleDelete = (id) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `Esta acción no se puede revertir.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sí, eliminar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteLugar(id);
                    Swal.fire('Eliminado', 'El plan ha sido eliminado.', 'success');
                    loadPlans();
                } catch (error) {
                    Swal.fire('Error', error.message, 'error');
                }
            }
        });
    };

    // --- EVENT LISTENERS ---
    btnAddPlan.addEventListener('click', openModalForNew);
    form.addEventListener('submit', handleFormSubmit);

    tableBody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) openModalForEdit(editBtn.dataset.id);

        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) handleDelete(deleteBtn.dataset.id);
    });
    
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.searchTerm = searchInput.value.trim();
            state.currentPage = 0;
            loadPlans();
        }, 300);
    });

    searchTypeSelect.addEventListener('change', () => {
        state.searchType = searchTypeSelect.value;
        state.currentPage = 0;
        if(state.searchTerm) loadPlans();
    });
    
    pageSizeSelector.addEventListener('change', () => {
        state.pageSize = parseInt(pageSizeSelector.value);
        state.currentPage = 0;
        loadPlans();
    });
    
    paginationContainer.addEventListener('click', (e) => {
        const target = e.target.closest('button.page-link');
        if (target && target.dataset.page) {
            e.preventDefault();
            state.currentPage = parseInt(target.dataset.page, 10);
            loadPlans();
        }
    });

    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (file) {
            imagePreview.src = URL.createObjectURL(file);
        }
    });

    function renderPagination() {
        paginationContainer.innerHTML = "";
        const { currentPage, totalPages } = state;
        if (totalPages <= 1) return;

        const createLink = (page, text, disabled = false, active = false) => {
            const li = document.createElement('li');
            li.innerHTML = `<button class="page-link relative block py-1.5 px-3 rounded border-0 outline-none transition-all duration-300 ${
                active ? 'bg-blue-600 text-white' : 'bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
            } ${disabled ? 'text-gray-400 pointer-events-none' : ''}" data-page="${page}">${text}</button>`;
            return li;
        };
        
        paginationContainer.appendChild(createLink(currentPage - 1, 'Anterior', currentPage === 0));
        for (let i = 0; i < totalPages; i++) {
            paginationContainer.appendChild(createLink(i, i + 1, false, i === currentPage));
        }
        paginationContainer.appendChild(createLink(currentPage + 1, 'Siguiente', currentPage >= totalPages - 1));
    }

    loadPlans();
});

