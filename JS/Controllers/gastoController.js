import { getGastos, createGasto, getTiposGasto, deleteGasto, updateGasto } from "../Services/gastoService.js";

document.addEventListener("DOMContentLoaded", () => {
    // --- Referencias a los elementos del DOM ---
    const tblBody = document.getElementById("tblBodyGasto");
    const pageInfo = document.getElementById("pageInfoGasto");
    const pager = document.getElementById("pagerGasto");
    const searchInput = document.getElementById("searchInput");

    // --- Referencias al Modal y Formulario ---
    const formEl = document.getElementById("gastoForm");
    const lblModal = document.getElementById("gastoModalLabel");
    const btnAdd = document.getElementById("btnAddGasto");
    const selTipoGasto = document.getElementById("idTipoGasto");
    
    // Las funciones openModal y closeModal están en el HTML.

    // --- Estado de la aplicación ---
    const state = {
        page: 0,
        size: 10, // Tamaño de página fijo por ahora.
        sort: "fecha,desc",
        q: "",
        searchMode: "descripcion", // El service busca por descripción por defecto
    };

    // --- Vinculación de Eventos de UI ---

    // Búsqueda con debounce
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                state.q = searchInput.value.trim();
                state.page = 0;
                load();
            }, 400);
        });
    }
    
    // Abrir modal para crear un nuevo gasto
    if (btnAdd) {
        btnAdd.addEventListener("click", async () => {
            formEl.reset();
            formEl.dataset.mode = "create";
            lblModal.textContent = "Nuevo Gasto";
            formEl.idGasto.value = "";
            await loadTiposGasto(); // Carga las categorías en el select
            openModal();
        });
    }

    // Gestionar envío del formulario (Crear y Editar)
    if (formEl) {
        formEl.addEventListener("submit", async (e) => {
            e.preventDefault();
            const mode = formEl.dataset.mode;
            const dto = {
                idTipoGasto: Number(formEl.idTipoGasto.value),
                monto: Number(formEl.monto.value),
                descripcion: formEl.descripcion.value.trim(),
            };

            // Validación simple
            if (!dto.idTipoGasto || dto.monto <= 0) {
                showAlert({ icon: "error", title: "Datos incompletos", text: "Por favor, seleccione un tipo de gasto y un monto válido." });
                return;
            }

            try {
                if (mode === 'edit') {
                    const id = formEl.idGasto.value;
                    await updateGasto(id, dto);
                    showAlert({ icon: "success", title: "¡Actualizado!", text: "El gasto se actualizó correctamente." });
                } else {
                    await createGasto(dto);
                    showAlert({ icon: "success", title: "¡Creado!", text: "El gasto se registró correctamente." });
                }
                closeModal();
                load();
            } catch (err) {
                showAlert({ icon: "error", title: "Error", text: err.message || "No se pudo guardar el registro." });
            }
        });
    }

    // Delegación de eventos para botones de la tabla
    if (tblBody) {
        tblBody.addEventListener("click", async (e) => {
            const btn = e.target.closest("button");
            if (!btn) return;

            const row = btn.closest("tr");
            const id = row?.dataset.id;
            if (!id) return;

            if (btn.classList.contains("edit-btn")) {
                // Rellenar formulario y abrir modal
                lblModal.textContent = "Editar Gasto";
                formEl.dataset.mode = "edit";
                formEl.idGasto.value = id;
                formEl.monto.value = row.dataset.monto;
                formEl.descripcion.value = row.dataset.descripcion;
                await loadTiposGasto(row.dataset.idtipogasto); // Carga tipos y selecciona el actual
                openModal();
            } else if (btn.classList.contains("delete-btn")) {
                // Confirmar y eliminar
                const { isConfirmed } = await Swal.fire({
                    icon: "warning",
                    title: `¿Eliminar el gasto #${id}?`,
                    text: "Esta acción no se puede deshacer.",
                    showCancelButton: true,
                    confirmButtonText: "Sí, eliminar",
                    cancelButtonText: "Cancelar",
                    confirmButtonColor: "#ef4444",
                     customClass: {
                        popup: 'bg-white dark:bg-oxford-blue text-rich-black dark:text-platinum backdrop-blur-xl shadow-2xl rounded-xl',
                        title: 'text-rich-black dark:text-white',
                        htmlContainer: 'text-yinmn-blue dark:text-silver-lake-blue'
                    }
                });
                if (isConfirmed) {
                    try {
                        await deleteGasto(id);
                        showAlert({ icon: "success", title: "Eliminado", text: "El registro de gasto ha sido eliminado." });
                        load();
                    } catch (err) {
                        showAlert({ icon: "error", title: "Error", text: err.message || "No se pudo eliminar el registro." });
                    }
                }
            }
        });
    }

    // --- Funciones de Carga y Renderizado ---

    async function load() {
        try {
            const data = await getGastos(state);
            const items = data?.content ?? [];
            renderTable(items);
            renderInfo(data);
            renderPager(data);
        } catch (err) {
            tblBody.innerHTML = `<tr><td colspan="6" class="px-6 py-6 text-center text-red-500">Error al cargar datos: ${err.message}</td></tr>`;
            if (pageInfo) pageInfo.textContent = "—";
            if (pager) pager.innerHTML = "";
        }
    }

    async function loadTiposGasto(selectedTypeId = null) {
        try {
            const tipos = await getTiposGasto();
            selTipoGasto.innerHTML = '<option value="">Seleccione un tipo...</option>';
            tipos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.idTipoGasto;
                option.textContent = tipo.nombreTipo;
                if (selectedTypeId && tipo.idTipoGasto == selectedTypeId) {
                    option.selected = true;
                }
                selTipoGasto.appendChild(option);
            });
        } catch (error) {
            selTipoGasto.innerHTML = '<option value="">Error al cargar tipos</option>';
        }
    }

    function renderTable(items) {
        tblBody.innerHTML = "";
        if (!items || items.length === 0) {
            tblBody.innerHTML = `<tr><td colspan="6" class="px-6 py-6 text-center text-yinmn-blue dark:text-silver-lake-blue">No se encontraron gastos.</td></tr>`;
            return;
        }

        items.forEach(item => {
            const tr = document.createElement("tr");
            tr.className = "border-b dark:border-rich-black";
            // Guardar datos en el TR para fácil acceso
            tr.dataset.id = item.idGasto;
            tr.dataset.idtipogasto = item.idTipoGasto;
            tr.dataset.monto = item.monto;
            tr.dataset.descripcion = item.descripcion;

            tr.innerHTML = `
                <td class="px-6 py-4 font-semibold">${item.idGasto}</td>
                <td class="px-6 py-4">
                    <span class="bg-silver-lake-blue/20 dark:bg-silver-lake-blue/10 text-yinmn-blue dark:text-platinum px-2 py-1 rounded-full text-xs">${item.tipo_gasto || 'N/A'}</span>
                </td>
                <td class="px-6 py-4 text-yinmn-blue dark:text-silver-lake-blue">${item.descripcion || 'Sin descripción'}</td>
                <td class="px-6 py-4 font-medium text-rose-600 dark:text-rose-400">${fmtMoney(item.monto)}</td>
                <td class="px-6 py-4">${fmtDate(item.fecha)}</td>
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
            `;
            tblBody.appendChild(tr);
        });
        lucide.createIcons();
    }

    function renderInfo(data) {
        const total = data?.totalElements ?? 0;
        const page = data?.number ?? 0;
        const size = data?.size ?? state.size;
        if (!pageInfo) return;
        if (total === 0) {
            pageInfo.textContent = "Sin resultados";
            return;
        }
        const from = page * size + 1;
        const to = Math.min(total, (page + 1) * size);
        pageInfo.textContent = `Mostrando ${from}-${to} de ${total}`;
    }

    function renderPager(data) {
        if (!pager) return;
        pager.innerHTML = "";
        const totalPages = data?.totalPages ?? 1;
        const currentPage = data?.number ?? 0;
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

        pager.appendChild(createPageLink('«', currentPage - 1, currentPage === 0));
        for (let i = 0; i < totalPages; i++) {
            pager.appendChild(createPageLink(i + 1, i, false, i === currentPage));
        }
        pager.appendChild(createPageLink('»', currentPage + 1, currentPage >= totalPages - 1));
    }

    // --- Utilidades ---
    const fmtMoney = (v) => v === null || v === undefined ? "" : Number(v).toLocaleString("es-SV", { style: "currency", currency: "USD" });
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

    // --- Carga Inicial ---
    load();
});
