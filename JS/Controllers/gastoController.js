// === controllers/gastoGetController.js ===
// Solo-GET: carga, búsqueda y paginación.
// Emite eventos para editar/eliminar (otro módulo puede manejar PUT/DELETE):
//  - "gasto:edit"   -> detail: { row }
//  - "gasto:delete" -> detail: { idGasto, row }

import { getGastos,
  createGasto,
  getTiposGasto,
  deleteGasto,
  updateGasto 
 } from "../Services/gastoService.js";

// Refs a tu HTML
const tbody      = document.getElementById("tblBodyGasto");
const pageInfo   = document.getElementById("pageInfoGasto");
const pager      = document.getElementById("pagerGasto");
const qInput     = document.getElementById("qGasto");
const pageSizeEl = document.getElementById("pageSizeGasto");
const btnRefresh = document.getElementById("btnRefreshGasto");

// Estado de vista
const state = {
  page: 0,
  size: parseInt(pageSizeEl?.value || "10", 10),
  sort: "fecha,desc",
  q: "",
  // Por defecto busca en descripción. Si querés que el input filtre por tipo, cambia a "tipo".
  searchMode: "descripcion",
};

document.addEventListener("DOMContentLoaded", async () => {
  bindUI();
  await load();
});

// =================== UI bindings ===================
function bindUI() {
  pageSizeEl?.addEventListener("change", () => {
    state.size = parseInt(pageSizeEl.value, 10);
    state.page = 0;
    load();
  });

  qInput?.addEventListener(
    "input",
    debounce(() => {
      state.q = qInput.value.trim();
      state.page = 0;
      load();
    }, 350)
  );

  btnRefresh?.addEventListener("click", () => {
    qInput.value = "";
    state.q = "";
    state.page = 0;
    load();
  });

  // Delegación para botones de acciones
  tbody?.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".edit-btn");
    const delBtn  = e.target.closest(".delete-btn");
    const row     = e.target.closest("tr");

    if (editBtn && row) {
      document.dispatchEvent(new CustomEvent("gasto:edit", { detail: { row } }));
    }
    if (delBtn && row) {
      const idGasto = row.dataset.idgasto || row.querySelector("td")?.textContent?.trim();
      document.dispatchEvent(new CustomEvent("gasto:delete", { detail: { idGasto, row } }));
    }
  });
}

