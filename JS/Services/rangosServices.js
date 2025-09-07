const API_URL = 'http://localhost:8080/api/rangos';

// Función para obtener todos los rangos con paginación y ordenación
export async function getRangos({ page = 0, size = 10, sort = 'nombreRango,asc' }) {
    const url = `${API_URL}?page=${page}&size=${size}&sort=${sort}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching rangos:', error);
        throw error;
    }
}

// Función para buscar rangos por nombre (parcial)
export async function buscarRangosPorNombre({ nombre, page = 0, size = 10, sort = 'nombreRango,asc' }) {
    const url = `${API_URL}/buscar/${nombre}?page=${page}&size=${size}&sort=${sort}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error buscando rangos por nombre:', error);
        throw error;
    }
}

// Función para crear un nuevo rango
export const crearRango = async (rangoData) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rangoData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Datos para inserción inválidos: ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error creando rango:", error);
        throw error;
    }
};

// Función para actualizar un rango por ID
export const actualizarRangoPorId = async (id, rangoData) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rangoData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al actualizar el rango: ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error actualizando rango:", error);
        throw error;
    }
};

// Función para eliminar un rango por ID
export const eliminarRangoPorId = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al eliminar el rango: ${errorText}`);
        }
        return true; // En DELETE, típicamente no se espera respuesta en cuerpo
    } catch (error) {
        console.error("Error eliminando rango:", error);
        throw error;
    }
};
