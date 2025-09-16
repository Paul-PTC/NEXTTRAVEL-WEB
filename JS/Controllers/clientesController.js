import { getClientes, getClienteByDui, createCliente, updateCliente, deleteCliente } from '../Services/clientesServices.js';

// --- Variables globales para estado de la UI ---
let currentPage = 0;
let currentSize = 10; // Este valor se podría conectar a un <select> si se añade en el futuro.
let currentSearchQuery = '';
let currentSort = 'fechaRegistro,desc'; // Valor por defecto para la ordenación.

// --- Función para mostrar alertas con SweetAlert2 ---
const showAlert = (icon, title, text) => {
    Swal.fire({
        icon,
        title,
        text,
        customClass: {
            container: 'dark:bg-rich-black/50',
            popup: 'bg-white dark:bg-oxford-blue text-rich-black dark:text-platinum backdrop-blur-xl shadow-2xl rounded-xl',
            title: 'text-rich-black dark:text-white',
            htmlContainer: 'text-yinmn-blue dark:text-silver-lake-blue'
        }
    });
};

document.addEventListener("DOMContentLoaded", () => {
    // --- Referencias a los elementos del DOM ---
    const clientTableBody = document.getElementById('client-table-body');
    const searchInput = document.getElementById('searchInput');
    const paginationUl = document.getElementById('pagination');
    
    // Referencias al Modal (manejado por funciones globales en el HTML)
    const clientForm = document.getElementById('clientForm');
    const modalTitle = document.getElementById('clientModalLabel');
    const clientIdInput = document.getElementById('clientId');
    const clientDuiInput = document.getElementById('clientDui');
    const idUsuarioInput = document.getElementById('idUsuario');
    const clientPhoneInput = document.getElementById('clientPhone');
    const clientAddressInput = document.getElementById('clientAddress');
    const clientPointsInput = document.getElementById('clientPoints');

    // --- Lógica de Búsqueda Simplificada ---
    // Se dispara al escribir en la única barra de búsqueda.
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearchQuery = searchInput.value;
                currentPage = 0;
                cargarClientes();
            }, 500); // Pequeño retraso para no llamar a la API en cada tecla.
        });
    }

    // --- Lógica del Formulario y Modal (ya no usa Bootstrap) ---
    // Las funciones openModal() y closeModal() están definidas en el HTML.
    
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
            if (!button) return;

            const dui = button.dataset.id;
            if (!dui) return;

            if (button.classList.contains('edit-btn')) {
                setFormulario(dui);
            } else if (button.classList.contains('delete-btn')) {
                confirmarEliminarCliente(dui);
            }
        });
    }

    // --- Funciones del Controlador ---

    async function cargarClientes() {
        try {
            // Se asume que la API puede manejar una búsqueda por DUI o un listado general.
            // La lógica del service ya maneja esto. Aquí se simplifica la llamada.
            const searchType = /^\d{8}-\d$/.test(currentSearchQuery) ? 'dui' : 'direccion'; // Busca por dirección como fallback
            const response = await getClientes(currentPage, currentSize, currentSort, searchType, currentSearchQuery);
            
            if (response && response.content) {
                renderizarClientes(response.content.filter(c => c !== null)); 
                renderizarPaginacion(response.totalElements, currentSize, currentPage + 1);
            } else {
                renderizarClientes([]);
                renderizarPaginacion(0, currentSize, 1);
            }
        } catch (error) {
            console.error('Error al cargar los clientes:', error);
            showAlert('error', 'Error', 'No se pudieron cargar los clientes.');
            renderizarClientes([]);
            renderizarPaginacion(0, currentSize, 1);
        }
    }
    
    // --- Lógica CRUD ---

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
            const res = isEditing
                ? await updateCliente(clientIdInput.value, clientData)
                : await createCliente(clientData);

            if (res.ok) {
                showAlert('success', 'Éxito', `Cliente ${isEditing ? 'actualizado' : 'creado'} correctamente.`);
                closeModal(); // Usa la función global del HTML
                await cargarClientes();
            } else {
                const errorData = await res.json();
                showAlert('error', 'Error', errorData.message || 'No se pudo guardar el cliente.');
            }
        } catch (error) {
            showAlert('error', 'Error', error.message || 'Error de conexión.');
        }
    }

    async function confirmarEliminarCliente(dui) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede revertir.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#415a77', // yinmn-blue
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: {
                 popup: 'bg-white dark:bg-oxford-blue text-rich-black dark:text-platinum backdrop-blur-xl shadow-2xl rounded-xl',
                 title: 'text-rich-black dark:text-white',
                 htmlContainer: 'text-yinmn-blue dark:text-silver-lake-blue'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await deleteCliente(dui);
                    if (res.ok) {
                        showAlert('success', 'Eliminado', 'El cliente ha sido eliminado.');
                        await cargarClientes();
                    } else {
                        const errorData = await res.json();
                        showAlert('error', 'Error', errorData.error || 'No se pudo eliminar el cliente.');
                    }
                } catch (error) {
                    showAlert('error', 'Error', error.message || 'No se pudo eliminar el cliente.');
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
                clientPointsInput.value = client.puntosActuales || 0;
                openModal(); // Usa la función global del HTML
            } else {
                showAlert('error', 'Error', 'Cliente no encontrado.');
            }
        } catch (error) {
            showAlert('error', 'Error', error.message || 'No se pudo cargar el cliente para editar.');
        }
    }

    function limpiarFormulario() {
        clientForm.reset();
        clientIdInput.value = '';
        clientDuiInput.removeAttribute('readonly');
    }

    // --- Funciones de Renderizado ---

    function renderizarClientes(clients) {
        clientTableBody.innerHTML = '';
        if (!clients || clients.length === 0) {
            clientTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-yinmn-blue dark:text-silver-lake-blue">
                        No se encontraron clientes.
                    </td>
                </tr>`;
            return;
        }

        clients.forEach(client => {
            const tr = document.createElement("tr");
            tr.className = "border-b dark:border-rich-black";

            tr.innerHTML = `
                <td class="px-6 py-4 font-medium flex items-center space-x-3">
                    <img src="https://placehold.co/40x40/778da9/ffffff?text=${client.nombreUsuario ? client.nombreUsuario.charAt(0) : 'U'}" class="w-10 h-10 rounded-full" alt="Avatar">
                    <span class="dark:text-white">${client.nombreUsuario || 'N/A'}</span>
                </td>
                <td class="px-6 py-4">${client.dui}</td>
                <td class="px-6 py-4">${client.telefono || 'N/A'}</td>
                <td class="px-6 py-4">${client.puntosActuales || 0}</td>
                <td class="px-6 py-4">
                    <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">Activo</span>
                </td>
                <td class="px-6 py-4 text-center space-x-2">
                    <button class="edit-btn p-2 bg-silver-lake-blue/20 hover:bg-silver-lake-blue/40 text-yinmn-blue dark:bg-yinmn-blue/30 dark:hover:bg-yinmn-blue/50 dark:text-platinum rounded-lg transition-colors" title="Editar" data-id="${client.dui}">
                        <i data-lucide="file-pen-line" class="w-5 h-5 pointer-events-none"></i>
                    </button>
                    <button class="delete-btn p-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg transition-colors" title="Eliminar" data-id="${client.dui}">
                        <i data-lucide="trash-2" class="w-5 h-5 pointer-events-none"></i>
                    </button>
                </td>
            `;
            clientTableBody.appendChild(tr);
        });
        lucide.createIcons(); // Vuelve a renderizar los iconos de Lucide
    }

    function renderizarPaginacion(totalItems, itemsPerPage, current) {
        paginationUl.innerHTML = "";
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) return;

        const createPageLink = (text, pageNum, isDisabled = false, isActive = false) => {
            const li = document.createElement("li");
            li.className = `page-item ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${isActive ? 'z-10' : ''}`;
            
            const link = document.createElement("a");
            link.href = "#";
            link.innerHTML = text;
            link.className = `relative block py-2 px-3 text-sm rounded-lg border ${
                isActive 
                ? 'bg-yinmn-blue border-yinmn-blue text-white' 
                : 'bg-white dark:bg-oxford-blue border-platinum dark:border-rich-black text-yinmn-blue dark:text-silver-lake-blue hover:bg-platinum/80 dark:hover:bg-rich-black/80'
            } transition-colors`;

            if (!isDisabled) {
                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    currentPage = pageNum;
                    cargarClientes();
                });
            }
            li.appendChild(link);
            return li;
        };

        // Botón "Anterior"
        paginationUl.appendChild(createPageLink('«', current - 2, current === 1));

        // Números de página
        for (let i = 1; i <= totalPages; i++) {
             paginationUl.appendChild(createPageLink(i, i - 1, false, i === current));
        }

        // Botón "Siguiente"
        paginationUl.appendChild(createPageLink('»', current, current >= totalPages));
    }

    // Carga inicial
    cargarClientes();
});
