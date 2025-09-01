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
    btn.addEventListener('click', function () {
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
////////////////////////////////////////////////////////////////////////////////////////////////////////
import {
    getUsuarios,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
} from "../Services/usuarioServices.js";

// Variables para la paginacion y busqueda
let currentPage = 0;
let currentSize = 10;
let currentSearchType = 'nombre';
let currentSearchTerm = '';

document.addEventListener("DOMContentLoaded", () => {
    // Referencias a elementos del DOM
    const tableBody = document.getElementById("user-table-body");
    const form = document.getElementById("userForm");
    const modalElement = document.getElementById("userModal");
    const userModal = new bootstrap.Modal(modalElement);
    const modalLabel = document.getElementById("userModalLabel");
    const btnAdd = document.getElementById("btnAdd");
    const mainContent = document.querySelector('main');
    const headerContent = document.querySelector('header');
    
    // Elementos del formulario
    const userIdInput = document.getElementById("userId");
    const userNameInput = document.getElementById("userName");
    const userEmailInput = document.getElementById("userEmail");
    const userRoleInput = document.getElementById("userRole");
    const passwordInput = document.getElementById("userPassword");

    // Elementos para la busqueda
    const searchInput = document.getElementById("searchInput");
    const searchType = document.getElementById("searchType");
    
    //Campos para el manejo de imágenes
    const imageFileInput = document.getElementById("userImageFileInput");
    const imageUrlHidden = document.getElementById("userImageUrl");
    const imagePreview = document.getElementById("userImagePreview");
    
    // Lógica para añadir y quitar el atributo 'inert'
    modalElement.addEventListener('show.bs.modal', function() {
        if (mainContent) mainContent.setAttribute('inert', '');
        if (headerContent) headerContent.setAttribute('inert', '');
    });

    modalElement.addEventListener('hidden.bs.modal', function() {
        if (mainContent) mainContent.removeAttribute('inert');
        if (headerContent) headerContent.removeAttribute('inert');
    });

    // Evento para previsualizar la imagen seleccionada
    if (imageFileInput && imagePreview) {
        imageFileInput.addEventListener("change", () => {
            const file = imageFileInput.files?.[0];
            const fileNameDisplay = document.getElementById("file-name-display");
            
            if (file) {
                const reader = new FileReader();
                reader.onload = () => (imagePreview.src = reader.result);
                reader.readAsDataURL(file);
                if (fileNameDisplay) fileNameDisplay.textContent = file.name;
            } else {
                imagePreview.src = imageUrlHidden?.value || "https://placehold.co/150x150/EFEFEF/white?text=User";
                if (fileNameDisplay) fileNameDisplay.textContent = "Ningún archivo seleccionado";
            }
        });
    }

    // Evento que cambia la cantidad de registros por página
    const sizeSelector = document.getElementById("pageSize");
    if (sizeSelector) {
        sizeSelector.addEventListener("change", () => {
            currentSize = parseInt(sizeSelector.value);
            currentPage = 0;
            cargarUsuarios();
        });
    }

    // Evento de búsqueda por tipo
    if (searchType) {
        searchType.addEventListener("change", (e) => {
            currentSearchType = e.target.value;
            currentPage = 0; // Reinicia la página al cambiar el tipo de búsqueda
            cargarUsuarios();
        });
    }

    // Evento para el campo de busqueda
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            currentSearchTerm = searchInput.value.trim();
            currentPage = 0;
            cargarUsuarios();
        });
    }

    // Evento para el botón de agregar
    if (btnAdd) {
        btnAdd.addEventListener("click", () => {
            limpiarFormulario();
            modalLabel.textContent = "Agregar nuevo usuario";
            // Asegúrate de que el campo de contraseña sea requerido para la creación
            if (passwordInput) passwordInput.required = true;
            userModal.show();
        });
    }

    // Evento de submit para el formulario
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = userIdInput.value;
            const formData = new FormData();

            formData.append("nombreUsuario", userNameInput.value.trim());
            formData.append("correo", userEmailInput.value.trim());
            formData.append("rol", userRoleInput.value);

            if (passwordInput.value.trim() !== '') {
                formData.append("password", passwordInput.value);
            }
            
            const file = imageFileInput?.files?.[0];
            if (file) {
                formData.append("image", file);
            } else if (imageUrlHidden?.value) {
                formData.append("Foto_Url", imageUrlHidden.value);
            }

            try {
                if (id) {
                    await actualizarUsuario(id, formData);
                    Swal.fire('¡Actualizado!', 'El usuario ha sido actualizado.', 'success');
                } else {
                    if (!passwordInput.value.trim()) {
                        Swal.fire('Error', 'La contraseña es obligatoria para crear un nuevo usuario.', 'error');
                        return;
                    }
                    await crearUsuario(formData);
                    Swal.fire('¡Guardado!', 'El nuevo usuario ha sido agregado.', 'success');
                }
                userModal.hide();
                await cargarUsuarios();
            } catch (err) {
                console.error("Error guardando:", err);
                Swal.fire('Error', err.message || 'Ocurrió un error al guardar el usuario. Intenta de nuevo.', 'error');
            }
        });
    }

    // Función para cargar usuarios con paginación y búsqueda
    async function cargarUsuarios() {
        try {
            // Unificada la lógica de listado y búsqueda en una sola llamada a getUsuarios
            const data = await getUsuarios(currentPage, currentSize, 'nombreUsuario,asc', currentSearchTerm, currentSearchType);
            
            const items = data.content || [];
            if (!tableBody) return;
            tableBody.innerHTML = "";
            
            renderPagination(data.number, data.totalPages);

            if (items.length === 0) {
                 tableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500 dark:text-gray-400">No se encontraron usuarios.</td></tr>`;
                 return;
            }

            items.forEach((item) => {
                // Verificación de integridad del objeto
                if (!item || item.idUsuario === undefined) {
                    console.error("Error: el objeto de usuario está incompleto o no tiene ID", item);
                    return; // Ignora el elemento si está incompleto
                }
                
                const tr = document.createElement("tr");
                tr.className = "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors";

                // Celda de ID
                const tdId = document.createElement("td");
                tdId.className = "px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white";
                tdId.textContent = item.idUsuario;
                tr.appendChild(tdId);

                // Celda de Imagen
                const tdImg = document.createElement("td");
                tdImg.className = "px-6 py-4";
                const img = document.createElement("img");
                img.className = "w-10 h-10 rounded-full";
                img.alt = "Foto de usuario";
                img.src = item.fotUrl || "https://placehold.co/40x40/EFEFEF/white?text=User";
                tdImg.appendChild(img);
                tr.appendChild(tdImg);

                // Celda de Nombre
                const tdNombre = document.createElement("td");
                tdNombre.className = "px-6 py-4";
                tdNombre.textContent = item.nombreUsuario;
                tr.appendChild(tdNombre);

                // Celda de Rol
                const tdRol = document.createElement("td");
                tdRol.className = "px-6 py-4";
                tdRol.textContent = item.rol;
                tr.appendChild(tdRol);

                // Celda de Email
                const tdEmail = document.createElement("td");
                tdEmail.className = "px-6 py-4";
                tdEmail.textContent = item.correo;
                tr.appendChild(tdEmail);

                // Celda de Acciones
                const tdBtns = document.createElement("td");
                tdBtns.className = "px-6 py-4 text-center space-x-2";
                
                // Botón de Editar
                const btnEdit = document.createElement("button");
                btnEdit.className = "bg-yellow-100 text-yellow-800 p-2 rounded-full hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800 transition-colors";
                btnEdit.title = "Editar";
                btnEdit.innerHTML = `<i class="bi bi-pencil-square text-lg"></i>`;
                btnEdit.addEventListener("click", () => setFormulario(item));
                tdBtns.appendChild(btnEdit);

                // Botón de Eliminar
                const btnDel = document.createElement("button");
                btnDel.className = "bg-red-100 text-red-800 p-2 rounded-full hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 transition-colors";
                btnDel.title = "Eliminar";
                btnDel.innerHTML = `<i class="bi bi-trash-fill text-lg"></i>`;
                btnDel.addEventListener("click", async () => {
                    Swal.fire({
                        title: '¿Estás seguro?',
                        text: `El usuario "${item.nombreUsuario}" será eliminado permanentemente.`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Sí, eliminar',
                        cancelButtonText: 'Cancelar'
                    }).then(async (result) => {
                        if (result.isConfirmed) {
                            try {
                                await eliminarUsuario(item.idUsuario);
                                await cargarUsuarios();
                                Swal.fire('¡Eliminado!', 'El usuario ha sido eliminado.', 'success');
                            } catch (err) {
                                console.error("Error eliminando el usuario:", err);
                                Swal.fire('Error', 'Hubo un error al intentar eliminar el usuario.', 'error');
                            }
                        }
                    });
                });
                tdBtns.appendChild(btnDel);

                tr.appendChild(tdBtns);
                tableBody.appendChild(tr);
            });
        } catch (err) {
            console.error("Error cargando usuarios:", err);
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500 dark:text-gray-400">Error al cargar los datos.</td></tr>`;
        }
    }

    // Función para rellenar formulario al editar
    function setFormulario(item) {
        if (form) {
            // Asegúrate de que las propiedades del objeto existen
            userIdInput.value = item.idUsuario || '';
            userNameInput.value = item.nombreUsuario || '';
            userEmailInput.value = item.correo || '';
            userRoleInput.value = item.rol || '';
            
            // El campo password no se debe rellenar por seguridad
            passwordInput.value = '';
            // El campo de contraseña no es obligatorio al editar
            passwordInput.removeAttribute('required');

            if (imageUrlHidden) imageUrlHidden.value = item.fotUrl || "";
            if (imagePreview) imagePreview.src = item.fotUrl || "https://placehold.co/150x150/EFEFEF/white?text=User";
            if (imageFileInput) imageFileInput.value = "";
            const fileNameDisplay = document.getElementById("file-name-display");
            if (fileNameDisplay) fileNameDisplay.textContent = item.fotUrl ? "Archivo actual" : "Ningún archivo seleccionado";
        }
        modalLabel.textContent = "Editar usuario";
        userModal.show();
    }

    // Vaciar el formulario
    function limpiarFormulario() {
        if (form) {
            form.reset();
            userIdInput.value = "";
            
            if (imageUrlHidden) imageUrlHidden.value = "";
            if (imagePreview) imagePreview.src = "https://placehold.co/150x150/EFEFEF/white?text=User";
            if (imageFileInput) imageFileInput.value = "";
            const fileNameDisplay = document.getElementById("file-name-display");
            if (fileNameDisplay) fileNameDisplay.textContent = "Ningún archivo seleccionado";
            
            // El campo de contraseña es obligatorio al crear
            if (passwordInput) passwordInput.setAttribute('required', 'required');
        }
    }

    // Renderizado de paginación
    function renderPagination(current, totalPages) {
        const pagination = document.getElementById("pagination");
        if (!pagination) return;
        pagination.innerHTML = "";
        
        // Botón Anterior
        const prev = document.createElement("li");
        prev.className = `inline-flex items-center justify-center h-10 px-4 transition-colors ${current === 0 ? "text-gray-400 pointer-events-none" : "text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"}`;
        const prevLink = document.createElement("a");
        prevLink.className = "page-link";
        prevLink.href = "#";
        prevLink.textContent = "Anterior";
        prevLink.addEventListener("click", (e) => {
            e.preventDefault();
            if (current > 0) {
                currentPage = current - 1;
                cargarUsuarios();
            }
        });
        prev.appendChild(prevLink);
        pagination.appendChild(prev);

        // Páginas
        for (let i = 0; i < totalPages; i++) {
            const li = document.createElement("li");
            li.className = `inline-flex items-center justify-center h-10 w-10 text-sm font-semibold transition-colors rounded-full ${i === current ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"}`;
            const link = document.createElement("a");
            link.className = "page-link";
            link.href = "#";
            link.textContent = i + 1;
            link.addEventListener("click", (e) => {
                e.preventDefault();
                currentPage = i;
                cargarUsuarios();
            });
            li.appendChild(link);
            pagination.appendChild(li);
        }

        // Botón Siguiente
        const next = document.createElement("li");
        next.className = `inline-flex items-center justify-center h-10 px-4 transition-colors ${current >= totalPages - 1 ? "text-gray-400 pointer-events-none" : "text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"}`;
        const nextLink = document.createElement("a");
        nextLink.className = "page-link";
        nextLink.href = "#";
        nextLink.textContent = "Siguiente";
        nextLink.addEventListener("click", (e) => {
            e.preventDefault();
            if (current < totalPages - 1) {
                currentPage = current + 1;
                cargarUsuarios();
            }
        });
        next.appendChild(nextLink);
        pagination.appendChild(next);
    }

    // Llamadas iniciales
    cargarUsuarios();
});