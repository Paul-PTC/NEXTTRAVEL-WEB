import { getLugares, uploadImage, createLugar, updateLugar, deleteLugar } from '../Services/paquetesService.js';

document.addEventListener('DOMContentLoaded', function () {
    // --- REFERENCIAS AL DOM ---
    const tableBody = document.getElementById('package-table-body');
    const searchInput = document.getElementById('searchInput');
    const paginationContainer = document.getElementById('pagination');
    const pageInfo = document.getElementById('pageInfo');
    
    // Modal y Formulario
    const addPackageBtn = document.getElementById('addPackageBtn');
    const modalLabel = document.getElementById('packageModalLabel');
    const packageForm = document.getElementById('packageForm');
    
    // Campos del formulario
    const idLugarInput = document.getElementById('idLugar');
    const nombreLugarInput = document.getElementById('nombreLugar');
    const ubicacionInput = document.getElementById('ubicacion');
    const tipoInput = document.getElementById('tipo');
    const descripcionInput = document.getElementById('descripcion');
    const imageFileInput = document.getElementById('imageFile');
    const imageUrlHiddenInput = document.getElementById('imagen_url_hidden');
    const imagePreview = document.getElementById('image-preview');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const fileNameSpan = document.getElementById('fileName');

    // --- ESTADO DE LA APLICACIÓN ---
    let state = {
        currentPage: 0,
        pageSize: 10,
        sort: 'nombreLugar,asc',
        searchTerm: '',
        totalPages: 0,
    };

    // --- CARGA INICIAL ---
    loadPaquetes();

    // --- LÓGICA DE CARGA DE DATOS ---
    async function loadPaquetes() {
        try {
            const params = {
                page: state.currentPage,
                size: state.pageSize,
                sort: state.sort,
                search: state.searchTerm
            };
            const data = await getLugares(params);
            
            state.totalPages = data.totalPages;
            renderTable(data.content || []);
            renderPagination();
            renderPageInfo(data);
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">${error.message}</td></tr>`;
        }
    }

    // --- RENDERIZADO DE LA UI ---
    function renderTable(paquetes) {
        tableBody.innerHTML = '';
        if (paquetes.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-yinmn-blue dark:text-silver-lake-blue">No se encontraron paquetes.</td></tr>`;
            return;
        }
        
        paquetes.forEach(paquete => {
            const tr = document.createElement('tr');
            tr.className = "border-b dark:border-rich-black";
            // Guardar datos en el TR para fácil acceso al editar
            tr.dataset.id = paquete.idLugar;
            tr.dataset.nombre = paquete.nombreLugar;
            tr.dataset.ubicacion = paquete.ubicacion;
            tr.dataset.tipo = paquete.tipo;
            tr.dataset.descripcion = paquete.descripcion;
            tr.dataset.imagen_url = paquete.imagen_url || '';
            // Datos que faltan en la DB pero se simulan en la UI
            tr.dataset.precio = paquete.precio || 'N/A';
            tr.dataset.duracion = paquete.duracionDias || 'N/A';


            tr.innerHTML = `
                <td class="px-6 py-4 font-medium flex items-center space-x-3">
                    <img src="${paquete.imagen_url || 'https://placehold.co/40x40/1b263b/e0e1dd?text=IMG'}" class="w-10 h-10 rounded-md object-cover" alt="${paquete.nombreLugar}">
                    <span class="dark:text-white">${paquete.nombreLugar}</span>
                </td>
                <td class="px-6 py-4">${paquete.ubicacion || 'N/A'}</td>
                <td class="px-6 py-4">${paquete.duracionDias || 'No esp.'} días</td>
                <td class="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-semibold">$${paquete.precio || '0.00'}</td>
                <td class="px-6 py-4">
                    <span class="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-1 rounded-full">Activo</span>
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
                    loadPaquetes();
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
            loadPaquetes();
        }, 400);
    });

    // Abrir modal para crear
    addPackageBtn.addEventListener('click', () => {
        packageForm.reset();
        modalLabel.textContent = 'Nuevo Paquete';
        idLugarInput.value = '';
        imagePreviewContainer.classList.add('hidden');
        fileNameSpan.textContent = 'PNG, JPG, WEBP hasta 5MB';
        window.openPackageModal();
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

    // Delegación de eventos en la tabla para editar y eliminar
    tableBody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            const row = editBtn.closest('tr');
            modalLabel.textContent = 'Editar Paquete';
            idLugarInput.value = row.dataset.id;
            nombreLugarInput.value = row.dataset.nombre;
            ubicacionInput.value = row.dataset.ubicacion;
            tipoInput.value = row.dataset.tipo;
            descripcionInput.value = row.dataset.descripcion;
            imageUrlHiddenInput.value = row.dataset.imagen_url;
            
            if (row.dataset.imagen_url) {
                imagePreview.src = row.dataset.imagen_url;
                imagePreviewContainer.classList.remove('hidden');
                fileNameSpan.textContent = 'Imagen actual. Reemplazar si se desea.';
            } else {
                 imagePreviewContainer.classList.add('hidden');
                 fileNameSpan.textContent = 'PNG, JPG, WEBP hasta 5MB';
            }
            
            window.openPackageModal();
        }

        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const row = deleteBtn.closest('tr');
            handleDelete(row.dataset.id, row.dataset.nombre);
        }
    });

    // Enviar formulario
    packageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = idLugarInput.value;
        let imageUrl = imageUrlHiddenInput.value;

        try {
            // Si se seleccionó un nuevo archivo, súbelo primero
            if (imageFileInput.files.length > 0) {
                imageUrl = await uploadImage(imageFileInput.files[0]);
            }

            const planData = {
                nombreLugar: nombreLugarInput.value,
                ubicacion: ubicacionInput.value,
                tipo: tipoInput.value,
                descripcion: descripcionInput.value,
                imagen_url: imageUrl,
            };

            if (id) { // Actualizar
                await updateLugar(id, planData);
                showAlert('¡Actualizado!', 'El paquete ha sido actualizado correctamente.', 'success');
            } else { // Crear
                await createLugar(planData);
                showAlert('¡Creado!', 'El nuevo paquete ha sido creado.', 'success');
            }
            
            window.closePackageModal();
            loadPaquetes();

        } catch (error) {
            showAlert('Error', error.message, 'error');
        }
    });

    function handleDelete(id, name) {
        Swal.fire({
            title: `¿Eliminar "${name}"?`,
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
                    await deleteLugar(id);
                    showAlert('¡Eliminado!', 'El paquete ha sido eliminado.', 'success');
                    loadPaquetes();
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

