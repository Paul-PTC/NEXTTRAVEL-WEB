import { getReservas, deleteReserva, getEstados, updateEstadoReserva, createReserva } from './reservasService.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS AL DOM ---
    const tableBody = document.getElementById('reservas-table-body');
    const searchInput = document.getElementById('searchInput');
    const paginationContainer = document.getElementById('pagination');
    const pageInfo = document.getElementById('pageInfo');
    
    // Modal y Formulario de Estado
    const estadoForm = document.getElementById('estadoForm');
    const estadoSelect = document.getElementById('estadoSelect');
    const reservaIdHiddenInput = document.getElementById('reservaIdHidden');
    const estadoModalLabel = document.getElementById('estadoModalLabel');

    // Botón para agregar nueva reserva (funcionalidad futura)
    const addReservaBtn = document.getElementById('addReservaBtn');

    // --- ESTADO DE LA APLICACIÓN ---
    let state = {
        currentPage: 0,
        pageSize: 10,
        sort: 'fechaReserva,desc',
        searchTerm: '',
        searchType: 'cliente',
        totalPages: 0,
        estados: [] // Almacenará los estados de viaje
    };

    // --- CARGA INICIAL ---
    loadInitialData();

    async function loadInitialData() {
        await loadEstados();
        await loadReservas();
    }
    
    // --- LÓGICA DE CARGA DE DATOS ---
    async function loadReservas() {
        try {
            // Lógica simple para determinar el tipo de búsqueda
            const searchTerm = state.searchTerm.toLowerCase();
            const knownStates = state.estados.map(s => s.nombreEstado.toLowerCase());
            if (/^\d{8}-\d$/.test(searchTerm)) {
                state.searchType = 'dui';
            } else if (knownStates.includes(searchTerm)) {
                state.searchType = 'estado';
            } else {
                state.searchType = 'cliente'; // Búsqueda por defecto
            }

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
            renderPageInfo(data);
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-red-500">${error.message}</td></tr>`;
        }
    }

    async function loadEstados() {
        try {
            const data = await getEstados();
            state.estados = data || []; // Asumiendo que la API devuelve un array directamente
            estadoSelect.innerHTML = state.estados.map(e => `<option value="${e.idEstado}">${e.nombreEstado}</option>`).join('');
        } catch (error) {
            estadoSelect.innerHTML = `<option value="">Error al cargar estados</option>`;
        }
    }

    // --- RENDERIZADO DE LA UI ---
    
    function renderTable(reservas) {
        tableBody.innerHTML = '';
        if (reservas.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-yinmn-blue dark:text-silver-lake-blue">No se encontraron reservas.</td></tr>`;
            return;
        }

        const estadoColors = {
            'Pendiente': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400',
            'Confirmada': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400',
            'Cancelada': 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-400',
            'En Viaje': 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-400',
            'Completada': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        };

        reservas.forEach(reserva => {
            const tr = document.createElement('tr');
            tr.className = "border-b dark:border-rich-black";
            
            tr.innerHTML = `
                <td class="px-6 py-4 font-semibold">${reserva.idReserva}</td>
                <td class="px-6 py-4">${reserva.nombre_cliente || 'N/A'}</td>
                <td class="px-6 py-4">${reserva.lugar || 'N/A'}</td>
                <td class="px-6 py-4 text-center">${reserva.cantidadPersonas}</td>
                <td class="px-6 py-4">${new Date(reserva.fechaReserva).toLocaleDateString('es-SV')}</td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${estadoColors[reserva.estado_actual] || estadoColors['Completada']}">
                        ${reserva.estado_actual}
                    </span>
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center space-x-2">
                        <button class="edit-btn p-2 bg-silver-lake-blue/20 hover:bg-silver-lake-blue/40 text-yinmn-blue dark:bg-yinmn-blue/30 dark:hover:bg-yinmn-blue/50 dark:text-platinum rounded-lg transition-colors" data-id="${reserva.idReserva}" title="Editar Estado">
                            <i data-lucide="file-pen-line" class="w-5 h-5 pointer-events-none"></i>
                        </button>
                        <button class="delete-btn p-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg transition-colors" data-id="${reserva.idReserva}" title="Eliminar Reserva">
                            <i data-lucide="trash-2" class="w-5 h-5 pointer-events-none"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
        lucide.createIcons();
    }

    function renderPagination() {
        paginationContainer.innerHTML = '';
        if (state.totalPages <= 1) return;
        
        const createPageLink = (page, text, isDisabled = false, isActive = false) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.innerHTML = text;
            a.className = `relative block py-2 px-3 text-sm rounded-lg border transition-colors ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${
                isActive 
                ? 'bg-yinmn-blue border-yinmn-blue text-white' 
                : 'bg-white dark:bg-oxford-blue border-platinum dark:border-rich-black text-yinmn-blue dark:text-silver-lake-blue hover:bg-platinum/80 dark:hover:bg-rich-black/80'
            }`;
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

        paginationContainer.appendChild(createPageLink(state.currentPage - 1, '«', state.currentPage === 0));
        for (let i = 0; i < state.totalPages; i++) {
            paginationContainer.appendChild(createPageLink(i, i + 1, false, state.currentPage === i));
        }
        paginationContainer.appendChild(createPageLink(state.currentPage + 1, '»', state.currentPage >= state.totalPages - 1));
    }

    function renderPageInfo(data) {
        const { totalElements = 0, number = 0, size = 10 } = data;
        if (totalElements === 0) {
            pageInfo.textContent = "Sin resultados";
            return;
        }
        const from = number * size + 1;
        const to = Math.min(totalElements, (number + 1) * size);
        pageInfo.textContent = `Mostrando ${from}-${to} de ${totalElements}`;
    }

    // --- EVENT HANDLERS ---
    
    // Formulario de cambio de estado
    estadoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idReserva = reservaIdHiddenInput.value;
        const idEstado = estadoSelect.value;
        try {
            await updateEstadoReserva(idReserva, idEstado);
            closeModal(); // Función global del HTML
            showAlert('¡Éxito!', 'El estado de la reserva ha sido actualizado.', 'success');
            loadReservas();
        } catch (error) {
            showAlert('Error', error.message, 'error');
        }
    });

    // Delegación de eventos para la tabla
    tableBody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            const id = editBtn.dataset.id;
            reservaIdHiddenInput.value = id;
            estadoModalLabel.textContent = `Cambiar Estado de Reserva #${id}`;
            openModal(); // Función global del HTML
        }

        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            handleDelete(id);
        }
    });
    
    // Búsqueda
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.currentPage = 0;
            state.searchTerm = searchInput.value.trim();
            loadReservas();
        }, 400);
    });
    
    // Botón para agregar (funcionalidad no implementada en este modal)
    addReservaBtn.addEventListener('click', () => {
        // Aquí se abriría un modal diferente para CREAR una reserva.
        // Por ahora, solo muestra una alerta.
        showAlert('Información', 'La creación de nuevas reservas se gestiona desde otro módulo.', 'info');
    });

    const handleDelete = (id) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `La reserva #${id} será eliminada permanentemente.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sí, eliminar',
            customClass: {
                popup: 'bg-white dark:bg-oxford-blue text-rich-black dark:text-platinum backdrop-blur-xl shadow-2xl rounded-xl',
                title: 'text-rich-black dark:text-white',
                htmlContainer: 'text-yinmn-blue dark:text-silver-lake-blue'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteReserva(id);
                    showAlert('Eliminada', 'La reserva ha sido eliminada.', 'success');
                    loadReservas();
                } catch (error) {
                    showAlert('Error', error.message, 'error');
                }
            }
        });
    };

    const showAlert = (title, text, icon) => {
        Swal.fire({ title, text, icon,
            customClass: {
                popup: 'bg-white dark:bg-oxford-blue text-rich-black dark:text-platinum backdrop-blur-xl shadow-2xl rounded-xl',
                title: 'text-rich-black dark:text-white',
                htmlContainer: 'text-yinmn-blue dark:text-silver-lake-blue'
            }
        });
    };
});
