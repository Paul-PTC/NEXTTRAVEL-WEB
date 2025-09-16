import { getGanancias, createGanancia, updateGanancia, deleteGanancia } from "../Services/gananciasService.js";

document.addEventListener("DOMContentLoaded", () => {
    // --- Referencias a los elementos del DOM ---
    const tblBody = document.getElementById("tblBody");
    const pageInfo = document.getElementById("pageInfo");
    const pager = document.getElementById("pager");
    const searchInput = document.getElementById("searchInput"); // ID actualizado

    // --- Referencias al Modal y Formulario ---
    const formEl = document.getElementById("gananciaForm");
    const lblModal = document.getElementById("gananciaModalLabel");
    const btnAdd = document.getElementById("btnAddGanancia");
    
    // Las funciones openModal y closeModal están en el HTML
    // y son accesibles globalmente.

    // --- Estado de la aplicación ---
    const state = {
        page: 0,
        size: 10, // Tamaño de página fijo por ahora
        sort: "fecha,desc",
        q: ""
    };

    // --- Vinculación de Eventos de UI ---

    // Búsqueda con debounce para no sobrecargar la API
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
    
    // Abrir modal para crear
    if (btnAdd) {
        btnAdd.addEventListener("click", () => {
            formEl.reset();
            formEl.dataset.mode = "create";
            formEl.idGanancia.value = ""; // Limpiar ID oculto
            lblModal.textContent = "Nueva Ganancia";
            openModal();
        });
    }

    // Gestionar envío del formulario (Crear y Editar)
    if (formEl) {
        formEl.addEventListener("submit", async (e) => {
            e.preventDefault();
            const mode = formEl.dataset.mode;
            const dto = {
                idReserva: Number(formEl.idReserva.value),
                montoBruto: Number(formEl.montoBruto.value),
                montoNeto: Number(formEl.montoNeto.value)
            };

            // Validación simple
            if (dto.montoNeto > dto.montoBruto) {
                showAlert({ icon: "error", title: "Error de validación", text: "El monto neto no puede ser mayor al bruto." });
                return;
            }

            try {
                if (mode === 'edit') {
                    const id = formEl.idGanancia.value;
                    await updateGanancia(id, dto);
                    showAlert({ icon: "success", title: "¡Actualizado!", text: "La ganancia se actualizó correctamente." });
                } else {
                    await createGanancia(dto);
                    showAlert({ icon: "success", title: "¡Creado!", text: "La ganancia se registró correctamente." });
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
                lblModal.textContent = "Editar Ganancia";
                formEl.dataset.mode = "edit";
                formEl.idGanancia.value = id;
                formEl.idReserva.value = row.dataset.idreserva;
                formEl.montoBruto.value = row.dataset.bruto;
                formEl.montoNeto.value = row.dataset.neto;
                openModal();
            } else if (btn.classList.contains("delete-btn")) {
                // Confirmar y eliminar
                const { isConfirmed } = await Swal.fire({
                    icon: "warning",
                    title: `¿Eliminar la ganancia #${id}?`,
                    text: "Esta acción no se puede deshacer.",
                    showCancelButton: true,
                    confirmButtonText: "Sí, eliminar",
                    cancelButtonText: "Cancelar",
                    confirmButtonColor: "#ef4444", // rojo
                     customClass: {
                        popup: 'bg-white dark:bg-oxford-blue text-rich-black dark:text-platinum backdrop-blur-xl shadow-2xl rounded-xl',
                        title: 'text-rich-black dark:text-white',
                        htmlContainer: 'text-yinmn-blue dark:text-silver-lake-blue'
                    }
                });
                if (isConfirmed) {
                    try {
                        await deleteGanancia(id);
                        showAlert({ icon: "success", title: "Eliminado", text: "El registro de ganancia ha sido eliminado." });
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
            const { items, total, totalPages, page, size } = await getGanancias(state);
            renderTable(items);
            renderInfo(total, page, size);
            renderPager(totalPages, page);
        } catch (err) {
            tblBody.innerHTML = `<tr><td colspan="7" class="px-6 py-6 text-center text-red-500">Error al cargar datos: ${err.message}</td></tr>`;
            pageInfo.textContent = "—";
            pager.innerHTML = "";
        }
    }

    function renderTable(items) {
        tblBody.innerHTML = "";
        if (!items || items.length === 0) {
            tblBody.innerHTML = `<tr><td colspan="7" class="px-6 py-6 text-center text-yinmn-blue dark:text-silver-lake-blue">No se encontraron registros.</td></tr>`;
            return;
        }

        for (const item of items) {
            const tr = document.createElement("tr");
            tr.className = "border-b dark:border-rich-black";
            // Guardamos los datos en el TR para fácil acceso al editar
            tr.dataset.id = item.idGanancia;
            tr.dataset.idreserva = item.idReserva;
            tr.dataset.bruto = item.monto_bruto ?? item.montoBruto;
            tr.dataset.neto = item.monto_neto ?? item.montoNeto;
            
            tr.innerHTML = `
                <td class="px-6 py-4 font-semibold">${item.idReserva}</td>
                <td class="px-6 py-4">${item.cliente || 'N/A'}</td>
                <td class="px-6 py-4">${item.lugar || 'N/A'}</td>
                <td class="px-6 py-4 text-amber-600 dark:text-amber-400">${fmtMoney(item.monto_bruto ?? item.montoBruto)}</td>
                <td class="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">${fmtMoney(item.monto_neto ?? item.montoNeto)}</td>
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
        }
        lucide.createIcons(); // Vuelve a renderizar los nuevos iconos
    }
    
    function renderInfo(total, page, size) {
        if (total === 0) {
            pageInfo.textContent = "Sin resultados";
            return;
        }
        const from = page * size + 1;
        const to = Math.min(total, (page + 1) * size);
        pageInfo.textContent = `Mostrando ${from}-${to} de ${total}`;
    }

    function renderPager(totalPages, currentPage) {
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

        pager.appendChild(createPageLink('«', currentPage - 1, currentPage === 0));
        for (let i = 0; i < totalPages; i++) {
            pager.appendChild(createPageLink(i + 1, i, false, i === currentPage));
        }
        pager.appendChild(createPageLink('»', currentPage + 1, currentPage >= totalPages - 1));
    }

    // --- Utilidades ---
    const fmtMoney = (v) => v === null || v === undefined ? "" : Number(v).toLocaleString("es-SV", { style: "currency", currency: "USD" });
    const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("es-SV") : "";

    // --- Carga Inicial ---
    load();
    
    // Alerta de bienvenida (ejemplo)
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