// =================== Data load ===================
async function load() {
  try {
    const data = await getGastos({
      page: state.page,
      size: state.size,
      sort: state.sort,
      q: state.q,
      mode: state.searchMode, // "descripcion" o "tipo" (tu service ya lo soporta)
    });

    const items = data?.content ?? [];
    renderTable(items);
    renderInfo(data);
    renderPager(data);
  } catch (err) {
    console.error("Error al cargar gastos:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-6 text-center text-red-500">Error al cargar datos</td>
      </tr>`;
    if (pageInfo) pageInfo.textContent = "—";
    if (pager) pager.innerHTML = "";
  }
}

// =================== Render ===================
function renderTable(items) {
  tbody.innerHTML = "";

  if (!items || items.length === 0) {
    tbody.innerHTML = `
      <tr class="border-b border-white/30 dark:border-gray-700/50">
        <td colspan="6" class="px-6 py-6 text-center text-gray-500 dark:text-gray-400">
          Actualmente no hay registros
        </td>
      </tr>`;
    return;
  }

  for (const it of items) {
    const tr = document.createElement("tr");
    tr.className =
      "border-b border-white/30 hover:bg-white/10 dark:border-gray-700/50 dark:hover:bg-white/5 transition-colors";
    tr.dataset.idgasto = safe(it.idGasto);

    // 🔥 Tu DTO trae el nombre del tipo en "tipoGasto"
    const tipoTxt = it.tipoGasto ?? "";

    tr.innerHTML = `
      <td class="px-6 py-4">${safe(it.idGasto)}</td>
      <td class="px-6 py-4">${safe(tipoTxt)}</td>
      <td class="px-6 py-4 text-right tabular-nums">${fmtMoney(it.monto)}</td>
      <td class="px-6 py-4">${safe(it.descripcion)}</td>
      <td class="px-6 py-4">${fmtDate(it.fecha)}</td>
      <td class="px-6 py-4">
        <div class="flex gap-3">
          <button class="edit-btn" title="Editar" aria-label="Editar">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
                 viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round"
                 class="lucide lucide-square-pen hover:scale-110 transition-transform">
              <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>
            </svg>
          </button>

          <button class="delete-btn" title="Eliminar" aria-label="Eliminar">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
                 viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round"
                 class="lucide lucide-trash2-icon hover:scale-110 transition-transform">
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
              <path d="M3 6h18"/>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

function renderInfo(data) {
  const total  = data?.totalElements ?? 0;
  const number = data?.number ?? 0;
  const size   = data?.size ?? state.size;
  if (!pageInfo) return;

  if (!total) {
    pageInfo.textContent = "Sin resultados";
    return;
  }
  const from = number * size + 1;
  const to   = Math.min(total, (number + 1) * size);
  pageInfo.textContent = `Mostrando ${from}-${to} de ${total}`;
}

function renderPager(data) {
  if (!pager) return;
  pager.innerHTML = "";

  const totalPages = data?.totalPages ?? 1;
  const current    = data?.number ?? 0;

  const mkBtn = (label, target, { disabled = false, active = false } = {}) => {
    const a = document.createElement("a");
    a.href = "#";
    a.className =
      `inline-flex items-center px-3 py-2 rounded-lg
       ${active
         ? "border border-blue-500 bg-blue-600 text-white"
         : "border border-white/20 dark:border-white/10 bg-white/10 text-gray-200 hover:bg-white/20"}
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

  pager.appendChild(mkBtn("«", Math.max(0, current - 1), { disabled: current === 0 }));
  for (let p = 0; p < totalPages; p++) {
    pager.appendChild(mkBtn(String(p + 1), p, { active: p === current }));
  }
  pager.appendChild(
    mkBtn("»", Math.min(totalPages - 1, current + 1), { disabled: current >= totalPages - 1 })
  );
}

// =================== Helpers ===================
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
        minute: "2-digit",
      });
}
function debounce(fn, ms = 350) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// === Mostrar / ocultar modal ===
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












document.addEventListener("DOMContentLoaded", () => {
  // Referencias al DOM
  const modalEl      = document.getElementById("gastoModal");
  const modalContent = document.getElementById("gasto-modal-content");
  const formEl       = document.getElementById("gastoForm");
  const lblModal     = document.getElementById("gastoModalLabel");
  const btnAdd       = document.getElementById("btnAddGasto");
  const btnCancel    = document.getElementById("gasto-cancel-btn");
  const btnClose     = document.getElementById("gasto-close-btn");
  const selTipo      = document.getElementById("idTipoGasto");

  // === Helpers para abrir/cerrar modal ===
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

  // === Cargar opciones de tipo de gasto ===
  async function loadTiposGasto() {
    try {
      const tipos = await getTiposGasto(); // [{ idGasto, nombreTipo }]
      selTipo.innerHTML = `<option value="">Seleccione…</option>`;
      for (const tipo of tipos) {
        const opt = document.createElement("option");
        // Aunque el DTO devuelva idGasto, lo usamos como idTipoGasto
        opt.value = tipo.idGasto;
        opt.textContent = tipo.nombreTipo ?? "";
        selTipo.appendChild(opt);
      }
    } catch (err) {
      console.error("Error cargando tipos de gasto:", err);
      selTipo.innerHTML = `<option value="">(Error cargando tipos)</option>`;
    }
  }

  // === Abrir modal para agregar gasto ===
  btnAdd?.addEventListener("click", async () => {
    formEl.reset();
    formEl.dataset.mode = "create";
    lblModal.textContent = "Nuevo Gasto";

    // Establecer fecha actual por defecto
    const now = new Date();
    now.setSeconds(0, 0);
    const pad = (n) => String(n).padStart(2, "0");
    const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    document.getElementById("fechaGasto").value = local;

    // Cargar tipos de gasto
    await loadTiposGasto();

    showModal();
  });

  // === Cerrar modal ===
  btnCancel?.addEventListener("click", hideModal);
  btnClose?.addEventListener("click", hideModal);

  // === Validación ===
  function validateForm({ idTipoGasto, monto }) {
    if (!idTipoGasto || Number(idTipoGasto) <= 0)
      return "Debe seleccionar un tipo de gasto.";
    if (monto == null || isNaN(monto) || Number(monto) <= 0)
      return "El monto debe ser mayor que 0.";
    return null;
  }

  // === Enviar formulario (POST) ===
  formEl?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dto = {
      // Aquí enviamos el ID que corresponde a tipoGasto
      idTipoGasto: Number(formEl.idTipoGasto.value),
      monto: Number(formEl.monto.value),
      descripcion: formEl.descripcion.value.trim(),
      fecha: formEl.fechaGasto.value, // input datetime-local
    };

    const validationMsg = validateForm(dto);
    if (validationMsg) {
      Swal.fire({ icon: "error", title: "Validación", text: validationMsg });
      return;
    }

    try {
      const resp = await createGasto(dto);

      Swal.fire({
        icon: "success",
        title: "¡Agregado!",
        text: `El gasto se registró correctamente`,
        timer: 1800,
        showConfirmButton: false,
      });

      hideModal();
      formEl.reset();

      // Recargar automáticamente la tabla
      document.dispatchEvent(new Event("gastos:refresh"));
    } catch (err) {
      if (err.fields && typeof err.fields === "object") {
        const details = Object.entries(err.fields)
          .map(([k, v]) => `• ${k}: ${v}`)
          .join("\n");
        Swal.fire({
          icon: "error",
          title: "Datos inválidos",
          text: details || err.message,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message || "No se pudo crear el gasto.",
        });
      }
    }
  });
});



document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("tblBodyGasto");

  // 1) Soporte por evento desde el controller de GET
  document.addEventListener("gasto:delete", async (e) => {
    const { idGasto, row } = e.detail || {};
    if (!idGasto) return;
    await handleDelete(idGasto, row);
  });

  // 2) Fallback por delegación (por si no emites el evento)
  tbody?.addEventListener("click", async (ev) => {
    const btn = ev.target.closest(".delete-btn");
    if (!btn) return;
    const row = btn.closest("tr");
    const idGasto =
      row?.dataset.idgasto ||
      row?.querySelector("td")?.textContent?.trim();

    if (!idGasto) {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo determinar el ID del gasto." });
      return;
    }
    await handleDelete(idGasto, row);
  });

  async function handleDelete(id, rowEl) {
    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: `¿Eliminar el gasto #${id}?`,
      text: "Esta acción no se puede deshacer.",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#ef4444",
    });
    if (!isConfirmed) return;

    try {
      const resp = await deleteGasto(id);

      // feedback
      Swal.fire({
        icon: "success",
        title: "Eliminado",
        text: resp?.mensaje || "Gasto eliminado correctamente.",
        timer: 1400,
        showConfirmButton: false,
      });

      // opcional: quitar la fila al instante
      if (rowEl) rowEl.remove();

      // refrescar la tabla (tu controller de GET debería escuchar este evento)
      document.dispatchEvent(new Event("gastos:refresh"));
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: err.message || "Ocurrió un error eliminando el gasto.",
      });
    }
  }
});







