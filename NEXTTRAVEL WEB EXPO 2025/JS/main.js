document.addEventListener('DOMContentLoaded', function () {
    
    // --- LÓGICA DEL NAVBAR ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const themeToggleBtns = document.querySelectorAll('#theme-toggle, #theme-toggle-mobile');

    // Menú móvil principal
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Cambio de tema (claro/oscuro)
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

    // Lógica para Dropdowns de escritorio
    document.querySelectorAll('[data-dropdown-button]').forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const menu = button.nextElementSibling;
            const isHidden = menu.classList.contains('hidden');
            // Oculta todos los menús abiertos antes de mostrar el actual
            document.querySelectorAll('[data-dropdown-menu]').forEach(m => m.classList.add('hidden'));
            if (isHidden) {
                menu.classList.remove('hidden');
            }
        });
    });
    // Cierra los dropdowns si se hace clic en cualquier otro lugar
    window.addEventListener('click', () => {
        document.querySelectorAll('[data-dropdown-menu]').forEach(menu => menu.classList.add('hidden'));
    });

    // Lógica para menús colapsables en móvil
    document.querySelectorAll('[data-collapse-button]').forEach(button => {
        button.addEventListener('click', () => {
            const collapseId = button.getAttribute('data-collapse-button');
            const collapseContent = document.getElementById(collapseId);
            collapseContent.classList.toggle('hidden');
        });
    });

    // --- LÓGICA PARA EL MODAL DE CLIENTE (AÑADIR/EDITAR) ---
    const modal = document.getElementById('clientModal');
    const modalContent = document.getElementById('modal-content');
    const modalTitle = document.getElementById('modal-title');
    const openModalBtn = document.getElementById('add-client-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const clientForm = document.getElementById('client-form');
    const tableBody = document.getElementById('client-table-body');

    const openModal = (mode = 'add', clientData = {}) => {
        if (mode === 'edit') {
            modalTitle.textContent = 'Editar Cliente';
            document.getElementById('clientId').value = clientData.dui;
            document.getElementById('dui').value = clientData.dui;
            document.getElementById('nombre').value = clientData.nombre;
            document.getElementById('correo').value = clientData.correo;
            document.getElementById('telefono').value = clientData.telefono;
        } else {
            modalTitle.textContent = 'Nuevo Cliente';
            clientForm.reset();
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
            clientForm.reset();
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
            const clientData = {
                dui: row.cells[0].textContent,
                nombre: row.cells[1].textContent,
                correo: row.cells[2].textContent,
                telefono: row.cells[3].textContent,
            };
            openModal('edit', clientData);
        }

        if (deleteButton) {
            const row = deleteButton.closest('tr');
            const clientName = row.cells[1].textContent;
            Swal.fire({
                title: `¿Estás seguro de eliminar a ${clientName}?`,
                text: "¡No podrás revertir esta acción!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, ¡eliminar!',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Lógica de eliminación aquí
                    Swal.fire('¡Eliminado!', `${clientName} ha sido eliminado.`, 'success');
                }
            });
        }
    });

    clientForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(clientForm);
        const data = Object.fromEntries(formData.entries());
        
        if (!data.dui || !data.nombre || !data.correo || !data.telefono) {
            Swal.fire('Error', 'Todos los campos son obligatorios.', 'error');
            return;
        }

        const mode = data.clientId ? 'editado' : 'guardado';
        console.log('Datos a enviar:', data);

        closeModal();
        setTimeout(() => {
             Swal.fire({
                title: '¡Éxito!',
                text: `El cliente ha sido ${mode} correctamente.`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        }, 350);
    });
});
