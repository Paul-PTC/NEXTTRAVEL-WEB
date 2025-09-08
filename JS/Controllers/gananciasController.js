import {
    getGanancias,
    createGanancia,
    updateGanancia,
    deleteGanancia,
} from "../Services/gananciasService.js";  

document.addEventListener("DOMContentLoaded", () => {
  const tbody      = document.getElementById("tblBody");
  const pageInfo   = document.getElementById("pageInfo");
  const pager      = document.getElementById("pager");
  const qInput     = document.getElementById("q");
  const pageSizeEl = document.getElementById("pageSize");
  const refreshBtn = document.getElementById("btnRefresh");

  // Estado
  const state = {
    page: 0,
    size: parseInt(pageSizeEl?.value || "5", 10),
    sort: "fecha,desc",
    q: ""
  };

  bindUI();
  load();

  // Eventos de UI
  function bindUI() {
    // Cambiar tamaño de página
    if (pageSizeEl) {
      pageSizeEl.addEventListener("change", () => {
        state.size = parseInt(pageSizeEl.value, 10);
        state.page = 0;
        load();
      });
    }

    // Búsqueda
    if (qInput) {
      qInput.addEventListener("input", debounce(() => {
        state.q = qInput.value.trim();
        state.page = 0;
        load();
      }, 350));
    }

    // Refrescar tabla
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        qInput.value = "";
        state.q = "";
        state.page = 0;
        load();
      });
    }
  }

  // Cargar datos desde la API
  async function load() {
    try {
      const { items, total, totalPages, page, size } = await getGanancias(state);
      renderTable(items);
      renderInfo(total, page, size);
      renderPager(totalPages, page);
    } catch (err) {
      console.error("Error al cargar ganancias:", err);
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="px-6 py-6 text-center text-red-500">Error al cargar datos</td>
        </tr>`;
      pageInfo.textContent = "—";
      pager.innerHTML = "";
    }
  }

  // Renderizar filas de la tabla
  function renderTable(items) {
    tbody.innerHTML = "";

    if (!items || items.length === 0) {
      tbody.innerHTML = `
        <tr class="border-b border-white/30 dark:border-gray-700/50">
          <td colspan="8" class="px-6 py-6 text-center text-gray-500 dark:text-gray-400">
            Actualmente no hay registros
          </td>
        </tr>`;
      return;
    }

    for (const it of items) {
      const tr = document.createElement("tr");
      tr.className = "border-b border-white/30 hover:bg-white/20 dark:border-gray-700/50 dark:hover:bg-white/10 transition-colors duration-300";

      tr.innerHTML = `
        <td class="px-6 py-4">${safe(it.idGanancia)}</td>
        <td class="px-6 py-4">${safe(it.idReserva)}</td>
        <td class="px-6 py-4">${safe(it.cliente)}</td>
        <td class="px-6 py-4">${safe(it.lugar)}</td>
        <td class="px-6 py-4">${fmtMoney(it.monto_bruto ?? it.montoBruto)}</td>
        <td class="px-6 py-4">${fmtMoney(it.monto_neto ?? it.montoNeto)}</td>
        <td class="px-6 py-4">${fmtDate(it.fecha)}</td>
        <td class="px-6 py-4 text-center">
          <button class="text-blue-500 hover:text-blue-700 mx-1 edit-btn" title="Editar">
            <i class="bi bi-pencil-square text-lg"></i>
          </button>
          <button class="text-red-500 hover:text-red-700 mx-1 delete-btn" title="Eliminar">
            <i class="bi bi-trash-fill text-lg"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    }
  }

  // Mostrar info de registros
  function renderInfo(total, page, size) {
    if (total === 0) {
      pageInfo.textContent = "Sin resultados";
      return;
    }
    const from = page * size + 1;
    const to = Math.min(total, (page + 1) * size);
    pageInfo.textContent = `Mostrando ${from}-${to} de ${total}`;
  }

  // Renderizar paginación
  function renderPager(totalPages, currentPage) {
    pager.innerHTML = "";

    const mkBtn = (label, target, { disabled=false, active=false } = {}) => {
      const a = document.createElement("a");
      a.href = "#";
      a.className =
        `inline-flex items-center px-3 py-2 rounded-lg backdrop-blur-xl
         ${active
            ? "border border-blue-500 bg-blue-600 text-white"
            : "border border-white/40 dark:border-white/10 bg-white/40 dark:bg-gray-800/40 text-gray-700 dark:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-800/60"}
         ${disabled ? " pointer-events-none opacity-50" : ""}`;
      a.textContent = label;

      a.addEventListener("click", (e) => {
        e.preventDefault();
        if (disabled || active) return;
        state.page = target;
        load();
      });

      const li = document.createElement("li");
      li.appendChild(a);
      return li;
    };

    // Botón anterior
    pager.appendChild(
      mkBtn("«", Math.max(0, currentPage - 1), { disabled: currentPage === 0 })
    );

    // Números de página
    for (let p = 0; p < totalPages; p++) {
      pager.appendChild(mkBtn(String(p + 1), p, { active: p === currentPage }));
    }

    // Botón siguiente
    pager.appendChild(
      mkBtn("»", Math.min(totalPages - 1, currentPage + 1), {
        disabled: currentPage >= totalPages - 1,
      })
    );
  }

  // Utilidades
  function debounce(fn, ms = 400) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }
  const safe = (v) => (v ?? "") === null ? "" : String(v ?? "");
  function fmtMoney(v) {
    if (v === null || v === undefined || v === "") return "";
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    return n.toLocaleString("es-SV", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
  }
  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d)
      ? String(iso)
      : d.toLocaleString("es-SV", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        });
  }
});

