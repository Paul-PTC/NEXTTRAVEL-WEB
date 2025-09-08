// JS/controllers/mantenimientoController.js
import { getMantenimientos,
    createMantenimiento, getMantenimientoById, getTiposMantenimientoMin,getVehiculosMin,
    deleteMantenimiento, updateMantenimiento 
 } from "../Services/mantenimientoService.js";

document.addEventListener("DOMContentLoaded", () => {
  // Ajusta estos IDs a los de tu HTML (te dejo los de tu página Tailwind)
  const tableBody  = document.querySelector("#tblBodyMant");    // <tbody>
  const pageInfo   = document.getElementById("pageInfoMant");    // texto "Mostrando X–Y de Z"
  const pager      = document.getElementById("pagerMant");       // <ul> de paginación

  // Controles de buscador/tamaño/refresh (si los tienes)
  const qInput     = document.getElementById("qMant");           // input de búsqueda
  const filterSel  = document.getElementById("filterField");     // select de campo
  const pageSizeEl = document.getElementById("pageSizeMant");    // select tamaño
  const refreshBtn = document.getElementById("btnRefreshMant");  // botón actualizar

  const state = {
    page: 0,
    size: parseInt(pageSizeEl?.value || "10", 10),
    sort: "fecha,desc",
    field: filterSel?.value || "placa",
    q: ""
  };

  init();

  function init() {
    bindUI();
    load();
  }

  function bindUI() {
    pageSizeEl?.addEventListener("change", () => {
      state.size = parseInt(pageSizeEl.value, 10);
      state.page = 0;
      load();
    });

    filterSel?.addEventListener("change", () => {
      state.field = filterSel.value;
      state.page = 0;
      load();
    });

    qInput?.addEventListener("input", debounce(() => {
      state.q = qInput.value.trim();
      state.page = 0;
      load();
    }, 350));

    refreshBtn?.addEventListener("click", () => {
      qInput && (qInput.value = "");
      state.q = "";
      state.page = 0;
      load();
    });
  }

  async function load() {
    try {
      const { items, total, totalPages, page, size } = await getMantenimientos(state);
      renderTable(items);
      renderInfo(total, page, size);
      renderPager(totalPages, page);
    } catch (err) {
      console.error("GET mantenimientos falló:", err);
      tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-6 text-center text-red-500">Error al cargar</td></tr>`;
      pageInfo.textContent = "—";
      pager.innerHTML = "";
    }
  }

  function renderTable(items) {
    if (!items?.length) {
      tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-6 text-center">Actualmente no hay registros</td></tr>`;
      return;
    }
    tableBody.innerHTML = items.map(it => `
      <tr class="border-b border-white/30 dark:border-gray-700/50">
        <td class="px-6 py-4">${it.idMantenimiento ?? ""}</td>
        <td class="px-6 py-4">${it.placa ?? ""}</td>
        <td class="px-6 py-4">${it.modelo ?? ""}</td>
        <td class="px-6 py-4">${it.tipoMantenimiento ?? ""}</td>
        <td class="px-6 py-4">${it.descripcion ?? ""}</td>
        <td class="px-6 py-4">${fmtDate(it.fecha)}</td>
        <td class="px-6 py-4 text-center">
          <button class="btn btn-sm btn-outline-secondary edit-btn"><i class="bi bi-pencil-square"></i></button>
          <button class="btn btn-sm btn-outline-danger delete-btn"><i class="bi bi-trash-fill"></i></button>
        </td>
      </tr>
    `).join("");
  }

  function renderInfo(total, page, size) {
    if (!total) { pageInfo.textContent = "Sin resultados"; return; }
    const from = page * size + 1;
    const to   = Math.min(total, (page + 1) * size);
    pageInfo.textContent = `Mostrando ${from}-${to} de ${total}`;
  }

  function renderPager(totalPages, currentPage) {
    pager.innerHTML = "";
    const mk = (label, target, { disabled=false, active=false } = {}) => {
      const a = document.createElement("a");
      a.href = "#";
      a.className =
        `inline-flex items-center px-3 py-2 rounded-lg
         ${active ? "border border-blue-500 bg-blue-600 text-white"
                  : "border border-white/40 dark:border-white/10 bg-white/40 dark:bg-gray-800/40 hover:bg-white/60 dark:hover:bg-gray-800/60"}
         ${disabled ? " pointer-events-none opacity-50" : ""}`;
      a.textContent = label;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        if (disabled || active) return;
        state.page = target;
        load();
      });
      const li = document.createElement("li"); li.appendChild(a); return li;
    };

    pager.appendChild(mk("«", Math.max(0, currentPage - 1), { disabled: currentPage === 0 }));
    const MAX = 7;
    let start = Math.max(0, currentPage - Math.floor(MAX / 2));
    let end   = Math.min(totalPages - 1, start + MAX - 1);
    start     = Math.max(0, end - MAX + 1);
    for (let p = start; p <= end; p++) pager.appendChild(mk(String(p + 1), p, { active: p === currentPage }));
    pager.appendChild(mk("»", Math.min(totalPages - 1, currentPage + 1), { disabled: currentPage >= totalPages - 1 }));
  }

  function debounce(fn, ms = 350) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d) ? String(iso) : d.toLocaleString("es-SV", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
    });
  }
});

















