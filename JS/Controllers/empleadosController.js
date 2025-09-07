// Lógica del Navbar
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
        if (collapseContent) {
            collapseContent.classList.toggle('hidden');
        }
    });
});

// Lógica de empleados
import {
    getEmpleados,
    crearEmpleado,
    actualizarEmpleado,
    eliminarEmpleado
} from "../Services/empleadosServices.js";

// Variables para la paginación y búsqueda
let currentPage = 0;
let currentSize = 10;
let currentSearchType = 'nombreCompleto';
let currentSearchTerm = '';

document.addEventListener("DOMContentLoaded", () => {
    // Referencias a elementos del DOM
    const employeesTableBody = document.getElementById('employee-table-body');
    const employeeForm = document.getElementById('employeeForm');
    const employeeModalElement = document.getElementById('employeeModal');
    const employeeModal = new bootstrap.Modal(employeeModalElement);
    const employeeModalLabel = document.getElementById('employeeModalLabel');
    const addEmployeeBtn = document.getElementById('btnAddEmployee');

    // === Referencias a elementos del formulario ===
    const duiInput = document.getElementById('dui');
    const nombreCompletoInput = document.getElementById('nombreCompleto');
    const edadInput = document.getElementById('edad');
    const salarioInput = document.getElementById('salario');
    const correoInput = document.getElementById('correo');
    const idRangoInput = document.getElementById('idRango');
    const telefonoInput = document.getElementById('telefono');
    const direccionInput = document.getElementById('direccion');
    const fechaContratacionInput = document.getElementById('fechaContratacion');
    // === Fin de referencias ===

    // Elementos para la búsqueda y paginación
    const searchInput = document.getElementById('searchInput');
    const searchTypeSelect = document.getElementById('searchType');
    // 👇 ID CORREGIDO: ahora busca el ID 'pagination' 👇
    const paginationContainer = document.getElementById('pagination'); 
    const sizeSelect = document.getElementById('sizeSelect');

    // Evento para el botón de agregar
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener("click", async () => {
            limpiarFormulario();
            duiInput.disabled = false;
            employeeModalLabel.textContent = "Agregar nuevo empleado";
            await loadRangosForForm();
            if (fechaContratacionInput) {
                const now = new Date();
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                fechaContratacionInput.value = now.toISOString().slice(0, 16);
            }
            employeeModal.show();
        });
    }

    // Evento de submit para el formulario
    if (employeeForm) {
        employeeForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const isEditing = duiInput.disabled;

            // Validación simple
            if (!duiInput.value.trim() || !nombreCompletoInput.value.trim() || !correoInput.value.trim() || !fechaContratacionInput.value.trim()) {
                Swal.fire('Error', 'Por favor, completa todos los campos obligatorios.', 'error');
                return;
            }

            const idRangoValue = idRangoInput.value;

            // Validación específica para el rango
            if (!idRangoValue) {
                Swal.fire('Error', 'Por favor, selecciona un rango válido.', 'error');
                return;
            }

            const parsedIdRango = parseInt(idRangoValue, 10);
            if (isNaN(parsedIdRango)) {
                Swal.fire('Error', 'El ID del rango es inválido. Por favor, selecciona un rango de la lista.', 'error');
                return;
            }

            // === Creación del objeto de datos ===
            const empleadoData = {
                dui: duiInput.value.trim(),
                nombreCompleto: nombreCompletoInput.value.trim(),
                edad: parseInt(edadInput.value),
                salario: parseFloat(salarioInput.value),
                correo: correoInput.value.trim(),
                idRango: parsedIdRango,
                telefono: telefonoInput.value.trim() || null,
                direccion: direccionInput.value.trim() || null,
                fechaContratacion: new Date(fechaContratacionInput.value).toISOString()
            };

            try {
                if (isEditing) {
                    await actualizarEmpleado(empleadoData.dui, empleadoData);
                    Swal.fire('¡Actualizado!', 'El empleado ha sido actualizado.', 'success');
                } else {
                    await crearEmpleado(empleadoData);
                    Swal.fire('¡Guardado!', 'El nuevo empleado ha sido agregado.', 'success');
                }
                employeeModal.hide();
                await cargarEmpleados();
            } catch (err) {
                console.error("Error guardando:", err);
                Swal.fire('Error', err.message || 'Ocurrió un error al guardar el empleado.', 'error');
            }
        });
    }

    // Función para rellenar formulario al editar
    async function setFormulario(item) {
        if (employeeForm) {
            await loadRangosForForm();

            duiInput.value = item.dui || '';
            duiInput.disabled = true;
            nombreCompletoInput.value = item.nombreCompleto || '';
            edadInput.value = item.edad || '';
            salarioInput.value = item.salario || '';
            correoInput.value = item.correo || '';
            telefonoInput.value = item.telefono || '';
            direccionInput.value = item.direccion || '';
            if (fechaContratacionInput && item.fechaContratacion) {
                const date = new Date(item.fechaContratacion);
                date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
                fechaContratacionInput.value = date.toISOString().slice(0, 16);
            }
            idRangoInput.value = item.idRango || '';
        }
        employeeModalLabel.textContent = "Editar empleado";
        employeeModal.show();
    }

    // === INICIO DE CÓDIGO AÑADIDO ===
    // Función principal para cargar empleados desde la API y renderizarlos
    async function cargarEmpleados() {
        try {
            const data = await getEmpleados({
                page: 0, 
                size: 10,
                sort: 'nombreCompleto,asc',
                search: '',
                searchType: 'nombre'
            });
            renderEmpleadosTable(data.content);
            renderPagination(data.totalPages);
        } catch (error) {
            console.error("Error al cargar empleados:", error);
            // Asegúrate de que employeesTableBody exista antes de usarlo
            if (employeesTableBody) {
                employeesTableBody.innerHTML = '<tr><td colspan="9" class="text-center py-4">Error al cargar los datos. Inténtalo de nuevo más tarde.</td></tr>';
            }
            // Asegúrate de que paginationContainer exista antes de usarlo
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
            }
        }
    }

    // Función para renderizar la tabla de empleados
    function renderEmpleadosTable(empleados) {
        if (!employeesTableBody) return; // Control para evitar el error

        employeesTableBody.innerHTML = '';
        if (empleados.length === 0) {
            employeesTableBody.innerHTML = '<tr><td colspan="9" class="text-center py-4">No se encontraron empleados.</td></tr>';
            return;
        }

        empleados.forEach(empleado => {
            const row = document.createElement('tr');
            row.className = 'bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600';
            row.innerHTML = `
                <td class="px-6 py-4">${empleado.dui}</td>
                <td class="px-6 py-4">${empleado.nombreCompleto}</td>
                <td class="px-6 py-4">${empleado.edad || 'N/A'}</td>
                <td class="px-6 py-4">$${empleado.salario ? empleado.salario.toFixed(2) : '0.00'}</td>
                <td class="px-6 py-4">${empleado.correo}</td>
                <td class="px-6 py-4">${empleado.nombreRango || 'Sin rango'}</td>
                <td class="px-6 py-4">${empleado.telefono || 'N/A'}</td>
                <td class="px-6 py-4">${empleado.direccion || 'N/A'}</td>
                <td class="px-6 py-4 text-right space-x-2">
                    <button class="font-medium text-blue-600 dark:text-blue-500 hover:underline" data-action="edit" data-dui="${empleado.dui}">Editar</button>
                    <button class="font-medium text-red-600 dark:text-red-500 hover:underline" data-action="delete" data-dui="${empleado.dui}">Eliminar</button>
                </td>
            `;
            employeesTableBody.appendChild(row);
        });

        // Event listeners para los botones de editar y eliminar
        employeesTableBody.querySelectorAll('[data-action="edit"]').forEach(button => {
            button.addEventListener('click', async (e) => {
                const dui = e.target.getAttribute('data-dui');
                const empleado = empleados.find(emp => emp.dui === dui);
                if (empleado) {
                    await setFormulario(empleado);
                } else {
                    Swal.fire('Error', 'No se encontró el empleado para editar.', 'error');
                }
            });
        });

        employeesTableBody.querySelectorAll('[data-action="delete"]').forEach(button => {
            button.addEventListener('click', (e) => {
                const dui = e.target.getAttribute('data-dui');
                confirmarEliminacion(dui);
            });
        });
    }

    // Función para renderizar la paginación
    function renderPagination(totalPages) {
        if (!paginationContainer) return; // Control para evitar el error

        paginationContainer.innerHTML = '';
        if (totalPages <= 1) return;

        const createButton = (page, text, disabled = false) => {
            const button = document.createElement('button');
            button.className = `px-3 py-1 mx-1 rounded ${disabled ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed' :
                (page === currentPage ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700')
                }`;
            button.textContent = text;
            button.disabled = disabled;
            button.addEventListener('click', () => {
                currentPage = page;
                cargarEmpleados();
            });
            return button;
        };

        paginationContainer.appendChild(createButton(currentPage - 1, 'Anterior', currentPage === 0));

        // Paginación con el número de página
        let startPage = Math.max(0, currentPage - 2);
        let endPage = Math.min(totalPages - 1, currentPage + 2);

        if (currentPage <= 1) {
            endPage = Math.min(totalPages - 1, 4);
        } else if (currentPage >= totalPages - 2) {
            startPage = Math.max(0, totalPages - 5);
        }

        if (startPage > 0) {
            paginationContainer.appendChild(createButton(0, '1'));
            if (startPage > 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'px-3 py-1 text-gray-500 dark:text-gray-400';
                paginationContainer.appendChild(ellipsis);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationContainer.appendChild(createButton(i, (i + 1).toString(), i === currentPage));
        }

        if (endPage < totalPages - 1) {
            if (endPage < totalPages - 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'px-3 py-1 text-gray-500 dark:text-gray-400';
                paginationContainer.appendChild(ellipsis);
            }
            paginationContainer.appendChild(createButton(totalPages - 1, totalPages.toString()));
        }

        paginationContainer.appendChild(createButton(currentPage + 1, 'Siguiente', currentPage === totalPages - 1));
    }

    // Función para confirmar eliminación
    async function confirmarEliminacion(dui) {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, ¡eliminarlo!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await eliminarEmpleado(dui);
                Swal.fire('¡Eliminado!', 'El empleado ha sido eliminado.', 'success');
                await cargarEmpleados();
            } catch (error) {
                console.error("Error eliminando empleado:", error);
                Swal.fire('Error', error.message || 'Ocurrió un error al eliminar el empleado.', 'error');
            }
        }
    }

    // Event listeners para la búsqueda y el tamaño de página
    // 👇 Se agregó el control de flujo para evitar errores si los elementos no están presentes 👇
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentSearchTerm = searchInput.value;
            currentPage = 0;
            cargarEmpleados();
        });
    }

    if (searchTypeSelect) {
        searchTypeSelect.addEventListener('change', () => {
            currentSearchType = searchTypeSelect.value;
            currentPage = 0;
            cargarEmpleados();
        });
    }

    if (sizeSelect) {
        sizeSelect.addEventListener('change', () => {
            currentSize = parseInt(sizeSelect.value, 10);
            currentPage = 0;
            cargarEmpleados();
        });
    }

    // Vaciar el formulario
    function limpiarFormulario() {
        if (employeeForm) {
            employeeForm.reset();
            duiInput.value = "";
            duiInput.disabled = false;
            // Asegurarse de que el campo de rango se resetee correctamente
            if (idRangoInput) {
                idRangoInput.value = '';
            }
        }
    }

    // Llamadas iniciales
    cargarEmpleados();
});

// Función para cargar los rangos en el formulario del modal
async function loadRangosForForm() {
    try {
        const rangoSelect = document.getElementById('idRango');
        if (!rangoSelect) return; // Control para evitar error

        const response = await fetch('http://localhost:8080/api/rangos');
        if (!response.ok) throw new Error(`Error al obtener los rangos: ${response.status}`);

        const data = await response.json();
        const rangos = data.content || data;

        rangoSelect.innerHTML = '<option value="">Seleccione un rango</option>';

        rangos.forEach(rango => {
            const option = document.createElement('option');
            option.value = rango.idRango;
            option.textContent = rango.nombreRango;
            rangoSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar los rangos:', error);
        const rangoSelect = document.getElementById('idRango');
        if (rangoSelect) {
            rangoSelect.innerHTML = '<option value="">Error al cargar rangos</option>';
        }
    }
}