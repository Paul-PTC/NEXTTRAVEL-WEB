// URL base de la API
const API_URL = "http://localhost:8080/api/clientes";

// Obtener todos los clientes con paginación
export async function getClientes(page = 0, size = 10, sort = "fechaRegistro,desc") {
    const res = await fetch(`${API_URL}/cliente/listar?page=${page}&size=${size}&sort=${sort}`);
    return res.json();
}

// Crear un nuevo cliente
export async function createCliente(data) {
    const res = await fetch(`${API_URL}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });
    return res.json();
}

// Actualizar cliente por DUI
export async function updateCliente(dui, data) {
    const res = await fetch(`${API_URL}/${dui}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });
    return res.json();
}

// Eliminar cliente por DUI
export async function deleteCliente(dui) {
    const res = await fetch(`${API_URL}/${dui}`, {
        method: "DELETE"
    });
    return res.json();
}

// Buscar clientes por nombre
export async function buscarPorNombre(nombre, page = 0, size = 10, sort = "fechaRegistro,desc") {
    const res = await fetch(`${API_URL}/buscar/${encodeURIComponent(nombre)}?page=${page}&size=${size}&sort=${sort}`);
    return res.json();
}

// Buscar cliente por DUI
export async function buscarPorDui(dui) {
    const res = await fetch(`${API_URL}/buscar/dui/${encodeURIComponent(dui)}`);
    return res.json();
}

// Buscar clientes por correo
export async function buscarPorCorreo(correo, page = 0, size = 10, sort = "fechaRegistro,desc") {
    const res = await fetch(`${API_URL}/buscar/correo/${encodeURIComponent(correo)}?page=${page}&size=${size}&sort=${sort}`);
    return res.json();
}

// Buscar clientes por teléfono
export async function buscarPorTelefono(telefono, page = 0, size = 10, sort = "fechaRegistro,desc") {
    const res = await fetch(`${API_URL}/buscar/telefono/${encodeURIComponent(telefono)}?page=${page}&size=${size}&sort=${sort}`);
    return res.json();
}

// Buscar clientes por dirección
export async function buscarPorDireccion(direccion, page = 0, size = 10, sort = "fechaRegistro,desc") {
    const res = await fetch(`${API_URL}/buscar/direccion/${encodeURIComponent(direccion)}?page=${page}&size=${size}&sort=${sort}`);
    return res.json();
}

// Buscar clientes por rango de puntos
export async function buscarPorPuntos(min, max, page = 0, size = 10, sort = "puntosActuales,desc") {
    let url = `${API_URL}/buscar/puntos?page=${page}&size=${size}&sort=${sort}`;
    if (min !== null && min !== undefined) url += `&min=${min}`;
    if (max !== null && max !== undefined) url += `&max=${max}`;
    
    const res = await fetch(url);
    return res.json();
}

// Buscar clientes por rango de fechas
export async function buscarPorFecha(desde, hasta, page = 0, size = 10, sort = "fechaRegistro,desc") {
    const res = await fetch(`${API_URL}/buscar/fecha?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}&page=${page}&size=${size}&sort=${sort}`);
    return res.json();
}