// JS/controllers/mantenimientoController.js
// Controla el modal + carga de combos + POST de Mantenimiento

document.addEventListener("DOMContentLoaded", () => {
  // ---- Refs del DOM (deben existir en tu HTML) ----
  const btnAdd       = document.getElementById("btnAddMant");
  const modalEl      = document.getElementById("mantModal");
  const modalContent = document.getElementById("mant-modal-content");
  const formEl       = document.getElementById("mantForm");
  const selVehiculo  = document.getElementById("idVehiculo");
  const selTipo      = document.getElementById("idTipoMantenimiento");
  const inpFecha     = document.getElementById("fechaMant");
  const btnClose     = document.getElementById("mant-close-btn");
  const btnCancel    = document.getElementById("mant-cancel-btn");

  const API_BASE = "http://localhost:8080/api/mantenimientos";

  // ---- Debug rápido de existencia ----
  console.log("[CHECK]", {
    btnAdd: !!btnAdd, modalEl: !!modalEl, modalContent: !!modalContent,
    formEl: !!formEl, selVehiculo: !!selVehiculo, selTipo: !!selTipo, inpFecha: !!inpFecha
  });

  // ---- Helpers modal ----
  function showModal() {
    if (!modalEl || !modalContent) return;
    modalEl.classList.remove("hidden");
    requestAnimationFrame(() => {
      modalEl.classList.remove("opacity-0");
      modalContent.classList.remove("opacity-0", "scale-95", "translate-y-4");
    });
  }
  function hideModal() {
    if (!modalEl || !modalContent) return;
    modalEl.classList.add("opacity-0");
    modalContent.classList.add("opacity-0", "scale-95", "translate-y-4");
    setTimeout(() => modalEl.classList.add("hidden"), 200);
  }

  // ---- Util ----
  async function fetchJson(url, init) {
    const res = await fetch(url, init);
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { throw new Error(`Respuesta no JSON (${res.status}): ${text}`); }
  }
  function setNow() {
    if (!inpFecha) return;
    const n = new Date(); n.setSeconds(0,0);
    const pad = (x) => String(x).padStart(2, "0");
    inpFecha.value =
      `${n.getFullYear()}-${pad(n.getMonth()+1)}-${pad(n.getDate())}T${pad(n.getHours())}:${pad(n.getMinutes())}`;
  }

  // ---- Cargar combos ----
  async function cargarVehiculos() {
    if (!selVehiculo) return;
    selVehiculo.innerHTML = `<option value="">Cargando…</option>`;
    try {
      const data = await fetchJson(`${API_BASE}/vehiculos`); // [{idVehiculo, placa}]
      selVehiculo.innerHTML = `<option value="">Seleccione…</option>`;
      for (const v of (data || [])) {
        const opt = document.createElement("option");
        opt.value = String(v.idVehiculo);
        opt.textContent = v.placa ?? "";
        selVehiculo.appendChild(opt);
      }
      if (!data || data.length === 0) {
        selVehiculo.innerHTML += `<option value="">(Sin vehículos)</option>`;
      }
    } catch (err) {
      console.error("Error cargando vehículos:", err);
      selVehiculo.innerHTML = `<option value="">(Error cargando)</option>`;
    }
  }

  async function cargarTipos() {
    if (!selTipo) return;
    selTipo.innerHTML = `<option value="">Cargando…</option>`;
    try {
      const data = await fetchJson(`${API_BASE}/tipos-mantenimiento`); // [{idTipoMantenimiento, nombreTipo}]
      selTipo.innerHTML = `<option value="">Seleccione…</option>`;
      for (const t of (data || [])) {
        const opt = document.createElement("option");
        opt.value = String(t.idTipoMantenimiento);
        opt.textContent = t.nombreTipo ?? "";
        selTipo.appendChild(opt);
      }
      if (!data || data.length === 0) {
        selTipo.innerHTML += `<option value="">(Sin tipos)</option>`;
      }
    } catch (err) {
      console.error("Error cargando tipos:", err);
      selTipo.innerHTML = `<option value="">(Error cargando)</option>`;
    }
  }

  // ---- Abrir modal ----
  btnAdd?.addEventListener("click", async () => {
    try {
      formEl?.reset();
      setNow();
      await Promise.all([cargarVehiculos(), cargarTipos()]);
      showModal();
    } catch (err) {
      console.error("Error al abrir modal:", err);
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  });

  // Cerrar modal
  btnClose?.addEventListener("click", hideModal);
  btnCancel?.addEventListener("click", hideModal);
  modalEl?.addEventListener("click", (e) => { if (e.target === modalEl) hideModal(); });

  // ---- POST (crear mantenimiento) ----
  formEl?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = formEl.querySelector('button[type="submit"]');
    submitBtn && (submitBtn.disabled = true);

    try {
      const idVehiculo = Number(selVehiculo?.value || 0);
      const idTipoMantenimiento = Number(selTipo?.value || 0);
      const descripcion = (formEl.descripcion?.value || "").trim();
      const fecha = inpFecha?.value || "";

      if (!idVehiculo) throw new Error("Debe seleccionar un vehículo.");
      if (!idTipoMantenimiento) throw new Error("Debe seleccionar un tipo de mantenimiento.");
      if (!fecha) throw new Error("Debe seleccionar una fecha.");

      const dto = { idVehiculo, idTipoMantenimiento, descripcion, fecha };

      const res = await fetch(`${API_BASE}/mantenimientos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });

      if (!res.ok) {
        let msg = `Error HTTP ${res.status}`;
        try {
          const p = await res.json();
          msg = p?.message || p?.mensaje ||
                (p?.errors ? Object.entries(p.errors).map(([k,v]) => `${k}: ${v}`).join("\n") : msg);
        } catch {}
        throw new Error(msg);
      }

      const payload = await res.json().catch(() => ({}));

      await Swal.fire({
        icon: "success",
        title: "¡Guardado!",
        text: payload?.idMantenimiento
          ? `Mantenimiento creado (ID ${payload.idMantenimiento})`
          : "Mantenimiento creado correctamente.",
        timer: 1600,
        showConfirmButton: false,
      });

      formEl.reset();
      hideModal();
      // Notificar para recargar la tabla (tu GET debe escuchar esto)
      document.dispatchEvent(new Event("mantenimientos:refresh"));
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "No se pudo crear el mantenimiento." });
    } finally {
      submitBtn && (submitBtn.disabled = false);
    }
  });
});



const tbody = document.getElementById("tblBodyMant");

tbody?.addEventListener("click", async (e) => {
  const btn = e.target.closest(".delete-btn"); // busca el botón con la clase delete-btn
  if (!btn) return;

  // Obtenemos el id desde la fila <tr>
  const row = btn.closest("tr");
  const id = row?.dataset.id || row?.querySelector("td")?.textContent?.trim();

  if (!id) {
    console.error("No se pudo obtener el ID del mantenimiento");
    return;
  }

  // Confirmación con SweetAlert
  const confirm = await Swal.fire({
    title: "¿Estás seguro?",
    text: "Esta acción eliminará el mantenimiento permanentemente",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });

  if (!confirm.isConfirmed) return;

  try {
    await deleteMantenimiento(id);

    // Eliminamos la fila directamente del DOM
    row.remove();

    Swal.fire({
      icon: "success",
      title: "Eliminado",
      text: "El mantenimiento fue eliminado correctamente",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (err) {
    console.error("Error al eliminar mantenimiento:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message || "No se pudo eliminar el mantenimiento",
    });
  }
});











document.addEventListener("DOMContentLoaded", () => {
  const tbody        = document.getElementById("tblBodyMant");
  const modalEl      = document.getElementById("mantModal");
  const modalContent = document.getElementById("mant-modal-content");
  const formEl       = document.getElementById("mantForm");
  const selVehiculo  = document.getElementById("idVehiculo");
  const selTipo      = document.getElementById("idTipoMantenimiento");
  const inpFecha     = document.getElementById("fechaMant");
  const btnClose     = document.getElementById("mant-close-btn");
  const btnCancel    = document.getElementById("mant-cancel-btn");
  const titleEl      = document.getElementById("mantModalLabel");

  if (!tbody || !formEl) return;

  let editingId = null;

  // ================= Helpers =================
  function showModal() {
    if (!modalEl || !modalContent) return;
    modalEl.classList.remove("hidden");
    requestAnimationFrame(() => {
      modalEl.classList.remove("opacity-0");
      modalContent.classList.remove("opacity-0", "scale-95", "translate-y-4");
    });
  }
  function hideModal() {
    if (!modalEl || !modalContent) return;
    modalEl.classList.add("opacity-0");
    modalContent.classList.add("opacity-0", "scale-95", "translate-y-4");
    setTimeout(() => modalEl.classList.add("hidden"), 200);
  }
  function setEditMode(id) {
    editingId = Number(id) || null;
    formEl && (formEl.dataset.mode = "edit"); // <- clave para evitar POST
    titleEl && (titleEl.textContent = `Editar mantenimiento #${editingId ?? ""}`);
    const submitBtn = formEl?.querySelector('button[type="submit"]');
    submitBtn && (submitBtn.textContent = "Actualizar");
  }
  function resetMode() {
    editingId = null;
    if (formEl) formEl.dataset.mode = "create";
    const submitBtn = formEl?.querySelector('button[type="submit"]');
    submitBtn && (submitBtn.textContent = "Guardar");
    titleEl && (titleEl.textContent = "Nuevo mantenimiento");
  }
  // "30/06/2025, 12:00 p. m." -> "2025-06-30T12:00"
  function toDatetimeLocalFromCell(cellText) {
    if (!cellText) return "";
    const t = cellText.replace(",", "").replace(/\s+(a\.?m\.?|p\.?m\.?)$/i, "").trim(); // tolera am/pm local
    // dd/mm/yyyy HH:MM
    const m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
    if (!m) return "";
    const [, dd, mm, yyyy, HH, MM] = m;
    return `${yyyy}-${mm}-${dd}T${HH}:${MM}`;
  }
  async function cargarVehiculosEnSelect(preferPlaca) {
    if (!selVehiculo) return;
    selVehiculo.innerHTML = `<option value="">Cargando…</option>`;
    const data = await getVehiculosMin(); // [{ idVehiculo, placa }]
    selVehiculo.innerHTML = `<option value="">Seleccione…</option>`;
    for (const v of (data || [])) {
      const opt = document.createElement("option");
      opt.value = String(v.idVehiculo);
      opt.textContent = v.placa ?? "";
      if (preferPlaca && (v.placa ?? "").trim() === preferPlaca.trim()) opt.selected = true;
      selVehiculo.appendChild(opt);
    }
  }
  async function cargarTiposEnSelect(preferNombre) {
    if (!selTipo) return;
    selTipo.innerHTML = `<option value="">Cargando…</option>`;
    const data = await getTiposMantenimientoMin(); // [{ idTipoMantenimiento, nombreTipo }]
    selTipo.innerHTML = `<option value="">Seleccione…</option>`;
    for (const t of (data || [])) {
      const opt = document.createElement("option");
      opt.value = String(t.idTipoMantenimiento);
      opt.textContent = t.nombreTipo ?? "";
      if (preferNombre && (t.nombreTipo ?? "").trim() === preferNombre.trim()) opt.selected = true;
      selTipo.appendChild(opt);
    }
  }

  // ================= Abrir modal en modo edición =================
  tbody.addEventListener("click", async (e) => {
    const editBtn = e.target.closest?.(".edit-btn");
    if (!editBtn) return;

    const row = editBtn.closest("tr");
    if (!row) return;

    // Según tu renderTable: [0]=id, [1]=placa, [2]=modelo, [3]=tipo, [4]=descripcion, [5]=fecha
    const cells = row.querySelectorAll("td");
    const id        = cells?.[0]?.textContent?.trim();
    const placaTxt  = cells?.[1]?.textContent?.trim() || "";
    const tipoTxt   = cells?.[3]?.textContent?.trim() || "";
    const descTxt   = cells?.[4]?.textContent?.trim() || "";
    const fechaCell = cells?.[5]?.textContent?.trim() || "";

    if (!id) {
      Swal?.fire?.({ icon: "error", title: "Error", text: "No se pudo obtener el ID del mantenimiento." });
      return;
    }

    try {
      formEl.reset();
      setEditMode(id);

      // Carga combos y preselecciona por texto
      await Promise.all([
        cargarVehiculosEnSelect(placaTxt),
        cargarTiposEnSelect(tipoTxt),
      ]);

      if (formEl?.descripcion) formEl.descripcion.value = descTxt;
      if (inpFecha) inpFecha.value = toDatetimeLocalFromCell(fechaCell);

      showModal();
    } catch (err) {
      console.error("Error preparando edición:", err);
      Swal?.fire?.({ icon: "error", title: "Error", text: err.message || "No se pudo abrir el editor." });
    }
  });

  // ================= Enviar PUT (intercepta y bloquea POST) =================
  formEl.addEventListener("submit", async (e) => {
    // Si NO estamos en edición, no hacemos nada: dejamos que el controller de CREATE procese el submit
    if ((formEl.dataset.mode || "create") !== "edit") return;

    // Clave para evitar que el otro listener (crear) también se ejecute
    e.preventDefault();
    e.stopImmediatePropagation();

    const submitBtn = formEl.querySelector('button[type="submit"]');
    submitBtn && (submitBtn.disabled = true);

    try {
      const idVehiculo          = Number(selVehiculo?.value || 0);
      const idTipoMantenimiento = Number(selTipo?.value || 0);
      const descripcion         = (formEl.descripcion?.value || "").trim();
      const fecha               = inpFecha?.value || "";

      if (!editingId)                 throw new Error("ID inválido.");
      if (!idVehiculo)                throw new Error("Debe seleccionar un vehículo.");
      if (!idTipoMantenimiento)       throw new Error("Debe seleccionar un tipo de mantenimiento.");
      if (!fecha)                     throw new Error("Debe seleccionar una fecha.");

      await updateMantenimiento(editingId, {
        idMantenimiento: editingId, // por si tu backend lo requiere
        idVehiculo,
        idTipoMantenimiento,
        descripcion,
        fecha,
      });

      await Swal?.fire?.({
        icon: "success",
        title: "¡Actualizado!",
        text: `Mantenimiento #${editingId} actualizado correctamente.`,
        timer: 1400,
        showConfirmButton: false,
      });

      formEl.reset();
      resetMode();
      hideModal();
      document.dispatchEvent(new Event("mantenimientos:refresh"));
    } catch (err) {
      console.error("PUT mantenimiento falló:", err);
      Swal?.fire?.({ icon: "error", title: "Error", text: err.message || "No se pudo actualizar el mantenimiento." });
    } finally {
      submitBtn && (submitBtn.disabled = false);
    }
  }, { capture: true }); // <- corre antes que el listener del CREATE

  // ================= Cerrar / Cancelar =================
  btnClose?.addEventListener("click", () => { resetMode(); hideModal(); });
  btnCancel?.addEventListener("click", () => { resetMode(); hideModal(); });
  modalEl?.addEventListener("click", (e) => { if (e.target === modalEl) { resetMode(); hideModal(); } });
});