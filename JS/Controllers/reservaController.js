import { getReservas, deleteReserva, getEstados, createEstadoViaje } from './reservasService.js';

// --- LÓGICA DEL NAVBAR ---
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');
const themeToggleBtns = document.querySelectorAll('#theme-toggle, #theme-toggle-mobile');
if (mobileMenuButton) mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
const setInitialTheme = () => {
    if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else { document.documentElement.classList.remove('dark'); }
};
setInitialTheme();
themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('color-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
});
// --- FIN NAVBAR ---

document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS AL DOM ---
    const tableBody = document.getElementById('reservas-table-body');
    const searchInput = document.getElementById('searchInput');
    const searchTypeSelect = document.getElementById('searchType');
    const pageSizeSelector = document.getElementById('pageSize');
    const paginationContainer = document.getElementById('pagination');
    
    // Modal y Formulario
    const modalElement = document.getElementById('estadoModal');
    const estadoModal = new bootstrap.Modal(modalElement);
    const modalLabel = document.getElementById('estadoModalLabel');
    const form = document.getElementById('estadoForm');
    const estadoSelect = document.getElementById('estadoSelect');
    const reservaIdInput = document.getElementById('reservaId');

    // --- ESTADO DE LA APLICACIÓN ---
    let state = {
        currentPage: 0,
        pageSize: 10,
        sort: 'fechaReserva,desc',
        searchTerm: '',
        searchType: 'cliente',
        totalPages: 0,
        estados: []
    };
    
    const loadReservas = async () => {
        try {
            const params = {
                page: state.currentPage,
                size: state.pageSize,
                sort: state.sort,
                search: state.searchTerm,
                type: state.searchType
            };
            const data = await getReservas(params);
            
            state.totalPages = data.totalPages;
            renderTable(data.content || []);
            renderPagination();
        } catch (error) {
            console.error("Error al cargar reservas:", error);
            tableBody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-red-500">${error.message}</td></tr>`;
        }
    };

    const renderTable = (reservas) => {
        tableBody.innerHTML = '';
        if (reservas.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="p-4 text-center">No se encontraron reservas.</td></tr>`;
            return;
        }

        reservas.forEach(reserva => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-100 dark:hover:bg-gray-700";
            
            const fecha = new Date(reserva.fechaReserva).toLocaleDateString('es-SV', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            tr.innerHTML = `
                <td class="px-6 py-4 font-medium">${reserva.idReserva}</td>
                <td class="px-6 py-4">${reserva.nombreCliente}</td>
                <td class="px-6 py-4">${reserva.lugar}</td>
                <td class="px-6 py-4">${fecha}</td>
                <td class="px-6 py-4 text-center">${reserva.cantidadPersonas}</td>
                <td class="px-6 py-4"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">${reserva.estadoActual}</span></td>
                <td class="px-6 py-4 text-center space-x-2">
                    <button class="edit-btn action-btn bg-yellow-100 text-yellow-800 p-2 rounded-full hover:bg-yellow-200" data-id="${reserva.idReserva}" title="Editar Estado"><i class="bi bi-pencil-square text-lg"></i></button>
                    <button class="delete-btn action-btn bg-red-100 text-red-800 p-2 rounded-full hover:bg-red-200" data-id="${reserva.idReserva}" title="Eliminar Reserva"><i class="bi bi-trash-fill text-lg"></i></button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    };
    
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const idReserva = reservaIdInput.value;
        const idEstado = estadoSelect.value;
        
        try {
            await createEstadoViaje({ idReserva, idEstado });
            estadoModal.hide();
            Swal.fire('¡Éxito!', 'El estado del viaje ha sido actualizado.', 'success');
            loadReservas();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };
    
    const openModalForEdit = (id) => {
        reservaIdInput.value = id;
        modalLabel.textContent = `Cambiar Estado de Reserva #${id}`;
        estadoModal.show();
    };
    
    const handleDelete = (id) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `La reserva #${id} será eliminada permanentemente.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sí, eliminar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteReserva(id);
                    Swal.fire('Eliminada', 'La reserva ha sido eliminada.', 'success');
                    loadReservas();
                } catch (error) {
                    Swal.fire('Error', error.message, 'error');
                }
            }
        });
    };

    const loadEstados = async () => {
        try {
            const data = await getEstados(); // Espera DTOs de Estado con idEstado y nombreEstado
            state.estados = data.content || [];
            estadoSelect.innerHTML = state.estados.map(e => `<option value="${e.idEstado}">${e.nombreEstado}</option>`).join('');
        } catch (error) {
            console.error('Error al cargar estados:', error);
            estadoSelect.innerHTML = `<option value="">Error al cargar</option>`;
        }
    };
    
    const renderPagination = () => {
        // Lógica de renderizado de paginación (igual a la de otros controladores)
        paginationContainer.innerHTML = '';
        if (state.totalPages <= 1) return;
        
        const createPageLink = (page, text, isDisabled = false) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = text;
            a.className = `page-link py-2 px-3 leading-tight border transition-colors ${isDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`;
            if (!isDisabled) {
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    state.currentPage = page;
                    loadReservas();
                });
            }
            li.appendChild(a);
            return li;
        };

        paginationContainer.appendChild(createPageLink(state.currentPage - 1, 'Anterior', state.currentPage === 0));

        for (let i = 0; i < state.totalPages; i++) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = i + 1;
            a.className = `page-link py-2 px-3 leading-tight border ${state.currentPage === i ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                state.currentPage = i;
                loadReservas();
            });
            li.appendChild(a);
            paginationContainer.appendChild(li);
        }

        paginationContainer.appendChild(createPageLink(state.currentPage + 1, 'Siguiente', state.currentPage >= state.totalPages - 1));
    };

    // --- EVENT LISTENERS ---
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
            state.currentPage = 0;
            state.searchTerm = searchInput.value.trim();
            loadReservas();
        }, 300);
    });

    searchTypeSelect.addEventListener('change', () => {
        state.searchType = searchTypeSelect.value;
        loadReservas();
    });
    
    pageSizeSelector.addEventListener('change', () => {
        state.pageSize = parseInt(pageSizeSelector.value, 10);
        state.currentPage = 0;
        loadReservas();
    });
    
    // Cargas iniciales
    loadReservas();
    loadEstados();
});