// Reload universal (no falla si no hay load en este scope)
async function safeReload() {
  if (typeof window.reloadGanancias === "function") {
    return await window.reloadGanancias();
  }
  if (typeof window.loadGanancias === "function") {
    return await window.loadGanancias();
  }
  // Opción por evento (tu GET puede escuchar esto y recargar)
  document.dispatchEvent(new CustomEvent("ganancias:refresh"));
}

document.addEventListener("DOMContentLoaded", () => {
  // Elementos del modal y formulario
  const modalEl      = document.getElementById("gananciaModal");
  const modalContent = document.getElementById("modal-content");
  const formEl       = document.getElementById("gananciaForm");
  const lblModal     = document.getElementById("gananciaModalLabel");
  const btnAdd       = document.getElementById("btnAddGanancia");
  const btnCancel    = document.getElementById("cancel-btn");
  const btnClose     = document.getElementById("close-modal-btn");

  // Funciones para mostrar/ocultar modal (Tailwind)
  function showModal() {
    if (!modalEl || !modalContent) return;
    modalEl.classList.remove("hidden");
    requestAnimationFrame(() => {
      modalEl.classList.remove("opacity-0");
      modalContent.classList.remove("scale-95");
    });
  }

  function hideModal() {
    if (!modalEl || !modalContent) return;
    modalEl.classList.add("opacity-0");
    modalContent.classList.add("scale-95");
    setTimeout(() => modalEl.classList.add("hidden"), 300);
  }

  // Abrir modal al hacer clic en "Agregar"
  btnAdd?.addEventListener("click", () => {
    formEl.reset();
    formEl.dataset.mode = "create";
    lblModal.textContent = "Nueva Ganancia";

    // Poner fecha por defecto
    const now = new Date();
    now.setSeconds(0, 0);
    const pad = (n) => String(n).padStart(2, "0");
    const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const fechaInput = document.getElementById("fecha");
    if (fechaInput) fechaInput.value = local;

    showModal();
  });

  // Cerrar modal
  btnCancel?.addEventListener("click", hideModal);
  btnClose?.addEventListener("click", hideModal);

  // Validar datos del formulario
  function validateFormValues({ idReserva, montoBruto, montoNeto }) {
    if (!idReserva || Number(idReserva) <= 0) return "El ID de reserva es obligatorio y debe ser mayor que 0.";
    if (montoBruto == null || isNaN(montoBruto) || Number(montoBruto) < 0)
      return "El monto bruto es obligatorio y no puede ser negativo.";
    if (montoNeto == null || isNaN(montoNeto) || Number(montoNeto) < 0)
      return "El monto neto es obligatorio y no puede ser negativo.";
    if (Number(montoNeto) > Number(montoBruto))
      return "El monto neto no puede ser mayor que el monto bruto.";
    return null;
  }

  // Enviar datos al backend (POST)
  formEl?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const idReserva  = formEl.idReserva.value.trim();
    const montoBruto = formEl.montoBruto.value.trim();
    const montoNeto  = formEl.montoNeto.value.trim();
    const fechaLocal = formEl.fecha.value.trim(); // yyyy-MM-ddTHH:mm

    // Validación front-end
    const validationMsg = validateFormValues({ idReserva, montoBruto, montoNeto });
    if (validationMsg) {
      Swal.fire({ icon: "error", title: "Validación", text: validationMsg });
      return;
    }

    // OJO: si tu backend espera snake_case, cambia a monto_bruto/monto_neto
    const dto = {
      idReserva: Number(idReserva),
      montoBruto: Number(montoBruto),
      montoNeto: Number(montoNeto),
      fecha: fechaLocal, // si backend la setea solo, puedes omitirla
    };

    try {
      const resp = await createGanancia(dto);

      // Recargar tabla sin romper si load() no está en este scope
      await load();

      hideModal();
      formEl.reset();

      Swal.fire({
        icon: "success",
        title: "¡Agregado!",
        text: `La ganancia se registró correctamente${resp?.idGanancia ? " (ID " + resp.idGanancia + ")" : ""}.`,
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      if (err.fields && typeof err.fields === "object") {
        const details = Object.entries(err.fields)
          .map(([k, v]) => `• ${k}: ${v}`)
          .join("\n");
        Swal.fire({ icon: "error", title: "Datos inválidos", text: details || err.message });
      } else {
        Swal.fire({ icon: "error", title: "Error", text: err.message || "No se pudo crear la ganancia." });
      }
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("tblBody");

  // Delegación de eventos: escucha clicks en los botones de eliminar dentro del tbody
  tbody?.addEventListener("click", async (e) => {
    const btn = e.target.closest(".delete-btn");
    if (!btn) return;

    // Obtener el ID de la fila:
    // 1) si tu renderTable pone el id en la primera celda:
    const row = btn.closest("tr");
    let id = row?.querySelector("td")?.textContent?.trim();

    // 2) o si prefieres, puedes poner data-id en la fila y usar esto:
    // let id = row?.dataset?.id;

    if (!id) {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo determinar el ID a eliminar." });
      return;
    }

    // Confirmación
    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: `¿Eliminar la ganancia #${id}?`,
      text: "Esta acción no se puede deshacer.",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#ef4444", // rojo
    });
    if (!isConfirmed) return;

    try {
      const resp = await deleteGanancia(id);

      await safeReload(); // refresca la tabla

      Swal.fire({
        icon: "success",
        title: "Eliminado",
        text: resp?.mensaje || "La ganancia se eliminó correctamente.",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: err.message || "Ocurrió un error eliminando la ganancia.",
      });
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const tbody        = document.getElementById("tblBody");

  // Modal / Form
  const modalEl      = document.getElementById("gananciaModal");
  const modalContent = document.getElementById("modal-content");
  const formEl       = document.getElementById("gananciaForm");
  const lblModal     = document.getElementById("gananciaModalLabel");

  // Helpers modal (Tailwind)
  function showModal() {
    if (!modalEl || !modalContent) return;
    modalEl.classList.remove("hidden");
    requestAnimationFrame(() => {
      modalEl.classList.remove("opacity-0");
      modalContent.classList.remove("scale-95");
    });
  }
  function hideModal() {
    if (!modalEl || !modalContent) return;
    modalEl.classList.add("opacity-0");
    modalContent.classList.add("scale-95");
    setTimeout(() => modalEl.classList.add("hidden"), 300);
  }

  // Cerrar modal
  document.getElementById("cancel-btn")?.addEventListener("click", hideModal);
  document.getElementById("close-modal-btn")?.addEventListener("click", hideModal);

  // =========== Abrir modal en modo EDITAR ===========
  tbody?.addEventListener("click", (e) => {
    const btn = e.target.closest(".edit-btn");
    if (!btn) return;

    // 1) Primero, toma crudos desde data-* del botón
    let id        = btn.dataset.id;
    let idReserva = btn.dataset.idreserva;
    let bruto     = btn.dataset.bruto;
    let neto      = btn.dataset.neto;
    let fechaIso  = btn.dataset.fecha;

    // 2) Fallbacks desde la fila (por si faltan data-*)
    const row = btn.closest("tr");
    if (!id)        id        = row?.querySelector("td:nth-child(1)")?.textContent?.trim() || "";
    if (!idReserva) idReserva = row?.querySelector("td:nth-child(2)")?.textContent?.trim() || "";
    if (!bruto)     bruto     = cleanMoney(row?.querySelector("td:nth-child(5)")?.textContent);
    if (!neto)      neto      = cleanMoney(row?.querySelector("td:nth-child(6)")?.textContent);
    if (!fechaIso)  fechaIso  = row?.querySelector("td[data-fecha]")?.dataset?.fecha || "";

    if (!id) {
      Swal.fire({ icon: "error", title: "Error", text: "No se encontró el ID de la ganancia." });
      return;
    }

    // Rellenar el formulario
    formEl.dataset.mode  = "edit";
    lblModal.textContent = "Editar Ganancia";

    // Requiere un input hidden: <input type="hidden" id="idGanancia" name="idGanancia" />
    formEl.idGanancia.value = id;
    formEl.idReserva.value  = idReserva ?? "";
    formEl.montoBruto.value = bruto ?? "";
    formEl.montoNeto.value  = neto ?? "";
    formEl.fecha.value      = toDatetimeLocal(fechaIso);

    showModal();
  });

  // =========== Submit → PUT ===========
  formEl?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (formEl.dataset.mode !== "edit") return; // solo maneja actualizar aquí

    const idGanancia = formEl.idGanancia.value.trim();
    const idReserva  = formEl.idReserva.value.trim();
    const montoBruto = formEl.montoBruto.value.trim();
    const montoNeto  = formEl.montoNeto.value.trim();
    const fecha      = formEl.fecha.value.trim();

    const validationMsg = validateFormValues({ idReserva, montoBruto, montoNeto });
    if (validationMsg) {
      Swal.fire({ icon: "error", title: "Validación", text: validationMsg });
      return;
    }

    // Ajusta los nombres si tu backend usa snake_case (monto_bruto/monto_neto)
    const dto = {
      idReserva: Number(idReserva),
      montoBruto: Number(montoBruto),
      montoNeto: Number(montoNeto),
      fecha
    };

    try {
      await updateGanancia(idGanancia, dto);
      hideModal();
      formEl.reset();

      await safeReload();

      Swal.fire({
        icon: "success",
        title: "¡Actualizado!",
        text: "La ganancia fue actualizada correctamente.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      if (err?.fields && typeof err.fields === "object") {
        const details = Object.entries(err.fields).map(([k, v]) => `• ${k}: ${v}`).join("\n");
        Swal.fire({ icon: "error", title: "Datos inválidos", text: details || err.message });
      } else {
        Swal.fire({ icon: "error", title: "Error", text: err.message || "No se pudo actualizar la ganancia." });
      }
    }
  });

  // -------- Helpers --------
  function validateFormValues({ idReserva, montoBruto, montoNeto }) {
    if (!idReserva || Number(idReserva) <= 0) return "El ID de reserva es obligatorio y debe ser mayor que 0.";
    if (montoBruto == null || isNaN(montoBruto) || Number(montoBruto) < 0) return "El monto bruto es obligatorio y no puede ser negativo.";
    if (montoNeto == null || isNaN(montoNeto) || Number(montoNeto) < 0) return "El monto neto es obligatorio y no puede ser negativo.";
    if (Number(montoNeto) > Number(montoBruto)) return "El monto neto no puede ser mayor que el monto bruto.";
    return null;
  }

  // "$1,234.50" → "1234.50"
  function cleanMoney(txt) {
    if (!txt) return "";
    return String(txt).replace(/[^0-9.,-]/g, "").replace(/\./g, "").replace(",", ".");
  }

  // ISO → 'YYYY-MM-DDTHH:mm' (para <input type="datetime-local">)
  function toDatetimeLocal(value) {
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value; // ya listo

    let d = new Date(value);
    if (isNaN(d.getTime())) {
      const v = String(value).split(".")[0] + "Z"; // quita ms y fuerza Z
      d = new Date(v);
      if (isNaN(d.getTime())) return "";
    }
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
});