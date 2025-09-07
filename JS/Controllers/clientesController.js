// --- LÓGICA DEL NAVBAR (Idéntica a la de clientes) ---
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');
const themeToggleBtns = document.querySelectorAll('#theme-toggle, #theme-toggle-mobile');

if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
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
    btn.addEventListener('click', function () {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('color-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
});

document.querySelectorAll('[data-dropdown-button]').forEach(button => {
    button.addEventListener('click', (event) => {
        event.stopPropagation();
        const menu = button.nextElementSibling;
        const isHidden = menu.classList.contains('hidden');
        document.querySelectorAll('[data-dropdown-menu]').forEach(m => m.classList.add('hidden'));
        if (isHidden) menu.classList.remove('hidden');
    });
});
window.addEventListener('click', () => {
    document.querySelectorAll('[data-dropdown-menu]').forEach(menu => menu.classList.add('hidden'));
});

document.querySelectorAll('[data-collapse-button]').forEach(button => {
    button.addEventListener('click', () => {
        const collapseId = button.getAttribute('data-collapse-button');
        const collapseContent = document.getElementById(collapseId);
        collapseContent.classList.toggle('hidden');
    });
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { getClientes, getClienteByDui, createCliente, updateCliente, deleteCliente } from '../Services/clientesServices.js';

// Variables globales
let currentPage = 0;
let currentSize = 10;
let currentSearchQuery = '';
let currentSearchType = 'dui'; 
let currentSort = 'fechaRegistro,desc';

const showAlert = (icon, title, text) => {
    Swal.fire({
        icon,
        title,
        text,
        customClass: {
            container: 'dark:bg-gray-900',
            popup: 'bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 backdrop-blur-xl shadow-2xl rounded-xl',
            title: 'text-gray-900 dark:text-white',
        }
    });
};

document.addEventListener("DOMContentLoaded", () => {
    // Referencias a los elementos del DOM
    const addClientBtn = document.getElementById('addClientBtn');
    const clientModal = new bootstrap.Modal(document.getElementById('clientModal'));
    const clientForm = document.getElementById('clientForm');
    const clientTableBody = document.getElementById('client-table-body');
    const searchInput = document.getElementById('searchInput');
    const searchType = document.getElementById('searchType');
    const pageSizeSelect = document.getElementById('pageSize');
    const paginationUl = document.getElementById('pagination');
    const modalTitle = document.getElementById('clientModalLabel');
    const clientIdInput = document.getElementById('clientId');
    
    // Asignar referencias a los nuevos campos del formulario
    const clientDuiInput = document.getElementById('clientDui');
    const idUsuarioInput = document.getElementById('idUsuario');
    const clientPhoneInput = document.getElementById('clientPhone');
    const clientAddressInput = document.getElementById('clientAddress');
    const clientPointsInput = document.getElementById('clientPoints');

    // Nuevas referencias para los campos de fecha y ordenación
    const fechaDesdeInput = document.getElementById('fechaDesde');
    const fechaHastaInput = document.getElementById('fechaHasta');
    const sortSelect = document.getElementById('sortSelect');
    const searchSection = document.getElementById('searchSection');
    const fechaSection = document.getElementById('fechaSection');


    // Maneja el cambio de tipo de búsqueda (texto vs. fecha)
    searchType.addEventListener('change', () => {
        currentSearchType = searchType.value;
        
        if (currentSearchType === 'fechaRegistro') {
            if (searchSection) searchSection.classList.add('hidden');
            if (fechaSection) fechaSection.classList.remove('hidden');
            if (searchInput) searchInput.value = '';
        } else {
            if (searchSection) searchSection.classList.remove('hidden');
            if (fechaSection) fechaSection.classList.add('hidden');
            if (fechaDesdeInput) fechaDesdeInput.value = '';
            if (fechaHastaInput) fechaHastaInput.value = '';
        }
        currentSearchQuery = '';
        currentPage = 0;
        cargarClientes();
    });

    // Maneja la búsqueda al escribir
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentSearchQuery = searchInput.value;
            currentPage = 0;
            cargarClientes();
        });
    }

    // Maneja la búsqueda al cambiar fechas
    if (fechaDesdeInput && fechaHastaInput) {
        fechaDesdeInput.addEventListener('change', () => {
            if (fechaDesdeInput.value && fechaHastaInput.value) {
                currentSearchQuery = `${fechaDesdeInput.value}|${fechaHastaInput.value}`;
                currentPage = 0;
                cargarClientes();
            }
        });

        fechaHastaInput.addEventListener('change', () => {
            if (fechaDesdeInput.value && fechaHastaInput.value) {
                currentSearchQuery = `${fechaDesdeInput.value}|${fechaHastaInput.value}`;
                currentPage = 0;
                cargarClientes();
            }
        });
    }

    // Cambia la cantidad de registros por página
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener("change", () => {
            currentSize = parseInt(pageSizeSelect.value);
            currentPage = 0;
            cargarClientes();
        });
    }

    // Cambia el criterio de ordenación
    if (sortSelect) {
        sortSelect.addEventListener("change", () => {
            currentSort = sortSelect.value;
            currentPage = 0;
            cargarClientes();
        });
    }

    // Botón para agregar, que resetea el formulario y abre el modal
    if (addClientBtn) {
        addClientBtn.addEventListener('click', () => {
            limpiarFormulario();
            modalTitle.textContent = 'Agregar Nuevo Cliente';
            if (clientDuiInput) clientDuiInput.removeAttribute('readonly');
            clientModal.show();
        });
    }

    // Evento de submit para el formulario (crear o editar)
    if (clientForm) {
        clientForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            await guardarCliente();
        });
    }

    // Delegación de eventos para los botones de editar y eliminar
    if (clientTableBody) {
        clientTableBody.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            const dui = button?.dataset.id;
            if (!dui) return;
            if (button.classList.contains('edit-btn')) {
                setFormulario(dui);
            } else if (button.classList.contains('delete-btn')) {
                confirmarEliminarCliente(dui);
            }
        });
    }

    // --- Funciones del controlador ---

    async function cargarClientes() {
        try {
            const response = await getClientes(currentPage, currentSize, currentSort, currentSearchType, currentSearchQuery);
            
            if (response && response.content) {
                const { content: clientes, totalElements: totalClientes } = response;
                renderizarClientes(clientes.filter(c => c !== null)); 
                renderizarPaginacion(totalClientes, currentSize, currentPage + 1);
            } else {
                renderizarClientes([]);
                renderizarPaginacion(0, currentSize, 1);
            }
        } catch (error) {
            console.error('Error al cargar los clientes:', error);
            showAlert('error', 'Error', 'No se pudieron cargar los clientes. Por favor, intente de nuevo más tarde.');
            renderizarClientes([]);
            renderizarPaginacion(0, currentSize, 1);
        }
    }

    async function guardarCliente() {
        const isEditing = !!clientIdInput.value;
        const clientData = {
            dui: clientDuiInput.value,
            idUsuario: Number(idUsuarioInput.value),
            telefono: clientPhoneInput.value,
            direccion: clientAddressInput.value,
    
            puntosActuales: Number(clientPointsInput.value),
        };

        try {
            let res;
            if (isEditing) {
                res = await updateCliente(clientIdInput.value, clientData);
            } else {
                res = await createCliente(clientData);
            }

            // Manejo de la respuesta
            if (res.ok) {
                showAlert('success', 'Éxito', `Cliente ${isEditing ? 'actualizado' : 'creado'} correctamente.`);
                clientModal.hide();
                await cargarClientes();
            } else {
                const errorData = await res.json();
                const message = errorData.message || (isEditing ? 'No se pudo actualizar el cliente.' : 'No se pudo crear el cliente.');
                showAlert('error', 'Error', message);
            }
        } catch (error) {
            console.error('Error al guardar el cliente:', error);
            const errorMessage = error.message || 'Error de conexión. Intente de nuevo más tarde.';
            showAlert('error', 'Error', errorMessage);
        }
    }

    async function confirmarEliminarCliente(dui) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede revertir!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar!',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 backdrop-blur-xl shadow-2xl rounded-xl',
                title: 'text-gray-900 dark:text-white',
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await deleteCliente(dui);
                    if (res.ok) {
                        showAlert('success', 'Eliminado!', 'El cliente ha sido eliminado.');
                        await cargarClientes();
                    } else {
                        const errorData = await res.json();
                        const message = errorData.error || 'No se pudo eliminar el cliente.';
                        showAlert('error', 'Error', message);
                    }
                } catch (error) {
                    console.error('Error al eliminar:', error);
                    const errorMessage = error.message || 'No se pudo eliminar el cliente.';
                    showAlert('error', 'Error', errorMessage);
                }
            }
        });
    }

    async function setFormulario(dui) {
        try {
            const client = await getClienteByDui(dui);
            if (client) {
                modalTitle.textContent = 'Editar Cliente';
                clientIdInput.value = client.dui;
                clientDuiInput.value = client.dui;
                clientDuiInput.setAttribute('readonly', true); 
                idUsuarioInput.value = client.idUsuario;
                clientPhoneInput.value = client.telefono;
                clientAddressInput.value = client.direccion;
                clientPointsInput.value = client.puntosActuales;
                clientModal.show();
            } else {
                showAlert('error', 'Error', 'Cliente no encontrado.');
            }
        } catch (error) {
            console.error('Error al obtener los datos del cliente:', error);
            const errorMessage = error.message || 'No se pudo cargar el cliente para editar.';
            showAlert('error', 'Error', errorMessage);
        }
    }

    function limpiarFormulario() {
        clientForm.reset();
        clientIdInput.value = '';
        clientDuiInput.removeAttribute('readonly');
    }

    function renderizarClientes(clients) {
        clientTableBody.innerHTML = '';
        if (!clients || !Array.isArray(clients) || clients.length === 0) {
            clientTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No hay clientes para mostrar.
                    </td>
                </tr>
            `;
            return;
        }

        clients.forEach(client => {
            const tr = document.createElement("tr");
            tr.className = "bg-white/40 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-colors";

            const tdDui = document.createElement("td");
            tdDui.className = "px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap";
            tdDui.textContent = client.dui;
            tr.appendChild(tdDui);

            // ⚠️ LÍNEA CORREGIDA AQUI ⚠️
            const tdIdUsuario = document.createElement("td");
            tdIdUsuario.className = "px-6 py-4";
            tdIdUsuario.textContent = client.idUsuario; 
            tr.appendChild(tdIdUsuario);
            
            const tdTelefono = document.createElement("td");
            tdTelefono.className = "px-6 py-4";
            tdTelefono.textContent = client.telefono;
            tr.appendChild(tdTelefono);

            const tdDireccion = document.createElement("td");
            tdDireccion.className = "px-6 py-4";
            tdDireccion.textContent = client.direccion;
            tr.appendChild(tdDireccion);
            
            const tdPuntos = document.createElement("td");
            tdPuntos.className = "px-6 py-4";
            tdPuntos.textContent = client.puntosActuales || 0;
            tr.appendChild(tdPuntos);

            const tdFecha = document.createElement("td");
            tdFecha.className = "px-6 py-4";
            tdFecha.textContent = new Date(client.fechaRegistro).toLocaleDateString();
            tr.appendChild(tdFecha);

            const tdBtns = document.createElement("td");
            tdBtns.className = "px-6 py-4 text-center";
            tdBtns.innerHTML = `
                <div class="flex items-center justify-center space-x-2">
                    <button class="edit-btn text-blue-600 hover:text-blue-800 transition-colors" data-id="${client.dui}">
                        <i class="bi bi-pencil-square text-lg"></i>
                    </button>
                    <button class="delete-btn text-red-600 hover:text-red-800 transition-colors" data-id="${client.dui}">
                        <i class="bi bi-trash-fill text-lg"></i>
                    </button>
                </div>
            `;
            tr.appendChild(tdBtns);
            clientTableBody.appendChild(tr);
        });
    }

    function renderizarPaginacion(totalItems, itemsPerPage, current) {
        paginationUl.innerHTML = "";
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        const prev = document.createElement("li");
        prev.className = `page-item ${current === 1 ? "disabled" : ""}`;
        const prevLink = document.createElement("a");
        prevLink.className = "page-link relative block py-2 px-3 text-sm rounded-lg border border-gray-300 bg-white leading-tight text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors";
        prevLink.href = "#";
        prevLink.textContent = "«";
        prevLink.addEventListener("click", (e) => {
            e.preventDefault();
            if (current > 1) {
                currentPage = current - 2;
                cargarClientes();
            }
        });
        prev.appendChild(prevLink);
        paginationUl.appendChild(prev);

        let startPage = Math.max(1, current - 2);
        let endPage = Math.min(totalPages, current + 2);

        if (current <= 3) {
            endPage = Math.min(totalPages, 5);
        }
        if (current > totalPages - 2) {
            startPage = Math.max(1, totalPages - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            const li = document.createElement("li");
            li.className = `page-item ${i === current ? "active" : ""}`;
            const link = document.createElement("a");
            link.className = "page-link relative block py-2 px-3 text-sm rounded-lg border border-gray-300 bg-white leading-tight text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors";
            link.href = "#";
            link.textContent = i;
            link.addEventListener("click", (e) => {
                e.preventDefault();
                currentPage = i - 1;
                cargarClientes();
            });
            li.appendChild(link);
            paginationUl.appendChild(li);
        }

        const next = document.createElement("li");
        next.className = `page-item ${current >= totalPages ? "disabled" : ""}`;
        const nextLink = document.createElement("a");
        nextLink.className = "page-link relative block py-2 px-3 text-sm rounded-lg border border-gray-300 bg-white leading-tight text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors";
        nextLink.href = "#";
        nextLink.textContent = "»";
        nextLink.addEventListener("click", (e) => {
            e.preventDefault();
            if (current < totalPages) {
                currentPage = current;
                cargarClientes();
            }
        });
        next.appendChild(nextLink);
        paginationUl.appendChild(next);
    }

    cargarClientes();
});