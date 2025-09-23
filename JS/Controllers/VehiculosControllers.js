import {
    getVehiculos,
    createVehiculo,
    updateVehiculo,
    deleteVehiculo,
    buscarPorPlaca,
    buscarPorModelo,
    buscarPorEstado
} from "../Services/vehiculosService.js";

document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.querySelector("#itemTable tbody"); // Tbody - Cuerpo de la tabla
    const form = document.getElementById("VehiculoForm"); // Formulario dentro del modal
    const modal = document.getElementById("itemModal"); // Modal
    const lblModal = document.getElementById("itemModalLabel"); // Título del modal
    const btnAdd = document.getElementById("btnAdd"); // Botón para abrir el modal
    const searchInput = document.getElementById("searchInput"); // Campo de búsqueda
    const pageInfo = document.getElementById("pageInfo"); // Información de paginación
    const pagination = document.getElementById("pagination"); // Controles de paginación

    let currentPage = 0;
    let currentSize = 10;
    let currentSort = "placa,asc";
    let totalPages = 0;
    let totalElements = 0;
    let searchTimeout;

    init(); // Este método permite cargar los vehículos en la tabla

    // Acción cuando el botón de Agregar Nuevo vehículo es presionado se abre el modal
    btnAdd.addEventListener("click", () => {
        form.reset();
        form.querySelector("#IdVehiculo").value = ""; // No enviamos ID, ya que estamos agregando
        lblModal.textContent = "Nuevo Vehículo";
        // Usar la función global openModal definida en el HTML
        if (window.openModal) {
            window.openModal();
        }
    });

    // Búsqueda en tiempo real
    searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = e.target.value.trim();
            currentPage = 0; // Reiniciar a la primera página
            if (query) {
                searchVehiculos(query);
            } else {
                loadVehiculos();
            }
        }, 300); // Debounce de 300ms
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault(); // Evitamos que el formulario se envíe al hacer "submit"
        const id = form.querySelector("#IdVehiculo").value; // Obtenemos el ID del registro
        const data = {
            placa: form.querySelector("#Placa").value.trim(),
            modelo: form.querySelector("#Modelo").value.trim(),
            capacidad: parseInt(form.querySelector("#Capacidad").value),
            anioFabricacion: form.querySelector("#anio").value ? parseInt(form.querySelector("#anio").value) : null,
            estado: form.querySelector("#estado-vehiculo").value || "Activo"
        };

        // Validaciones básicas
        if (!data.placa || !data.modelo || !data.capacidad) {
            Swal.fire({
                icon: 'error',
                title: 'Error de validación',
                text: 'Por favor complete todos los campos obligatorios'
            });
            return;
        }

        if (data.capacidad < 1) {
            Swal.fire({
                icon: 'error',
                title: 'Error de validación',
                text: 'La capacidad debe ser mayor a 0'
            });
            return;
        }

        if (data.anioFabricacion && (data.anioFabricacion < 1900 || data.anioFabricacion > 2100)) {
            Swal.fire({
                icon: 'error',
                title: 'Error de validación',
                text: 'El año de fabricación debe estar entre 1900 y 2100'
            });
            return;
        }

        try {
            let result;
            // Si hay un ID, significa que estamos actualizando
            if (id) {
                result = await updateVehiculo(id, data);
            } else { // Si no hay un ID, significa que estamos agregando
                result = await createVehiculo(data);
            }

            // Verificar si hubo errores en la respuesta
            if (result.status === "Insercion Incorrecta" || result.error) {
                let errorMessage = "Error al procesar la solicitud";
                if (result.message) {
                    errorMessage = result.message;
                } else if (result.errors) {
                    errorMessage = Object.values(result.errors).join(", ");
                }
                
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorMessage
                });
                return;
            }

            // Usar la función global closeModal definida en el HTML
            if (window.closeModal) {
                window.closeModal();
            }

            await loadVehiculos(); // Nos permite cargar los vehículos

            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: id ? 'Vehículo actualizado correctamente' : 'Vehículo creado correctamente',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error("Error: ", err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error de conexión con el servidor'
            });
        }
    });

    async function loadVehiculos() {
        try {
            const response = await getVehiculos(currentPage, currentSize, currentSort);
            displayVehiculos(response);
        } catch (err) {
            console.error("Error cargando vehículos: ", err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar los vehículos'
            });
        }
    }

    async function searchVehiculos(query) {
        try {
            // Intentar buscar por placa primero, luego por modelo
            let response;
            try {
                response = await buscarPorPlaca(query, currentPage, currentSize, currentSort);
            } catch {
                try {
                    response = await buscarPorModelo(query, currentPage, currentSize, currentSort);
                } catch {
                    response = await buscarPorEstado(query, currentPage, currentSize, currentSort);
                }
            }
            displayVehiculos(response);
        } catch (err) {
            console.error("Error en búsqueda: ", err);
            // Si falla la búsqueda, cargar todos los vehículos
            loadVehiculos();
        }
    }

    function displayVehiculos(response) {
        tableBody.innerHTML = ""; // Vaciamos la tabla
        
        // Actualizar información de paginación
        if (response.content) {
            totalPages = response.totalPages || 0;
            totalElements = response.totalElements || 0;
            currentPage = response.number || 0;
            
            updatePageInfo();
            updatePagination();

            // Verificamos que si no hay vehículos
            if (!response.content || response.content.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Actualmente no hay registros</td></tr>';
                return; // Evitamos que se ejecute el resto del código
            }

            response.content.forEach((vehiculo) => {
                const tr = document.createElement("tr"); // Se crea el elemento con JS
                tr.className = "border-b border-platinum/50 dark:border-rich-black/50 hover:bg-platinum/30 dark:hover:bg-rich-black/30 transition-colors";
                tr.innerHTML = `
                    <td class="px-6 py-4">
                        <div class="flex items-center space-x-3">
                            <div class="bg-yinmn-blue/10 dark:bg-silver-lake-blue/20 p-2 rounded-lg">
                                <i data-lucide="car" class="w-5 h-5 text-yinmn-blue dark:text-silver-lake-blue"></i>
                            </div>
                            <div>
                                <div class="font-medium text-rich-black dark:text-platinum">${vehiculo.modelo || ""}</div>
                                <div class="text-sm text-yinmn-blue dark:text-silver-lake-blue">ID: ${vehiculo.idVehiculo}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 font-medium text-rich-black dark:text-platinum">${vehiculo.placa || ""}</td>
                    <td class="px-6 py-4 text-yinmn-blue dark:text-silver-lake-blue">${vehiculo.capacidad || ""} pasajeros</td>
                    <td class="px-6 py-4 text-yinmn-blue dark:text-silver-lake-blue">${vehiculo.anioFabricacion || "N/A"}</td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${getEstadoClass(vehiculo.estado)}">
                            ${vehiculo.estado || "Activo"}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <div class="flex justify-center space-x-2">
                            <button class="edit-btn p-2 text-yinmn-blue dark:text-silver-lake-blue hover:bg-yinmn-blue/10 dark:hover:bg-silver-lake-blue/20 rounded-lg transition-colors" title="Editar">
                                <i data-lucide="edit" class="w-4 h-4"></i>
                            </button>
                            <button class="delete-btn p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Eliminar">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </td>
                `;

                // Funcionalidad para botones de Editar
                tr.querySelector(".edit-btn").addEventListener("click", () => {
                    form.querySelector("#IdVehiculo").value = vehiculo.idVehiculo;
                    form.querySelector("#Placa").value = vehiculo.placa;
                    form.querySelector("#Modelo").value = vehiculo.modelo;
                    form.querySelector("#Capacidad").value = vehiculo.capacidad;
                    form.querySelector("#anio").value = vehiculo.anioFabricacion || "";
                    form.querySelector("#estado-vehiculo").value = vehiculo.estado || "Activo";
                    lblModal.textContent = "Editar Vehículo";

                    // El modal se carga hasta que el formulario ya tenga los datos cargados
                    if (window.openModal) {
                        window.openModal();
                    }
                });

                // Funcionalidad para botones de Eliminar
                tr.querySelector(".delete-btn").addEventListener("click", () => {
                    Swal.fire({
                        title: '¿Estás seguro?',
                        text: `¿Deseas eliminar el vehículo ${vehiculo.placa}?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#415a77',
                        cancelButtonColor: '#778da9',
                        confirmButtonText: 'Sí, eliminar',
                        cancelButtonText: 'Cancelar'
                    }).then(async (result) => {
                        if (result.isConfirmed) {
                            try {
                                const deleteResult = await deleteVehiculo(vehiculo.idVehiculo);
                                
                                if (deleteResult.error) {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error',
                                        text: deleteResult.error
                                    });
                                    return;
                                }

                                await loadVehiculos();
                                Swal.fire({
                                    icon: 'success',
                                    title: 'Eliminado',
                                    text: 'Vehículo eliminado correctamente',
                                    timer: 2000,
                                    showConfirmButton: false
                                });
                            } catch (error) {
                                console.error("Error eliminando vehículo:", error);
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Error',
                                    text: 'Error al eliminar el vehículo'
                                });
                            }
                        }
                    });
                });

                tableBody.appendChild(tr); // Al tbody se le concatena la nueva fila creada
            });

            // Renderizar iconos después de agregar el contenido
            lucide.createIcons();
        }
    }

    function getEstadoClass(estado) {
        switch (estado) {
            case "Activo":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
            case "Inactivo":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
            case "En Mantenimiento":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
        }
    }

    function updatePageInfo() {
        const start = totalElements === 0 ? 0 : (currentPage * currentSize) + 1;
        const end = Math.min((currentPage + 1) * currentSize, totalElements);
        pageInfo.textContent = `Mostrando ${start}–${end} de ${totalElements}`;
    }

    function updatePagination() {
        pagination.innerHTML = "";

        if (totalPages <= 1) return;

        // Botón anterior
        const prevBtn = createPaginationButton("Anterior", currentPage > 0, () => {
            if (currentPage > 0) {
                currentPage--;
                loadVehiculos();
            }
        });
        pagination.appendChild(prevBtn);

        // Botones de páginas
        const startPage = Math.max(0, currentPage - 2);
        const endPage = Math.min(totalPages - 1, currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = createPaginationButton(i + 1, true, () => {
                currentPage = i;
                loadVehiculos();
            }, i === currentPage);
            pagination.appendChild(pageBtn);
        }

        // Botón siguiente
        const nextBtn = createPaginationButton("Siguiente", currentPage < totalPages - 1, () => {
            if (currentPage < totalPages - 1) {
                currentPage++;
                loadVehiculos();
            }
        });
        pagination.appendChild(nextBtn);
    }

    function createPaginationButton(text, enabled, onClick, isActive = false) {
        const button = document.createElement("button");
        button.textContent = text;
        button.className = `px-3 py-1 text-sm rounded-lg transition-colors ${
            isActive 
                ? "bg-yinmn-blue text-white" 
                : enabled 
                    ? "text-yinmn-blue dark:text-silver-lake-blue hover:bg-yinmn-blue/10 dark:hover:bg-silver-lake-blue/20" 
                    : "text-silver-lake-blue cursor-not-allowed"
        }`;
        button.disabled = !enabled;
        if (enabled) {
            button.addEventListener("click", onClick);
        }
        return button;
    }

    function init() {
        loadVehiculos();
    }

}); // Esto no se toca aquí termina el evento