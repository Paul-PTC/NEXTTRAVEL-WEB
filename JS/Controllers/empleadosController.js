import { getEmpleados, crearEmpleado, actualizarEmpleado, eliminarEmpleado } from '../Services/empleadosServices.js';

// NOTA: La lógica para obtener los rangos no está en el service, se asume una llamada directa a la API.
const API_RANGOS_URL = 'http://localhost:8080/api/rangos'; 

// --- Variables globales para estado de la UI ---
let currentPage = 0;
let currentSize = 10;
let currentSearchQuery = '';

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
    const employeeTableBody = document.getElementById('employee-table-body');
    const searchInput = document.getElementById('searchInput');
    const paginationUl = document.getElementById('pagination');
    
    // Referencias al Modal (manejado por funciones globales en el HTML)
    const employeeForm = document.getElementById('employeeForm');
    const modalTitle = document.getElementById('employeeModalLabel');
    const employeeDuiHiddenInput = document.getElementById('employeeDui');
    
    const duiInput = document.getElementById('dui');
    const idUsuarioInput = document.getElementById('idUsuario');
    const idRangoSelect = document.getElementById('idRango');
    const telefonoInput = document.getElementById('telefono');
    const direccionInput = document.getElementById('direccion');

    // --- Lógica de Búsqueda ---
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearchQuery = searchInput.value;
                currentPage = 0;
                cargarEmpleados();
            }, 500);
        });
    }

    // --- Lógica del Formulario y Modal ---
    const addEmployeeBtn = document.getElementById('addEmployeeBtn');
    if(addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', () => {
            limpiarFormulario();
            modalTitle.textContent = 'Agregar Nuevo Empleado';
            duiInput.removeAttribute('readonly');
            loadRangosForForm(); // Cargar rangos en el select
            openModal();
        });
    }
    
    if (employeeForm) {
        employeeForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            await guardarEmpleado();
        });
    }

    // Delegación de eventos para botones de la tabla
    if (employeeTableBody) {
        employeeTableBody.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            const dui = button.dataset.id;
            if (!dui) return;

            if (button.classList.contains('edit-btn')) {
                setFormulario(dui);
            } else if (button.classList.contains('delete-btn')) {
                confirmarEliminarEmpleado(dui);
            }
        });
    }

    // --- Funciones del Controlador ---

    async function cargarEmpleados() {
        try {
            // Asumimos que el backend puede buscar por nombre o dui con el mismo endpoint
            const searchType = /^\d{8}-\d$/.test(currentSearchQuery) ? 'dui' : 'nombre';
            const response = await getEmpleados({
                page: currentPage,
                size: currentSize,
                sort: 'fechaContratacion,desc',
                search: currentSearchQuery,
                searchType: searchType
            });
            
            if (response && response.content) {
                renderizarEmpleados(response.content); 
                renderizarPaginacion(response.totalPages, currentPage + 1);
            } else {
                renderizarEmpleados([]);
                renderizarPaginacion(0, 1);
            }
        } catch (error) {
            console.error('Error al cargar los empleados:', error);
            showAlert('error', 'Error', 'No se pudieron cargar los empleados.');
            renderizarEmpleados([]);
            renderizarPaginacion(0, 1);
        }
    }
    
    async function guardarEmpleado() {
        const isEditing = !!employeeDuiHiddenInput.value;
        const dui = duiInput.value;
        
        const empleadoData = {
            dui: dui,
            idUsuario: parseInt(idUsuarioInput.value, 10),
            idRango: parseInt(idRangoSelect.value, 10),
            telefono: telefonoInput.value,
            direccion: direccionInput.value,
            // La fecha de contratación es manejada por el backend (DEFAULT SYSTIMESTAMP)
        };

        try {
            const res = isEditing
                ? await actualizarEmpleado(employeeDuiHiddenInput.value, empleadoData)
                : await crearEmpleado(empleadoData);

            if (res) { // El service ahora retorna el JSON en caso de éxito
                showAlert('success', 'Éxito', `Empleado ${isEditing ? 'actualizado' : 'creado'} correctamente.`);
                closeModal();
                await cargarEmpleados();
            }
        } catch (error) {
            showAlert('error', 'Error', error.message || 'No se pudo guardar el empleado.');
        }
    }

    async function confirmarEliminarEmpleado(dui) {
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
                    const success = await eliminarEmpleado(dui);
                    if (success) {
                        showAlert('success', 'Eliminado', 'El empleado ha sido eliminado.');
                        await cargarEmpleados();
                    }
                } catch (error) {
                    showAlert('error', 'Error', error.message || 'No se pudo eliminar el empleado.');
                }
            }
        });
    }

    async function setFormulario(dui) {
        try {
            // El service getEmpleados puede usarse para obtener un solo empleado si la API lo permite
            const response = await getEmpleados({ search: dui, searchType: 'dui' });
            const empleado = response.content[0];

            if (empleado) {
                modalTitle.textContent = 'Editar Empleado';
                employeeDuiHiddenInput.value = empleado.dui; // Campo oculto para referencia
                duiInput.value = empleado.dui;
                duiInput.setAttribute('readonly', true); 
                idUsuarioInput.value = empleado.idUsuario;
                telefonoInput.value = empleado.telefono || '';
                direccionInput.value = empleado.direccion || '';
                
                await loadRangosForForm(empleado.idRango); // Carga rangos y selecciona el actual
                
                openModal();
            } else {
                showAlert('error', 'Error', 'Empleado no encontrado.');
            }
        } catch (error) {
            showAlert('error', 'Error', 'No se pudo cargar el empleado para editar.');
        }
    }

    function limpiarFormulario() {
        employeeForm.reset();
        employeeDuiHiddenInput.value = '';
        duiInput.removeAttribute('readonly');
    }

    async function loadRangosForForm(selectedRangoId = null) {
        try {
            const response = await fetch(API_RANGOS_URL);
            const rangos = await response.json();
            idRangoSelect.innerHTML = '<option value="">Seleccione un rango</option>';
            rangos.forEach(rango => {
                const option = document.createElement('option');
                option.value = rango.idRango;
                option.textContent = rango.nombreRango;
                if (selectedRangoId && rango.idRango === selectedRangoId) {
                    option.selected = true;
                }
                idRangoSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error al cargar rangos:", error);
            idRangoSelect.innerHTML = '<option value="">Error al cargar rangos</option>';
        }
    }
    
    // --- Funciones de Renderizado ---

    function renderizarEmpleados(empleados) {
        employeeTableBody.innerHTML = '';
        if (!empleados || empleados.length === 0) {
            employeeTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-yinmn-blue dark:text-silver-lake-blue">
                        No se encontraron empleados.
                    </td>
                </tr>`;
            return;
        }

        empleados.forEach(empleado => {
            const tr = document.createElement("tr");
            tr.className = "border-b dark:border-rich-black";

            tr.innerHTML = `
                <td class="px-6 py-4 font-medium flex items-center space-x-3">
                    <img src="${empleado.foto_url || `https://placehold.co/40x40/778da9/ffffff?text=${empleado.nombre ? empleado.nombre.charAt(0) : 'E'}`}" class="w-10 h-10 rounded-full" alt="Avatar">
                    <span class="dark:text-white">${empleado.nombre || 'N/A'}</span>
                </td>
                <td class="px-6 py-4">${empleado.dui}</td>
                <td class="px-6 py-4">
                    <span class="bg-yinmn-blue/80 text-white text-xs font-medium px-2.5 py-1 rounded-full">${empleado.rango || 'N/A'}</span>
                </td>
                <td class="px-6 py-4">${empleado.telefono || 'N/A'}</td>
                <td class="px-6 py-4">${new Date(empleado.fechaContratacion).toLocaleDateString()}</td>
                <td class="px-6 py-4 text-center space-x-2">
                    <button class="edit-btn p-2 bg-silver-lake-blue/20 hover:bg-silver-lake-blue/40 text-yinmn-blue dark:bg-yinmn-blue/30 dark:hover:bg-yinmn-blue/50 dark:text-platinum rounded-lg transition-colors" title="Editar" data-id="${empleado.dui}">
                        <i data-lucide="file-pen-line" class="w-5 h-5 pointer-events-none"></i>
                    </button>
                    <button class="delete-btn p-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg transition-colors" title="Eliminar" data-id="${empleado.dui}">
                        <i data-lucide="trash-2" class="w-5 h-5 pointer-events-none"></i>
                    </button>
                </td>
            `;
            employeeTableBody.appendChild(tr);
        });
        lucide.createIcons();
    }

    function renderizarPaginacion(totalPages, current) {
        paginationUl.innerHTML = "";
        if (totalPages <= 1) return;

        const createPageLink = (text, pageNum, isDisabled = false, isActive = false) => {
            const li = document.createElement("li");
            const link = document.createElement("a");
            link.href = "#";
            link.innerHTML = text;
            link.className = `relative block py-2 px-3 text-sm rounded-lg border transition-colors ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${
                isActive 
                ? 'bg-yinmn-blue border-yinmn-blue text-white' 
                : 'bg-white dark:bg-oxford-blue border-platinum dark:border-rich-black text-yinmn-blue dark:text-silver-lake-blue hover:bg-platinum/80 dark:hover:bg-rich-black/80'
            }`;

            if (!isDisabled) {
                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    currentPage = pageNum;
                    cargarEmpleados();
                });
            }
            li.appendChild(link);
            return li;
        };

        paginationUl.appendChild(createPageLink('«', current - 2, current === 1));
        for (let i = 1; i <= totalPages; i++) {
             paginationUl.appendChild(createPageLink(i, i - 1, false, i === current));
        }
        paginationUl.appendChild(createPageLink('»', current, current >= totalPages));
    }

    // Carga inicial
    cargarEmpleados();
});
