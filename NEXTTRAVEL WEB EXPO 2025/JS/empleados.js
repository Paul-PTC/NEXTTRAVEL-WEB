document.addEventListener('DOMContentLoaded', function () {
    
    // --- LÓGICA DEL NAVBAR (Idéntica a la de clientes) ---
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

    document.querySelectorAll('[data-collapse-button]').forEach(button => {
        button.addEventListener('click', () => {
            const collapseId = button.getAttribute('data-collapse-button');
            const collapseContent = document.getElementById(collapseId);
            collapseContent.classList.toggle('hidden');
        });
    });

    // --- LÓGICA PARA EL MODAL DE EMPLEADO (AÑADIR/EDITAR) ---
    const modal = document.getElementById('employeeModal');
    const modalContent = document.getElementById('modal-content');
    const modalTitle = document.getElementById('modal-title');
    const openModalBtn = document.getElementById('add-employee-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const employeeForm = document.getElementById('employee-form');
    const tableBody = document.getElementById('employee-table-body');

    // Funciones para mostrar y limpiar errores de validación
    const showError = (input, message) => {
        const formGroup = input.parentElement;
        const errorDiv = formGroup.querySelector('.error-message');
        input.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    };

    const clearErrors = () => {
        document.querySelectorAll('#employee-form .error-message').forEach(div => {
            div.classList.add('hidden');
            div.textContent = '';
        });
        document.querySelectorAll('#employee-form input, #employee-form select').forEach(input => {
            input.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        });
    };

    // Función de validación
    const validateEmployeeForm = () => {
        clearErrors();
        let isValid = true;
        const dui = document.getElementById('dui');
        const nombre = document.getElementById('nombre');
        const correo = document.getElementById('correo');
        const telefono = document.getElementById('telefono');
        const rango = document.getElementById('rango');

        if (nombre.value.trim() === '') {
            showError(nombre, 'El nombre es obligatorio.');
            isValid = false;
        }
        if (!/^\d{8}-\d$/.test(dui.value)) {
            showError(dui, 'El formato del DUI debe ser 00000000-0.');
            isValid = false;
        }
        if (!/^\S+@\S+\.\S+$/.test(correo.value)) {
            showError(correo, 'Por favor, introduce un correo válido.');
            isValid = false;
        }
        if (!/^\d{4}-\d{4}$/.test(telefono.value)) {
            showError(telefono, 'El formato del teléfono debe ser 0000-0000.');
            isValid = false;
        }
        if (rango.value === '') {
            showError(rango, 'Debe seleccionar un rango.');
            isValid = false;
        }
        return isValid;
    };

    const openModal = (mode = 'add', employeeData = {}) => {
        clearErrors();
        if (mode === 'edit') {
            modalTitle.textContent = 'Editar Empleado';
            document.getElementById('employeeId').value = employeeData.dui;
            document.getElementById('dui').value = employeeData.dui;
            document.getElementById('nombre').value = employeeData.nombre;
            document.getElementById('correo').value = employeeData.correo;
            document.getElementById('telefono').value = employeeData.telefono;
            document.getElementById('rango').value = employeeData.rango;
        } else {
            modalTitle.textContent = 'Nuevo Empleado';
            employeeForm.reset();
        }
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modalContent.classList.remove('scale-95');
        }, 10);
    };

    const closeModal = () => {
        modal.classList.add('opacity-0');
        modalContent.classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            employeeForm.reset();
        }, 300);
    };

    if (openModalBtn) openModalBtn.addEventListener('click', () => openModal('add'));
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (modal) modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });

    tableBody.addEventListener('click', function(event) {
        const editButton = event.target.closest('.edit-btn');
        const deleteButton = event.target.closest('.delete-btn');

        if (editButton) {
            const row = editButton.closest('tr');
            const employeeData = {
                dui: row.cells[0].textContent,
                nombre: row.cells[1].textContent,
                correo: row.cells[2].textContent,
                telefono: row.cells[3].textContent,
                rango: row.cells[4].textContent.trim(),
            };
            openModal('edit', employeeData);
        }

        if (deleteButton) {
            const row = deleteButton.closest('tr');
            const employeeName = row.cells[1].textContent;
            Swal.fire({
                title: `¿Estás seguro de eliminar a ${employeeName}?`,
                text: "¡No podrás revertir esta acción!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, ¡eliminar!',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire('¡Eliminado!', `${employeeName} ha sido eliminado.`, 'success');
                }
            });
        }
    });

    employeeForm.addEventListener('submit', function(event) {
        event.preventDefault();
        if (validateEmployeeForm()) {
            const formData = new FormData(employeeForm);
            const data = Object.fromEntries(formData.entries());
            const mode = data.employeeId ? 'actualizado' : 'guardado';
            const employeeName = data.nombre;

            console.log('Datos a enviar:', data);

            closeModal();
            setTimeout(() => {
                 Swal.fire({
                    title: '¡Éxito!',
                    text: `El empleado "${employeeName}" ha sido ${mode} correctamente.`,
                    icon: 'success',
                    timer: 2500,
                    showConfirmButton: false
                });
            }, 350);
        }
    });
});
