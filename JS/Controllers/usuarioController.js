import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../Services/usuarioService.js';

document.addEventListener('DOMContentLoaded', function () {
    // --- REFERENCIAS AL DOM ---
    const tableBody = document.getElementById('user-table-body');
    const searchInput = document.getElementById('searchInput');
    const paginationContainer = document.getElementById('pagination');
    const pageInfo = document.getElementById('pageInfo');
    
    // Modal y Formulario
    const addBtn = document.getElementById('btnAdd');
    const modalLabel = document.getElementById('userModalLabel');
    const userForm = document.getElementById('userForm');
    
    // Campos del formulario
    const userIdInput = document.getElementById('userId');
    const userNameInput = document.getElementById('userName');
    const userEmailInput = document.getElementById('userEmail');
    const userPasswordInput = document.getElementById('userPassword');
    const userRoleSelect = document.getElementById('userRole');

    // --- ESTADO DE LA APLICACIÓN ---
    let state = {
        currentPage: 0,
        pageSize: 10,
        sort: 'nombreUsuario,asc',
        searchTerm: '',
        searchType: 'nombreUsuario', // Búsqueda por defecto
        totalPages: 0,
    };

    // --- CARGA INICIAL ---
    loadUsuarios();

    // --- LÓGICA DE CARGA DE DATOS ---
    async function loadUsuarios() {
        try {
            // AJUSTE: Se llama a getUsuarios con argumentos individuales, como espera el service original.
            const data = await getUsuarios(
                state.currentPage,
                state.pageSize,
                state.sort,
                state.searchTerm,
                state.searchType
            );
            
            state.totalPages = data.totalPages;
            renderTable(data.content || []);
            renderPagination(); // Estas funciones se adaptarán si es necesario
            renderPageInfo(data);
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">${error.message}</td></tr>`;
        }
    }

    // --- RENDERIZADO DE LA UI ---
    function renderTable(usuarios) {
        tableBody.innerHTML = '';
        if (usuarios.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-yinmn-blue dark:text-silver-lake-blue">No se encontraron usuarios.</td></tr>`;
            return;
        }
        
        const rolColors = {
            'ADMIN': 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-400',
            'USER': 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-400',
            'EMPLOYEE': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400',
        };

        usuarios.forEach(usuario => {
            const tr = document.createElement('tr');
            tr.className = "border-b dark:border-rich-black";
            // AJUSTE: Se guardan los datos en el TR para usarlos al editar, ya que no hay getUsuarioById
            tr.dataset.id = usuario.idUsuario;
            tr.dataset.nombre = usuario.nombreUsuario;
            tr.dataset.correo = usuario.correo;
            tr.dataset.rol = usuario.rol;
            tr.dataset.foto_url = usuario.foto_url || '';


            tr.innerHTML = `
                <td class="px-6 py-4 font-medium flex items-center space-x-3">
                    <img src="${usuario.foto_url || `https://placehold.co/40x40/778da9/ffffff?text=${usuario.nombreUsuario.charAt(0).toUpperCase()}`}" class="w-10 h-10 rounded-full object-cover" alt="${usuario.nombreUsuario}">
                    <span class="dark:text-white">${usuario.nombreUsuario}</span>
                </td>
                <td class="px-6 py-4">${usuario.idUsuario}</td>
                <td class="px-6 py-4 text-silver-lake-blue">${usuario.correo}</td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${rolColors[usuario.rol] || 'bg-gray-200 text-gray-800'}">
                        ${usuario.rol || 'N/A'}
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
    
    function renderPagination() { /* ... Lógica de paginación (similar a otros controllers) ... */ }
    function renderPageInfo(data) { /* ... Lógica de info de página (similar a otros controllers) ... */ }

    // --- EVENT HANDLERS ---
    
    // Búsqueda
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.currentPage = 0;
            state.searchTerm = searchInput.value.trim();
            // Lógica simple de tipo de búsqueda
            if (state.searchTerm.includes('@')) {
                state.searchType = 'correo';
            } else if (['admin', 'user', 'employee'].some(r => state.searchTerm.toLowerCase().includes(r))) {
                state.searchType = 'rol';
            } else {
                state.searchType = 'nombreUsuario';
            }
            loadUsuarios();
        }, 400);
    });

    // Abrir modal para crear
    addBtn.addEventListener('click', () => {
        userForm.reset();
        modalLabel.textContent = 'Nuevo Usuario';
        userIdInput.value = '';
        userPasswordInput.setAttribute('placeholder', '********');
        userPasswordInput.setAttribute('required', 'required');
        window.openModal();
    });

    // Delegación de eventos en la tabla
    tableBody.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            const row = editBtn.closest('tr');
            // AJUSTE: Se leen los datos de la fila porque no hay getUsuarioById
            modalLabel.textContent = 'Editar Usuario';
            userIdInput.value = row.dataset.id;
            userNameInput.value = row.dataset.nombre;
            userEmailInput.value = row.dataset.correo;
            userRoleSelect.value = row.dataset.rol;
            userPasswordInput.removeAttribute('required');
            userPasswordInput.setAttribute('placeholder', 'Dejar en blanco para no cambiar');
            window.openModal();
        }

        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const id = deleteBtn.closest('tr').dataset.id;
            handleDelete(id);
        }
    });

    // Enviar formulario
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = userIdInput.value;
        
        // AJUSTE: Se usa FormData como lo esperaba el service original
        const formData = new FormData();
        formData.append("nombreUsuario", userNameInput.value);
        formData.append("correo", userEmailInput.value);
        formData.append("rol", userRoleSelect.value);

        if (userPasswordInput.value) {
            formData.append("password", userPasswordInput.value);
        }

        try {
            if (id) { // Actualizar
                await updateUsuario(id, formData);
                showAlert('¡Actualizado!', 'El usuario ha sido actualizado.', 'success');
            } else { // Crear
                if (!userPasswordInput.value) {
                    showAlert('Error', 'La contraseña es obligatoria para nuevos usuarios.', 'error');
                    return;
                }
                await createUsuario(formData);
                showAlert('¡Creado!', 'El nuevo usuario ha sido registrado.', 'success');
            }
            window.closeModal();
            loadUsuarios();
        } catch (error) {
            showAlert('Error', error.message, 'error');
        }
    });

    function handleDelete(id) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `El usuario #${id} será eliminado.`,
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
                    await deleteUsuario(id);
                    showAlert('¡Eliminado!', 'El usuario ha sido eliminado.', 'success');
                    loadUsuarios();
                } catch (error) {
                    showAlert('Error', error.message, 'error');
                }
            }
        });
    }
    
    // Funciones de utilidad y renderizado de paginación
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

