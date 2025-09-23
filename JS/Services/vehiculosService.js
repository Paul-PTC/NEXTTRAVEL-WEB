// Aquí va la URL de la API, no los endpoints específicos
const API_URL = "http://localhost:8080/api/vehiculos";

export async function getVehiculos(page = 0, size = 10, sort = "placa,asc") {
    const res = await fetch(`${API_URL}/vehiculos/listar?page=${page}&size=${size}&sort=${sort}`);
    return res.json();
}

export async function createVehiculo(data) {
    const res = await fetch(`${API_URL}/vehiculos`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function updateVehiculo(id, data) {
    const res = await fetch(`${API_URL}/vehiculos/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function deleteVehiculo(id) {
    const res = await fetch(`${API_URL}/vehiculos/${id}`, {
        method: "DELETE"
    });
    return res.json();
}

export async function buscarPorPlaca(q, page = 0, size = 10, sort = "placa,asc") {
    const res = await fetch(`${API_URL}/vehiculos/buscar/placa/${encodeURIComponent(q)}?page=${page}&size=${size}&sort=${sort}`);
    return res.json();
}

export async function buscarPorModelo(q, page = 0, size = 10, sort = "modelo,asc") {
    const res = await fetch(`${API_URL}/vehiculos/buscar/modelo/${encodeURIComponent(q)}?page=${page}&size=${size}&sort=${sort}`);
    return res.json();
}

export async function buscarPorEstado(q, page = 0, size = 10, sort = "estado,asc") {
    const res = await fetch(`${API_URL}/vehiculos/buscar/estado/${encodeURIComponent(q)}?page=${page}&size=${size}&sort=${sort}`);
    return res.json();
}

export async function buscarPorCapacidad(min, max, page = 0, size = 10, sort = "capacidad,desc") {
    let url = `${API_URL}/vehiculos/buscar/capacidad?page=${page}&size=${size}&sort=${sort}`;
    if (min !== null && min !== undefined) url += `&min=${min}`;
    if (max !== null && max !== undefined) url += `&max=${max}`;
    const res = await fetch(url);
    return res.json();
}

export async function buscarPorAnio(min, max, page = 0, size = 10, sort = "anioFabricacion,desc") {
    let url = `${API_URL}/vehiculos/buscar/anio?page=${page}&size=${size}&sort=${sort}`;
    if (min !== null && min !== undefined) url += `&min=${min}`;
    if (max !== null && max !== undefined) url += `&max=${max}`;
    const res = await fetch(url);
    return res.json();
}