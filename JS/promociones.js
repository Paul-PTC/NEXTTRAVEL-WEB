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
            const tableBody = document.getElementById('promo-table-body');

            sortSelect.addEventListener('change', (event) => {
                const sortBy = event.target.value;
                const rows = Array.from(tableBody.querySelectorAll('tr'));

                const sortedRows = rows.sort((a, b) => {
                    const nameA = a.querySelector('.promo-name').textContent.trim().toLowerCase();
                    const nameB = b.querySelector('.promo-name').textContent.trim().toLowerCase();
                    const dateA = a.dataset.fechaInicio;
                    const dateB = b.dataset.fechaInicio;

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
            const modal = document.getElementById('promoModal');
            const modalContent = document.getElementById('modal-content');
            const modalTitle = document.getElementById('modal-title');
            const openModalBtn = document.getElementById('add-promo-btn');
            const closeModalBtn = document.getElementById('close-modal-btn');
            const cancelBtn = document.getElementById('cancel-btn');
            const promoForm = document.getElementById('promo-form');
            const promoIdInput = document.getElementById('promoId');
            const nombreInput = document.getElementById('nombre');
            const descuentoInput = document.getElementById('descuento');
            const fechaInicioInput = document.getElementById('fechaInicio');
            const fechaFinInput = document.getElementById('fechaFin');
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
                promoForm.reset();
                document.querySelectorAll('.error-message').forEach(el => el.classList.add('hidden'));
                document.querySelectorAll('input, textarea').forEach(el => el.classList.remove('input-error'));
                
                if (mode === 'edit') {
                    modalTitle.textContent = 'Editar Promoción';
                    promoIdInput.value = data.id;
                    nombreInput.value = data.nombre;
                    descuentoInput.value = data.descuento;
                    fechaInicioInput.value = data.fechaInicio;
                    fechaFinInput.value = data.fechaFin;
                    imagenUrlInput.value = data.imagen;
                    if (data.imagen) {
                        document.getElementById('image-preview').src = data.imagen;
                        document.getElementById('image-preview-container').classList.remove('hidden');
                    }
                } else {
                    modalTitle.textContent = 'Nueva Promoción';
                    promoIdInput.value = '';
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

            promoForm.addEventListener('submit', function(event) {
                event.preventDefault();
                let isValid = true;

                // Validaciones
                if (!nombreInput.value.trim()) {
                    showError(nombreInput, 'El nombre es obligatorio.');
                    isValid = false;
                } else { clearError(nombreInput); }

                if (!descuentoInput.value) {
                     showError(descuentoInput, 'El descuento es obligatorio.');
                     isValid = false;
                } else {
                    const descVal = parseFloat(descuentoInput.value);
                    if (isNaN(descVal) || descVal < 0 || descVal > 55) {
                        showError(descuentoInput, 'Debe ser un número entre 0 y 55.');
                        isValid = false;
                    } else { clearError(descuentoInput); }
                }

                if (!fechaInicioInput.value) {
                    showError(fechaInicioInput, 'La fecha de inicio es obligatoria.');
                    isValid = false;
                } else { clearError(fechaInicioInput); }

                if (!fechaFinInput.value) {
                    showError(fechaFinInput, 'La fecha de fin es obligatoria.');
                    isValid = false;
                } else { clearError(fechaFinInput); }

                if (fechaInicioInput.value && fechaFinInput.value && fechaFinInput.value < fechaInicioInput.value) {
                    showError(fechaFinInput, 'La fecha de fin debe ser posterior a la de inicio.');
                    isValid = false;
                }
                
                if (!imagenUrlInput.value) {
                     showError(document.getElementById('upload_widget').nextElementSibling, 'Debe subir una imagen.');
                     isValid = false;
                } else { clearError(document.getElementById('upload_widget').nextElementSibling); }

                if (isValid) {
                    const promoName = nombreInput.value;
                    const actionText = promoIdInput.value ? 'actualizada' : 'creada';
                    closeModal();
                    Swal.fire({
                        icon: 'success',
                        title: '¡Éxito!',
                        text: `La promoción "${promoName}" ha sido ${actionText} correctamente.`,
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
                    const promoData = {
                        id: row.dataset.id,
                        nombre: row.querySelector('.promo-name').textContent,
                        descuento: parseInt(row.querySelector('.promo-discount').textContent),
                        fechaInicio: row.dataset.fechaInicio,
                        fechaFin: row.dataset.fechaFin,
                        imagen: row.querySelector('.table-image').src
                    };
                    openModal('edit', promoData);
                }

                if (deleteBtn) {
                    const row = deleteBtn.closest('tr');
                    const promoName = row.querySelector('.promo-name').textContent;
                    Swal.fire({
                        title: `¿Eliminar "${promoName}"?`, text: "Esta acción no se puede deshacer.", icon: 'warning',
                        showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
                        confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            row.remove();
                            Swal.fire('¡Eliminado!', 'La promoción ha sido eliminada.', 'success')
                        }
                    })
                }
            });

            // --- CÁLCULO DE DURACIÓN ---
            function calculateDaysRemaining() {
                document.querySelectorAll('#promo-table-body tr').forEach(row => {
                    const endDateStr = row.dataset.fechaFin;
                    if (!endDateStr) return;
                    
                    const endDate = new Date(endDateStr + 'T23:59:59'); // Final del día
                    const today = new Date();
                    const countdownEl = row.querySelector('.countdown');
                    const timeDiff = endDate.getTime() - today.getTime();
                    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
                    
                    if (daysRemaining > 0) {
                        countdownEl.textContent = `Quedan ${daysRemaining} días`;
                        countdownEl.className = 'countdown font-bold text-green-600 dark:text-green-400';
                    } else if (daysRemaining === 0) {
                         countdownEl.textContent = '¡Termina hoy!';
                         countdownEl.className = 'countdown font-bold text-yellow-600 dark:text-yellow-400';
                    } else {
                        countdownEl.textContent = 'Finalizada';
                        countdownEl.className = 'countdown font-bold text-red-600 dark:text-red-400';
                    }
                });
            }
            calculateDaysRemaining();
});