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

            // --- LÓGICA PARA CLOUDINARY (AVATAR) ---
            const cloudName = "YOUR_CLOUD_NAME"; 
            const uploadPreset = "YOUR_UPLOAD_PRESET";
            const avatarWidget = cloudinary.createUploadWidget({ cloudName, uploadPreset, cropping: true, sources: ['local', 'url', 'camera'], multiple: false, folder: 'avatars' }, (error, result) => { 
                if (!error && result && result.event === "success") { 
                    document.getElementById('profile-avatar').src = result.info.secure_url;
                     Swal.fire({ icon: 'success', title: '¡Foto de perfil actualizada!', timer: 2000, showConfirmButton: false });
                }
            });
            document.getElementById("upload_widget_avatar").addEventListener("click", () => avatarWidget.open(), false);

            // --- LÓGICA DE PESTAÑAS (TABS) ---
            const tabsContainer = document.getElementById('tabs');
            const tabPanes = document.querySelectorAll('.tab-pane');
            tabsContainer.addEventListener('click', (event) => {
                const tabBtn = event.target.closest('.tab-btn');
                if (!tabBtn) return;
                
                // Estilos de botones
                tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.classList.remove('tab-active', 'text-gray-600', 'dark:text-gray-300');
                    btn.classList.add('text-gray-600', 'dark:text-gray-300', 'border-transparent', 'hover:bg-gray-200', 'dark:hover:bg-gray-700');
                });
                tabBtn.classList.add('tab-active');
                tabBtn.classList.remove('hover:bg-gray-200', 'dark:hover:bg-gray-700');

                // Mostrar/Ocultar contenido
                const targetPaneId = tabBtn.dataset.tabTarget;
                tabPanes.forEach(pane => {
                    pane.classList.toggle('hidden', `#${pane.id}` !== targetPaneId);
                });
            });

            // --- LÓGICA DE FORMULARIOS Y VALIDACIÓN ---
            const profileForm = document.getElementById('profile-form');
            const passwordForm = document.getElementById('password-form');
            const logoutBtn = document.getElementById('logout-btn');

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

            // Validación Formulario de Perfil
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                let isValid = true;
                const usernameInput = document.getElementById('nombreUsuario');
                const emailInput = document.getElementById('correo');

                if (!usernameInput.value.trim()) {
                    showError(usernameInput, 'El nombre de usuario es obligatorio.');
                    isValid = false;
                } else { clearError(usernameInput); }

                if (!emailInput.value.trim()) {
                    showError(emailInput, 'El correo es obligatorio.');
                    isValid = false;
                } else if (!/^\S+@\S+\.\S+$/.test(emailInput.value)) {
                    showError(emailInput, 'Por favor, introduce un correo válido.');
                    isValid = false;
                } else { clearError(emailInput); }

                if (isValid) {
                    Swal.fire({ icon: 'success', title: '¡Perfil Actualizado!', text: 'Tus cambios han sido guardados.', timer: 2000, showConfirmButton: false });
                }
            });

            // Validación Formulario de Contraseña
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                let isValid = true;
                const currentPass = document.getElementById('currentPassword');
                const newPass = document.getElementById('newPassword');
                const confirmPass = document.getElementById('confirmPassword');

                if (!currentPass.value) { showError(currentPass, 'La contraseña actual es obligatoria.'); isValid = false; } else { clearError(currentPass); }
                
                if (!newPass.value) { 
                    showError(newPass, 'La nueva contraseña es obligatoria.'); isValid = false; 
                } else if (newPass.value.length < 8) {
                    showError(newPass, 'Debe tener al menos 8 caracteres.'); isValid = false;
                } else { clearError(newPass); }

                if (newPass.value && newPass.value !== confirmPass.value) {
                    showError(confirmPass, 'Las contraseñas no coinciden.'); isValid = false;
                } else if (!confirmPass.value) {
                     showError(confirmPass, 'Confirma tu nueva contraseña.'); isValid = false;
                } else { clearError(confirmPass); }

                if (isValid) {
                    passwordForm.reset();
                    Swal.fire({ icon: 'success', title: '¡Contraseña Actualizada!', timer: 2000, showConfirmButton: false });
                }
            });

            // Lógica de Cerrar Sesión
            logoutBtn.addEventListener('click', () => {
                 Swal.fire({
                    title: '¿Estás seguro?',
                    text: "Se cerrará tu sesión actual.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Sí, cerrar sesión',
                    cancelButtonText: 'Cancelar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Aquí iría la lógica real para desloguear al usuario.
                        // Por ahora, solo mostramos una alerta de éxito.
                         Swal.fire('¡Sesión Cerrada!', 'Has sido desconectado.', 'success')
                    }
                })
            });
});