document.addEventListener("DOMContentLoaded", () => {
        const container = document.querySelector('.container');
        const registerBtn = document.querySelector('.register-btn');
        const loginToggleBtn = document.querySelector('.login-btn');
        const loginForm = document.getElementById('loginForm');
        const multiStepForm = document.getElementById('multiStepForm');

        // --- LÓGICA PARA CAMBIAR ENTRE PANELES ---
        if (registerBtn) {
            registerBtn.addEventListener('click', () => container.classList.add('active'));
        }
        if (loginToggleBtn) {
            loginToggleBtn.addEventListener('click', () => container.classList.remove('active'));
        }

        // --- FUNCIONES DE VALIDACIÓN Y MANEJO DE ERRORES ---
        const showError = (input, message) => {
            const inputBox = input.parentElement;
            const errorDiv = inputBox.querySelector('.error-message');
            inputBox.classList.add('error');
            errorDiv.textContent = message;
        };
        const clearError = (input) => {
            const inputBox = input.parentElement;
            const errorDiv = inputBox.querySelector('.error-message');
            inputBox.classList.remove('error');
            errorDiv.textContent = '';
        };

        // --- LÓGICA DE LOGIN CON VALIDACIÓN ---
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                let isValid = true;
                const inputs = loginForm.querySelectorAll('input');
                inputs.forEach(input => {
                    clearError(input);
                    if (input.value.trim() === '') {
                        isValid = false;
                        showError(input, 'Este campo es obligatorio.');
                    }
                });

                if (isValid) {
                    Swal.fire({
                        title: '¡Éxito!',
                        text: 'Inicio de sesión correcto.',
                        icon: 'success',
                        confirmButtonText: 'Ok'
                    });
                }
            });
        }

        // --- LÓGICA PARA EL FORMULARIO DE REGISTRO POR PASOS ---
        if (multiStepForm) {
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            const progressBar = document.getElementById('progressBar');
            const steps = multiStepForm.querySelectorAll('.step');
            let currentStep = 0;

            const validateStep = (stepIndex) => {
                let isValid = true;
                const currentInputs = steps[stepIndex].querySelectorAll('input, select');
                
                currentInputs.forEach(input => {
                    clearError(input);
                    if (input.value.trim() === '') {
                        isValid = false;
                        showError(input, 'Este campo es obligatorio.');
                    } else {
                        if (input.name === 'correo' && !/^\S+@\S+\.\S+$/.test(input.value)) {
                            isValid = false;
                            showError(input, 'Por favor, introduce un correo válido.');
                        }
                        if (input.name === 'contrasena' && input.value.length < 8) {
                            isValid = false;
                            showError(input, 'La contraseña debe tener al menos 8 caracteres.');
                        }
                        if (input.name === 'telefono' && !/^\d{8}$/.test(input.value)) {
                            isValid = false;
                            showError(input, 'El teléfono debe contener 8 dígitos.');
                        }
                        if (input.name === 'dui' && !/^\d{9}$/.test(input.value)) {
                            isValid = false;
                            showError(input, 'El DUI debe contener 9 dígitos.');
                        }
                    }
                });
                return isValid;
            };

            const updateFormSteps = () => {
                steps.forEach((step, index) => step.classList.toggle('active', index === currentStep));
                progressBar.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
                prevBtn.style.display = currentStep === 0 ? 'none' : 'inline-block';
                nextBtn.textContent = currentStep === steps.length - 1 ? 'Registrarse' : 'Siguiente';
            };

            nextBtn.addEventListener('click', () => {
                if (validateStep(currentStep)) {
                    if (currentStep < steps.length - 1) {
                        currentStep++;
                        updateFormSteps();
                    } else {
                        multiStepForm.dispatchEvent(new Event('submit', { cancelable: true }));
                    }
                }
            });

            prevBtn.addEventListener('click', () => {
                if (currentStep > 0) {
                    currentStep--;
                    updateFormSteps();
                }
            });

            multiStepForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!validateStep(currentStep)) return;

                const formData = new FormData(multiStepForm);
                const data = Object.fromEntries(formData.entries());
                console.log("Datos del formulario para registrar:", data);

                Swal.fire({
                    title: '¡Registro Exitoso!',
                    text: 'Ahora serás devuelto al inicio de sesión.',
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        container.classList.remove('active');
                        setTimeout(() => {
                            multiStepForm.reset();
                            currentStep = 0;
                            updateFormSteps();
                            multiStepForm.querySelectorAll('input, select').forEach(clearError);
                        }, 600);
                    }
                });
            });

            updateFormSteps();
        }

        // --- LÓGICA PARA MOSTRAR/OCULTAR CONTRASEÑA ---
        const togglePasswordVisibility = (passwordInput, icon) => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('bx-show');
                icon.classList.add('bx-hide');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('bx-hide');
                icon.classList.add('bx-show');
            }
        };

        const loginPasswordInput = document.getElementById('loginPassword');
        const loginPasswordIcon = document.getElementById('loginPasswordIcon');
        const registerPasswordInput = document.getElementById('registerPassword');
        const registerPasswordIcon = document.getElementById('registerPasswordIcon');

        if(loginPasswordIcon) {
            loginPasswordIcon.addEventListener('click', () => togglePasswordVisibility(loginPasswordInput, loginPasswordIcon));
        }
        if(registerPasswordIcon) {
            registerPasswordIcon.addEventListener('click', () => togglePasswordVisibility(registerPasswordInput, registerPasswordIcon));
        }
    });