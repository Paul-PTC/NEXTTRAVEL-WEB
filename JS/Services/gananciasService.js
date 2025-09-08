const API_URL = "http://localhost:8080/api/ganancias";

/**
 * Listar ganancias con soporte para búsqueda y paginación
 * @param {Object} params
 * @param {number} params.page Número de página (0-based)
 * @param {number} params.size Tamaño de página
 * @param {string} params.sort Campo y orden ej: "fecha,desc"
 * @param {string} [params.q] Texto de búsqueda opcional
 * @returns {Promise<{items: Array, total: number, totalPages: number, page: number, size: number}>}
 */
export async function getGanancias({ page = 0, size = 10, sort = "fecha,desc", q = "" }) {
    // Determinar endpoint según búsqueda
    const isNumeric = q && /^[0-9]+$/.test(q);
    const endpoint = !q
        ? `${API_URL}/ganancias/listar`
        : (isNumeric
            ? `${API_URL}/ganancias/buscar/reserva/${encodeURIComponent(q)}`
            : `${API_URL}/ganancias/buscar/cliente/${encodeURIComponent(q)}`);

    const url = new URL(endpoint);
    url.searchParams.set("page", String(page));
    url.searchParams.set("size", String(size));
    url.searchParams.set("sort", sort);

    const res = await fetch(url.toString());
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`GET ${url} -> ${res.status} ${text}`);
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

/**
 * POST → Crear una nueva ganancia
 *
 * Endpoint: POST /api/ganancias/ganancias
 *
 * @param {{ idReserva:number, monto_bruto:number, monto_neto:number, fecha?:string }} dto
 * @returns {Promise<any>} Ejemplo de respuesta:
 *          { status: "success", idGanancia: 123 }
 */
export async function createGanancia(dto) {
  const res = await fetch(`${API_URL}/gananciasI`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    let errPayload = null;
    try {
      errPayload = await res.json();
    } catch (_) {}

    const message =
      errPayload?.message ||
      errPayload?.mensaje ||
      `No se pudo crear la ganancia (HTTP ${res.status})`;

    const error = new Error(message);

    // Si el backend devolvió errores de validación
    if (errPayload?.errors) error.fields = errPayload.errors;
    error.detail = errPayload;

    throw error;
  }

  return res.json();
}

export async function updateGanancia(id, dto) {
  const res = await fetch(`${API_URL}/ganancias/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    let payload = null;
    try {
      payload = await res.json();
    } catch (_) {}
    const msg = payload?.message || payload?.mensaje || `No se pudo actualizar (HTTP ${res.status})`;
    const err = new Error(msg);
    err.fields = payload?.errors;
    err.detail = payload;
    throw err;
  }

  return res.json(); // Devuelve { status: "success" }
}

export async function deleteGanancia(id) {
  const res = await fetch(`${API_URL}/ganancias/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    let payload = null;
    try { payload = await res.json(); } catch (_) {}
    const msg =
      payload?.message ||
      payload?.mensaje ||
      `No se pudo eliminar (HTTP ${res.status})`;
    const err = new Error(msg);
    err.detail = payload;
    throw err;
  }

  // Puede devolver JSON con "mensaje" o estar vacío
  try {
    return await res.json();
  } catch {
    return { mensaje: "Eliminado" };
  }
}
