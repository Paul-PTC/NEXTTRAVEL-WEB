// === services/gastoService.js ===
// Base de API (ajusta el host/puerto si tu backend no corre en 8080)
const API_URL = "http://localhost:8080/api/gastos";

/**
 * Obtiene gastos desde la vista paginada (Page<VwGastoDTO>).
 * - Si q viene vacío → /gastos/listar
 * - Si q viene con texto:
 *    - mode === "tipo"        → /gastos/buscar/tipo/{q}
 *    - mode === "descripcion" → /gastos/buscar/descripcion/{q}
 *
 * @param {Object} opts
 * @param {number} [opts.page=0]   Página (0-based)
 * @param {number} [opts.size=10]  Tamaño por página
 * @param {string} [opts.sort="fecha,desc"] Orden, ej: "fecha,desc"
 * @param {string} [opts.q=""]     Texto de búsqueda
 * @param {("descripcion"|"tipo")} [opts.mode="descripcion"]
 * @returns {Promise<{content:any[], totalElements:number, totalPages:number, number:number, size:number}>}
 */
export async function getGastos({ page = 0, size = 10, sort = "fecha,desc", q = "", mode = "descripcion" } = {}) {
  let url;

  if (q) {
    // Buscar por tipo o por descripción, según "mode"
    url = new URL(
      mode === "tipo"
        ? `${API_URL}/gastos/buscar/tipo/${encodeURIComponent(q)}`
        : `${API_URL}/gastos/buscar/descripcion/${encodeURIComponent(q)}`
    );
  } else {
    // Listar sin filtro
    url = new URL(`${API_URL}/gastos/listar`);
  }

  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(size));
  url.searchParams.set("sort", sort);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`GET ${url} → ${res.status} ${txt}`);
  }
  return res.json();
}

export async function createGasto(dto) {
  const res = await fetch(`${API_URL}/gastosI`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    let payload = null;
    try { payload = await res.json(); } catch {}
    const msg =
      payload?.message ||
      payload?.mensaje ||
      `No se pudo crear el gasto (HTTP ${res.status})`;

    const err = new Error(msg);
    // Si el backend manda errores de validación
    if (payload?.errors) err.fields = payload.errors;
    err.detail = payload;
    throw err;
  }

  return res.json();
}

export async function getTiposGasto() {
  const res = await fetch(`${API_URL}/tipos`);
  if (!res.ok) throw new Error(`GET /tipos → ${res.status}`);
  return res.json(); // [{ idGasto, nombreTipo }]  // <-- tu DTO actual
}

/**
 * DELETE → Eliminar gasto por ID
 * Respuesta típica: { "mensaje": "Gasto eliminado correctamente" }
 */
export async function deleteGasto(id) {
  const res = await fetch(`${API_URL}/gastos/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    let payload = null;
    try { payload = await res.json(); } catch {}
    const msg =
      payload?.message ||
      payload?.mensaje ||
      `No se pudo eliminar (HTTP ${res.status})`;

    const err = new Error(msg);
    err.detail = payload;
    throw err;
  }

  // puede no traer body
  try { return await res.json(); }
  catch { return { mensaje: "Eliminado" }; }
}

/**
 * PUT → Actualizar gasto
 * @param {number|string} id
 * @param {{ idTipoGasto:number, monto:number, descripcion?:string, fecha?:string }} dto
 */
export async function updateGasto(id, dto) {
  // OJO: cambiamos la ruta → /gastosU/{id}
  const res = await fetch(`${API_URL}/gastosU/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    let payload = null;
    try {
      payload = await res.json();
    } catch (_) {}

    const msg =
      payload?.message ||
      payload?.mensaje ||
      `No se pudo actualizar (HTTP ${res.status})`;

    const err = new Error(msg);
    if (payload?.errors) err.fields = payload.errors;
    err.detail = payload;
    throw err;
  }

  return res.json(); // Devuelve { status: "success" }
}