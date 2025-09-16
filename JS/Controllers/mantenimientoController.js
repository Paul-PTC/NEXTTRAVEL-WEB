import { 
    getMantenimientos,
    createMantenimiento, 
    getMantenimientoById, 
    getTiposMantenimientoMin,
    getVehiculosMin,
    deleteMantenimiento, 
    updateMantenimiento 
} from "../Services/mantenimientoService.js";

document.addEventListener("DOMContentLoaded", () => {
    // --- Referencias a los elementos del DOM ---
    const tableBody = document.getElementById("tblBodyMant");
    const pageInfo = document.getElementById("pageInfoMant");
    const pager = document.getElementById("pagerMant");
    const searchInput = document.getElementById("searchInput");

    // --- Referencias al Modal y Formulario ---
    const formEl = document.getElementById("mantForm");
    const lblModal = document.getElementById("mantModalLabel");
    const btnAdd = document.getElementById("btnAddMant");
    const selVehiculo = document.getElementById("idVehiculo");
    const selTipo = document.getElementById("idTipoMantenimiento");
    const inpDescripcion = document.getElementById("descripcion");
    const hiddenIdInput = document.getElementById("idMantenimiento");
    
    // Las funciones openModal y closeModal están definidas globalmente en el HTML.

    // --- Estado de la aplicación ---
    const state = {
        page: 0,
        size: 10,
        sort: "fecha,desc",
        q: "",
        field: "placa" // Campo de búsqueda por defecto
    };

    // --- Carga Inicial ---
    load();

    // --- Vinculación de Eventos de UI ---
    
    // Búsqueda con debounce
    let searchTimeout;
    searchInput?.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.q = searchInput.value.trim();
            state.page = 0;
            // Búsqueda inteligente: si parece placa, busca por placa, si no, por modelo.
            state.field = /^[A-Z0-9]{3,8}$/i.test(state.q) ? "placa" : "modelo";
            load();
        }, 400);
    });
    
    // Abrir modal para crear
    btnAdd?.addEventListener("click", async () => {
        formEl.reset();
        formEl.dataset.mode = "create";
        hiddenIdInput.value = "";
        lblModal.textContent = "Nuevo Mantenimiento";
        await loadSelectOptions();
        openModal();
    });

    // Enviar formulario (Crear o Editar)
    formEl?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const mode = formEl.dataset.mode;
        const dto = {
            idVehiculo: Number(selVehiculo.value),
            idTipoMantenimiento: Number(selTipo.value),
            descripcion: inpDescripcion.value.trim()
        };

        if (!dto.idVehiculo || !dto.idTipoMantenimiento) {
            showAlert({ icon: "error", title: "Datos incompletos", text: "Debe seleccionar un vehículo y un tipo de mantenimiento." });
            return;
        }

        try {
            if (mode === 'edit') {
                const id = hiddenIdInput.value;
                await updateMantenimiento(id, dto);
                showAlert({ icon: "success", title: "¡Actualizado!", text: "El registro se actualizó correctamente." });
            } else {
                await createMantenimiento(dto);
                showAlert({ icon: "success", title: "¡Creado!", text: "El nuevo mantenimiento se registró correctamente." });
            }
            closeModal();
            load();
        } catch (err) {
            showAlert({ icon: "error", title: "Error", text: err.message || "No se pudo guardar el registro." });
        }
    });

    // Delegación de eventos para botones de la tabla
    tableBody?.addEventListener("click", async (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        const row = btn.closest("tr");
        const id = row?.dataset.id;
        if (!id) return;

        if (btn.classList.contains("edit-btn")) {
            const mantenimiento = await getMantenimientoById(id);
            if (mantenimiento) {
                lblModal.textContent = "Editar Mantenimiento";
                formEl.dataset.mode = "edit";
                hiddenIdInput.value = mantenimiento.idMantenimiento;
                inpDescripcion.value = mantenimiento.descripcion;
                await loadSelectOptions(mantenimiento.idVehiculo, mantenimiento.idTipoMantenimiento);
                openModal();
            }
        } else if (btn.classList.contains("delete-btn")) {
            handleDelete(id);
        }
    });

    // --- Funciones de Carga y Renderizado ---

    async function load() {
        try {
            const data = await getMantenimientos(state);
            renderTable(data.items);
            renderInfo(data);
            renderPager(data);
        } catch (err) {
            tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-6 text-center text-red-500">Error al cargar datos: ${err.message}</td></tr>`;
        }
    }

    async function loadSelectOptions(selectedVehicleId = null, selectedTypeId = null) {
        try {
            const [vehiculos, tipos] = await Promise.all([
                getVehiculosMin(),
                getTiposMantenimientoMin()
            ]);

            selVehiculo.innerHTML = '<option value="">Seleccione un vehículo...</option>';
            vehiculos.forEach(v => {
                const opt = document.createElement("option");
                opt.value = v.idVehiculo;
                opt.textContent = `${v.placa} - ${v.modelo || ''}`;
                if (v.idVehiculo == selectedVehicleId) opt.selected = true;
                selVehiculo.appendChild(opt);
            });

            selTipo.innerHTML = '<option value="">Seleccione un tipo...</option>';
            tipos.forEach(t => {
                const opt = document.createElement("option");
                opt.value = t.idTipoMantenimiento;
                opt.textContent = t.nombreTipo;
                 if (t.idTipoMantenimiento == selectedTypeId) opt.selected = true;
                selTipo.appendChild(opt);
            });

        } catch (error) {
            showAlert({ icon: 'error', title: 'Error de carga', text: 'No se pudieron cargar las opciones para el formulario.' });
        }
    }

    function renderTable(items) {
        tableBody.innerHTML = "";
        if (!items?.length) {
            tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-6 text-center text-yinmn-blue dark:text-silver-lake-blue">No hay registros de mantenimiento.</td></tr>`;
            return;
        }
        tableBody.innerHTML = items.map(it => `
            <tr class="border-b dark:border-rich-black" data-id="${it.idMantenimiento}">
                <td class="px-6 py-4 font-medium dark:text-white">${it.modelo ?? "N/A"}</td>
                <td class="px-6 py-4">${it.placa ?? "N/A"}</td>
                <td class="px-6 py-4"><span class="bg-silver-lake-blue/20 dark:bg-silver-lake-blue/10 text-yinmn-blue dark:text-platinum px-2 py-1 rounded-full text-xs">${it.tipoMantenimiento ?? "General"}</span></td>
                <td class="px-6 py-4 text-yinmn-blue dark:text-silver-lake-blue">${it.descripcion ?? "Sin descripción"}</td>
                <td class="px-6 py-4">${fmtDate(it.fecha)}</td>
                <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center space-x-2">
                         <button class="edit-btn p-2 bg-silver-lake-blue/20 hover:bg-silver-lake-blue/40 text-yinmn-blue dark:bg-yinmn-blue/30 dark:hover:bg-yinmn-blue/50 dark:text-platinum rounded-lg transition-colors" title="Editar">
                            <i class="w-5 h-5 pointer-events-none" data-lucide="file-pen-line"></i>
                        </button>
                        <button class="delete-btn p-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg transition-colors" title="Eliminar">
                            <i class="w-5 h-5 pointer-events-none" data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join("");
        lucide.createIcons();
    }

    function renderInfo({ total, page, size }) {
        if (!total) { pageInfo.textContent = "Sin resultados"; return; }
        const from = page * size + 1;
        const to = Math.min(total, (page + 1) * size);
        pageInfo.textContent = `Mostrando ${from}-${to} de ${total}`;
    }

    function renderPager({ totalPages, page }) {
        pager.innerHTML = "";
        if (totalPages <= 1) return;
        const createPageLink = (text, pageNum, isDisabled = false, isActive = false) => {
            const li = document.createElement("li");
            const link = document.createElement("a");
            link.href = "#";
            link.innerHTML = text;
            link.className = `relative block py-2 px-3 text-sm rounded-lg border transition-colors ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${
                isActive 
                ? 'bg-yinmn-blue border-yinmn-blue text-white' 
                : 'bg-white dark:bg-oxford-blue border-platinum dark:border-rich-black text-yinmn-blue dark:text-silver-lake-blue hover:bg-platinum/80 dark:hover:bg-rich-black/80'
            }`;
            if (!isDisabled) {
                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    state.page = pageNum;
                    load();
                });
            }
            li.appendChild(link);
            return li;
        };
        pager.appendChild(createPageLink('«', page - 1, page === 0));
        for (let i = 0; i < totalPages; i++) {
            pager.appendChild(createPageLink(i + 1, i, false, i === page));
        }
        pager.appendChild(createPageLink('»', page + 1, page >= totalPages - 1));
    }

    function handleDelete(id) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `El registro de mantenimiento #${id} será eliminado.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sí, eliminar',
            customClass: {
                popup: 'bg-white dark:bg-oxford-blue text-rich-black dark:text-platinum backdrop-blur-xl shadow-2xl rounded-xl',
                title: 'text-rich-black dark:text-white',
                htmlContainer: 'text-yinmn-blue dark:text-silver-lake-blue'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteMantenimiento(id);
                    showAlert({ icon: 'success', title: 'Eliminado', text: 'El registro ha sido eliminado.' });
                    load();
                } catch (error) {
                    showAlert({ icon: 'error', title: 'Error', text: error.message });
                }
            }
        });
    }

    // --- Utilidades ---
    const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("es-SV") : "";
    const showAlert = ({ icon, title, text }) => {
        Swal.fire({ icon, title, text,
            customClass: {
                popup: 'bg-white dark:bg-oxford-blue text-rich-black dark:text-platinum backdrop-blur-xl shadow-2xl rounded-xl',
                title: 'text-rich-black dark:text-white',
                htmlContainer: 'text-yinmn-blue dark:text-silver-lake-blue'
            }
        });
    };
});
