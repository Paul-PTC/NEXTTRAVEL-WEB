document.addEventListener('DOMContentLoaded', function () {
            // --- LÓGICA DEL NAVBAR ---
            const themeToggleBtns = document.querySelectorAll('#theme-toggle');
            if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            themeToggleBtns.forEach(btn => {
                btn.addEventListener('click', function() {
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

            // --- LÓGICA DE ORDENAMIENTO ---
            const sortSelect = document.getElementById('sort-select');
            const tableBody = document.getElementById('plan-table-body');

            sortSelect.addEventListener('change', (event) => {
                const sortBy = event.target.value;
                const rows = Array.from(tableBody.querySelectorAll('tr'));

                const sortedRows = rows.sort((a, b) => {
                    const nameA = a.querySelector('.plan-name').textContent.trim().toLowerCase();
                    const nameB = b.querySelector('.plan-name').textContent.trim().toLowerCase();
                    const dateA = a.dataset.fechaCreacion;
                    const dateB = b.dataset.fechaCreacion;

                    switch (sortBy) {
                        case 'recientes': return dateB.localeCompare(dateA);
                        case 'antiguos': return dateA.localeCompare(dateB);
                        case 'nombre-asc': return nameA.localeCompare(nameB);
                        case 'nombre-desc': return nameB.localeCompare(nameA);
                        default: return 0;
                    }
                });
                tableBody.innerHTML = '';
                sortedRows.forEach(row => tableBody.appendChild(row));
            });


            // --- LÓGICA PARA CLOUDINARY ---
            const cloudName = "YOUR_CLOUD_NAME"; 
            const uploadPreset = "YOUR_UPLOAD_PRESET";
            const myWidget = cloudinary.createUploadWidget({ cloudName, uploadPreset }, (error, result) => { 
                if (!error && result && result.event === "success") { 
                    document.getElementById('imagen_url').value = result.info.secure_url;
                    document.getElementById('image-preview').src = result.info.secure_url;
                    document.getElementById('image-preview-container').classList.remove('hidden');
                    clearError(document.getElementById('upload_widget').nextElementSibling);
                }
            });
            document.getElementById("upload_widget").addEventListener("click", () => myWidget.open(), false);

            // --- LÓGICA DEL MODAL Y FORMULARIO ---
            const modal = document.getElementById('planModal');
            const modalContent = document.getElementById('modal-content');
            const modalTitle = document.getElementById('modal-title');
            const openModalBtn = document.getElementById('add-plan-btn');
            const closeModalBtn = document.getElementById('close-modal-btn');
            const cancelBtn = document.getElementById('cancel-btn');
            const planForm = document.getElementById('plan-form');
            const planIdInput = document.getElementById('planId');
            const nombreInput = document.getElementById('nombre');
            const descripcionInput = document.getElementById('descripcion');
            const descuentoInput = document.getElementById('descuento');
            const imagenUrlInput = document.getElementById('imagen_url');

            const showError = (input, message) => {
                const errorDiv = input.nextElementSibling;
                input.classList.add('input-error');
                errorDiv.textContent = message;
                errorDiv.classList.remove('hidden');
            };

            const clearError = (input) => {
                const errorDiv = input.nextElementSibling;
                input.classList.remove('input-error');
                errorDiv.classList.add('hidden');
            };
            
            const openModal = (mode = 'add', data = {}) => {
                planForm.reset();
                document.querySelectorAll('.error-message').forEach(el => el.classList.add('hidden'));
                document.querySelectorAll('input, textarea').forEach(el => el.classList.remove('input-error'));
                
                if (mode === 'edit') {
                    modalTitle.textContent = 'Editar Plan Estándar';
                    planIdInput.value = data.id;
                    nombreInput.value = data.nombre;
                    descripcionInput.value = data.descripcion;
                    descuentoInput.value = data.descuento;
                    imagenUrlInput.value = data.imagen;
                    if (data.imagen) {
                        document.getElementById('image-preview').src = data.imagen;
                        document.getElementById('image-preview-container').classList.remove('hidden');
                    }
                } else {
                    modalTitle.textContent = 'Nuevo Plan Estándar';
                    planIdInput.value = '';
                    document.getElementById('image-preview-container').classList.add('hidden');
                }
                
                modal.classList.remove('hidden');
                setTimeout(() => { modal.classList.remove('opacity-0'); modalContent.classList.remove('scale-95'); }, 10);
            };

            const closeModal = () => {
                modal.classList.add('opacity-0');
                modalContent.classList.add('scale-95');
                setTimeout(() => { modal.classList.add('hidden'); }, 300);
            };

            openModalBtn.addEventListener('click', () => openModal('add'));
            closeModalBtn.addEventListener('click', closeModal);
            cancelBtn.addEventListener('click', closeModal);

            planForm.addEventListener('submit', function(event) {
                event.preventDefault();
                let isValid = true;

                // Validaciones
                if (!nombreInput.value.trim()) {
                    showError(nombreInput, 'El nombre del plan es obligatorio.');
                    isValid = false;
                } else {
                    clearError(nombreInput);
                }

                if (!descripcionInput.value.trim()) {
                    showError(descripcionInput, 'La descripción es obligatoria.');
                    isValid = false;
                } else {
                    clearError(descripcionInput);
                }

                // Validar descuento (opcional, pero si se ingresa debe ser válido y no mayor a 55)
                if (descuentoInput.value) {
                    const descuentoValue = parseFloat(descuentoInput.value);
                    if (isNaN(descuentoValue) || descuentoValue < 0 || descuentoValue > 55) {
                        showError(descuentoInput, 'El descuento debe ser un número entre 0 y 55.');
                        isValid = false;
                    } else {
                        clearError(descuentoInput);
                    }
                } else {
                    clearError(descuentoInput);
                }
                
                if (!imagenUrlInput.value) {
                     showError(document.getElementById('upload_widget').nextElementSibling, 'Debe subir una imagen.');
                     isValid = false;
                } else {
                     clearError(document.getElementById('upload_widget').nextElementSibling);
                }


                if (isValid) {
                    const planName = nombreInput.value;
                    const actionText = planIdInput.value ? 'actualizado' : 'creado';
                    
                    // Aquí iría la lógica para enviar al backend
                    // Como simulación, cerramos el modal y mostramos alerta
                    
                    closeModal();
                    Swal.fire({
                        icon: 'success',
                        title: '¡Éxito!',
                        text: `El plan "${planName}" ha sido ${actionText} correctamente.`,
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            });

            tableBody.addEventListener('click', (event) => {
                const editBtn = event.target.closest('.edit-btn');
                const deleteBtn = event.target.closest('.delete-btn');
                
                if (editBtn) {
                    const row = editBtn.closest('tr');
                    const planData = {
                        id: row.dataset.id,
                        nombre: row.querySelector('.plan-name').textContent,
                        descripcion: row.querySelector('.plan-description').textContent,
                        descuento: parseInt(row.querySelector('.plan-discount').textContent) || '',
                        imagen: row.querySelector('.table-image').src
                    };
                    openModal('edit', planData);
                }

                if (deleteBtn) {
                    const row = deleteBtn.closest('tr');
                    const planName = row.querySelector('.plan-name').textContent;
                    
                    Swal.fire({
                        title: `¿Eliminar "${planName}"?`,
                        text: "Esta acción no se puede deshacer.",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6',
                        confirmButtonText: 'Sí, eliminar',
                        cancelButtonText: 'Cancelar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            // Lógica de eliminación (en este caso, solo UI)
                            row.remove();
                            Swal.fire(
                                '¡Eliminado!',
                                'El plan ha sido eliminado.',
                                'success'
                            )
                        }
                    })
                }
            });
        });