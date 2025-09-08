// === JS/services/mantenimientosService.js ===
const API_URL = "http://localhost:8080/api/mantenimientos";

/**
 * 🟢 GET → Listar mantenimientos (paginado)
 * @param {Object} params
 * @param {number} params.page - Número de página
 * @param {number} params.size - Tamaño de página
 * @param {string} params.sort - Orden (ej. "fecha,desc")
 * @param {string} [params.field] - Campo para búsqueda (placa|modelo|tipo|descripcion)
 * @param {string} [params.q] - Texto a buscar
 */
export async function getMantenimientos({ 
  page = 0, 
  size = 10, 
  sort = "fecha,desc", 
  field = "placa", 
  q = "" 
} = {}) {
  const safeField = ["placa", "modelo", "tipo", "descripcion"].includes(field)
    ? field
    : "placa";

  const endpoint = q?.trim()
    ? `${API_URL}/mantenimientos/buscar/${encodeURIComponent(safeField)}/${encodeURIComponent(q.trim())}`
    : `${API_URL}/mantenimientos/listar`;

  const url = new URL(endpoint);
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(size));
  url.searchParams.set("sort", sort);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${url.pathname}${url.search} → ${res.status} ${text}`);
  }

  const data = await res.json();
  return {
    items: data.content ?? [],
    total: data.totalElements ?? 0,
    totalPages: data.totalPages ?? 1,
    page: data.number ?? 0,
    size: data.size ?? size,
  };
}

export async function createMantenimiento(data) {
  const res = await fetch(`${API_URL}/nuevo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Error al crear mantenimiento");
  }
}

export async function getVehiculosMin() {
  const res = await fetch(`${API_URL}/vehiculos`);
  if (!res.ok) throw new Error(`GET /vehiculos -> ${res.status}`);
  return res.json(); // [{ idVehiculo, placa }]
}

export async function getTiposMantenimientoMin() {
  const res = await fetch(`${API_URL}/tipos-mantenimiento`);
  if (!res.ok) throw new Error(`GET /tipos-mantenimiento -> ${res.status}`);
  return res.json(); // [{ idTipoMantenimiento, nombreTipo }]
}

export async function deleteMantenimiento(id) {
  const res = await fetch(`${API_URL}/mantenimientos/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "Error al eliminar mantenimiento");
    throw new Error(msg);
  }
}

export async function updateMantenimiento(id, data) {
  const res = await fetch(`${API_URL}/mantenimientosU/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `No se pudo actualizar (HTTP ${res.status})`);
  }

  return await res.json();
}

export async function getMantenimientoById(id) {
  const res = await fetch(`${API_URL}/mantenimientos/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `No se pudo obtener el mantenimiento ${id} (HTTP ${res.status})`);
  }
  return res.json();
}