document.addEventListener("DOMContentLoaded", () => {
  const tbody        = document.getElementById("tblBodyGasto");

  // Modal / Form
  const modalEl      = document.getElementById("gastoModal");
  const modalContent = document.getElementById("gasto-modal-content");
  const formEl       = document.getElementById("gastoForm");
  const lblModal     = document.getElementById("gastoModalLabel");
  const btnCancel    = document.getElementById("gasto-cancel-btn");
  const btnClose     = document.getElementById("gasto-close-btn");
  const selTipo      = document.getElementById("idTipoGasto");
  const inpId        = document.getElementById("idGasto");
  const inpMonto     = document.getElementById("monto");
  const inpDesc      = document.getElementById("descripcion");
  const inpFecha     = document.getElementById("fechaGasto");

  // Helpers modal
  function showModal() {
    modalEl.classList.remove("hidden");
    requestAnimationFrame(() => {
      modalEl.classList.remove("opacity-0");
      modalContent.classList.remove("scale-95");
    });
  }
  function hideModal() {
    modalEl.classList.add("opacity-0");
    modalContent.classList.add("scale-95");
    setTimeout(() => modalEl.classList.add("hidden"), 300);
  }

  // Poblar combo tipos y seleccionar actual
  async function loadTiposYSeleccionar(nombreTipoActual = "") {
    const tipos = await getTiposGasto();
    selTipo.innerHTML = `<option value="">Seleccione…</option>`;
    for (const t of tipos) {
      const opt = document.createElement("option");
      opt.value = String(t.idGasto);
      opt.textContent = t.nombreTipo ?? "";
      if (t.nombreTipo?.toLowerCase() === (nombreTipoActual || "").toLowerCase()) {
        opt.selected = true;
      }
      selTipo.appendChild(opt);
    }
  }

  // Abrir modal en modo EDITAR
  tbody?.addEventListener("click", async (e) => {
    const btn = e.target.closest(".edit-btn");
    if (!btn) return;

    const row = btn.closest("tr");
    if (!row) return;

    // Extraer datos de la fila
    const idGasto     = row.dataset.idgasto || row.querySelector("td:nth-child(1)")?.textContent?.trim();
    const nombreTipo  = row.querySelector("td:nth-child(2)")?.textContent?.trim() || "";
    const montoTxt    = row.querySelector("td:nth-child(3)")?.textContent?.trim() || "";
    const descripcion = row.querySelector("td:nth-child(4)")?.textContent?.trim() || "";
    const fechaIso    = row.querySelector("td:nth-child(5)")?.dataset?.fecha || "";

    // Setear datos en formulario
    formEl.dataset.mode = "edit";
    lblModal.textContent = "Editar Gasto";
    inpId.value    = idGasto ?? "";
    inpMonto.value = cleanMoney(montoTxt);
    inpDesc.value  = descripcion ?? "";
    inpFecha.value = toDatetimeLocal(fechaIso);

    try {
      await loadTiposYSeleccionar(nombreTipo);
    } catch (err) {
      console.error("Error cargando tipos:", err);
      selTipo.innerHTML = `<option value="">(Error cargando tipos)</option>`;
    }

    showModal();
  });

  // Cerrar modal
  btnCancel?.addEventListener("click", hideModal);
  btnClose?.addEventListener("click", hideModal);

  // Validación
  function validate({ idTipoGasto, monto }) {
    if (!idTipoGasto || Number(idTipoGasto) <= 0)
      return "Seleccione un tipo de gasto válido.";
    if (monto == null || isNaN(monto) || Number(monto) <= 0)
      return "El monto debe ser mayor que 0.";
    return null;
  }

  // Submit → PUT
  formEl?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (formEl.dataset.mode !== "edit") return;

    const id = inpId.value?.trim();
    const dto = {
      idTipoGasto: Number(selTipo.value),
      monto: Number(inpMonto.value),
      descripcion: inpDesc.value.trim() || null,
      fecha: inpFecha.value,
    };

    const msg = validate(dto);
    if (msg) {
      Swal.fire({ icon: "error", title: "Validación", text: msg });
      return;
    }

    try {
      await updateGasto(id, dto);

      hideModal();
      formEl.reset();

      Swal.fire({
        icon: "success",
        title: "¡Actualizado!",
        text: "El gasto fue actualizado correctamente.",
        timer: 1600,
        showConfirmButton: false,
      });

      document.dispatchEvent(new Event("gastos:refresh"));
    } catch (err) {
      if (err?.fields && typeof err.fields === "object") {
        const details = Object.entries(err.fields)
          .map(([k, v]) => `• ${k}: ${v}`)
          .join("\n");
        Swal.fire({ icon: "error", title: "Datos inválidos", text: details || err.message });
      } else {
        Swal.fire({ icon: "error", title: "Error", text: err.message || "No se pudo actualizar el gasto." });
      }
    }
  });

  // Helpers
  function cleanMoney(txt) {
    if (!txt) return "";
    return String(txt).replace(/[^0-9.,-]/g, "").replace(/\./g, "").replace(",", ".");
  }
  function toDatetimeLocal(value) {
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value;
    let d = new Date(value);
    if (isNaN(d.getTime())) {
      const v = String(value).split(".")[0] + "Z";
      d = new Date(v);
      if (isNaN(d.getTime())) return "";
    }
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
});