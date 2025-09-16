import { getVehiculos, getVehiculoById, createVehiculo, updateVehiculo, deleteVehiculo, uploadImage } from '../Services/vehiculosService.js';

document.addEventListener('DOMContentLoaded', function () {
    // --- REFERENCIAS AL DOM ---
    const tableBody = document.querySelector('#itemTable tbody');
    const searchInput = document.getElementById('searchInput');
    const paginationContainer = document.getElementById('pagination');
    const pageInfo = document.getElementById('pageInfo');
    
    // Modal y Formulario
    const addBtn = document.getElementById('btnAdd');
    const modalLabel = document.getElementById('itemModalLabel');
    const vehiculoForm = document.getElementById('VehiculoForm');
    
    // Campos del formulario
    const idVehiculoInput = document.getElementById('IdVehiculo');
    const placaInput = document.getElementById('Placa');
    const modeloInput = document.getElementById('Modelo');
    const capacidadInput = document.getElementById('Capacidad');
    const anioInput = document.getElementById('anio');
    const estadoSelect = document.getElementById('estado-vehiculo');
    const imageFileInput = document.getElementById('imageFile');
    const imagePreview = document.getElementById('image-preview');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const fileNameSpan = document.getElementById('fileName');

    // --- ESTADO DE LA APLICACIÓN ---
    let state = {
        currentPage: 0,
        pageSize: 10,
        sort: 'modelo,asc',
        searchTerm: '',
        totalPages: 0,
    };

    // --- CARGA INICIAL ---
    loadVehiculos();

    // --- LÓGICA DE CARGA DE DATOS ---
    async function loadVehiculos() {
        try {
            const params = {
                page: state.currentPage,
                size: state.pageSize,
                sort: state.sort,
                search: state.searchTerm
            };
            const data = await getVehiculos(params);
            
            state.totalPages = data.totalPages;
            renderTable(data.content || []);
            renderPagination();
            renderPageInfo(data);
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">${error.message}</td></tr>`;
        }
    }

    // --- RENDERIZADO DE LA UI ---
    function renderTable(vehiculos) {
        tableBody.innerHTML = '';
        if (vehiculos.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-yinmn-blue dark:text-silver-lake-blue">No se encontraron vehículos.</td></tr>`;
            return;
        }
        
        vehiculos.forEach(vehiculo => {
            const tr = document.createElement('tr');
            tr.className = "border-b dark:border-rich-black";
            tr.dataset.id = vehiculo.idVehiculo;

            const estadoColors = {
                'Activo': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400',
                'Inactivo': 'bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-300',
                'En Mantenimiento': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400'
            };

            tr.innerHTML = `
                <td class="px-6 py-4 font-medium flex items-center space-x-3">
                    <img src="${vehiculo.imagen_url || 'https://placehold.co/40x40/1b263b/e0e1dd?text=CAR'}" class="w-10 h-10 rounded-md object-cover" alt="${vehiculo.modelo}">
                    <span class="dark:text-white">${vehiculo.modelo}</span>
                </td>
                <td class="px-6 py-4">${vehiculo.placa}</td>
                <td class="px-6 py-4 text-center">${vehiculo.capacidad}</td>
                <td class="px-6 py-4">${vehiculo.anioFabricacion}</td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${estadoColors[vehiculo.estado] || estadoColors['Inactivo']}">
                        ${vehiculo.estado}
                    </span>
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center space-x-2">
                        <button class="edit-btn p-2 bg-silver-lake-blue/20 hover:bg-silver-lake-blue/40 text-yinmn-blue dark:bg-yinmn-blue/30 dark:hover:bg-yinmn-blue/50 dark:text-platinum rounded-lg transition-colors" title="Editar">
                            <i data-lucide="file-pen-line" class="w-5 h-5 pointer-events-none"></i>
                        </button>
                        <button class="delete-btn p-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg transition-colors" title="Eliminar">
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
                    loadVehiculos();
                });
            }
            li.appendChild(a);
            return li;
        };

        paginationContainer.appendChild(createPageLink(state.currentPage - 1, '«', state.currentPage === 0));
        for (let i = 0; i < state.totalPages; i++) {
            paginationContainer.appendChild(createPageLink(i + 1, i, false, state.currentPage === i));
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
    
    // Búsqueda
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.currentPage = 0;
            state.searchTerm = searchInput.value.trim();
            loadVehiculos();
        }, 400);
    });

    // Abrir modal para crear
    addBtn.addEventListener('click', () => {
        vehiculoForm.reset();
        modalLabel.textContent = 'Nuevo Vehículo';
        idVehiculoInput.value = '';
        imagePreviewContainer.classList.add('hidden');
        fileNameSpan.textContent = 'PNG, JPG, WEBP hasta 5MB';
        window.openModal();
    });

    // Vista previa de imagen
    imageFileInput.addEventListener('change', () => {
        const file = imageFileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreviewContainer.classList.remove('hidden');
                fileNameSpan.textContent = file.name;
            };
            reader.readAsDataURL(file);
        }
    });

    // Delegación de eventos en la tabla
    tableBody.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            const id = editBtn.closest('tr').dataset.id;
            try {
                const vehiculo = await getVehiculoById(id);
                modalLabel.textContent = 'Editar Vehículo';
                idVehiculoInput.value = vehiculo.idVehiculo;
                placaInput.value = vehiculo.placa;
                modeloInput.value = vehiculo.modelo;
                capacidadInput.value = vehiculo.capacidad;
                anioInput.value = vehiculo.anioFabricacion;
                estadoSelect.value = vehiculo.estado;

                if (vehiculo.imagen_url) {
                    imagePreview.src = vehiculo.imagen_url;
                    imagePreviewContainer.classList.remove('hidden');
                    fileNameSpan.textContent = 'Imagen actual. Reemplazar si se desea.';
                } else {
                    imagePreviewContainer.classList.add('hidden');
                    fileNameSpan.textContent = 'PNG, JPG, WEBP hasta 5MB';
                }

                window.openModal();
            } catch (error) {
                showAlert('Error', 'No se pudo cargar los datos del vehículo.', 'error');
            }
        }

        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const id = deleteBtn.closest('tr').dataset.id;
            handleDelete(id);
        }
    });

    // Enviar formulario
    vehiculoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = idVehiculoInput.value;
        let imageUrl = document.querySelector(`tr[data-id='${id}']`)?.querySelector('img')?.src; 

        try {
            if (imageFileInput.files.length > 0) {
                imageUrl = await uploadImage(imageFileInput.files[0]);
            }

            const data = {
                placa: placaInput.value,
                modelo: modeloInput.value,
                capacidad: parseInt(capacidadInput.value),
                anioFabricacion: parseInt(anioInput.value),
                estado: estadoSelect.value,
                imagen_url: imageUrl || null
            };

            if (id) { // Actualizar
                await updateVehiculo(id, data);
                showAlert('¡Actualizado!', 'El vehículo ha sido actualizado.', 'success');
            } else { // Crear
                await createVehiculo(data);
                showAlert('¡Creado!', 'El nuevo vehículo ha sido registrado.', 'success');
            }
            
            window.closeModal();
            loadVehiculos();

        } catch (error) {
            showAlert('Error', error.message, 'error');
        }
    });

    function handleDelete(id) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sí, eliminar',
            customClass: {
                popup: 'bg-white dark:bg-oxford-blue text-rich-black dark:text-platinum',
                title: 'text-rich-black dark:text-white',
                htmlContainer: 'text-yinmn-blue dark:text-silver-lake-blue'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteVehiculo(id);
                    showAlert('¡Eliminado!', 'El vehículo ha sido eliminado.', 'success');
                    loadVehiculos();
                } catch (error) {
                    showAlert('Error', error.message, 'error');
                }
            }
        });
    }

    function showAlert(title, text, icon) {
        Swal.fire({ title, text, icon,
            customClass: {
                 popup: 'bg-white dark:bg-oxford-blue text-rich-black dark:text-platinum',
                title: 'text-rich-black dark:text-white',
                htmlContainer: 'text-yinmn-blue dark:text-silver-lake-blue'
            }
        });
    }
});

