const API_BASE_URL = 'http://localhost:8080/api/lugares/lugares';

// Función genérica para manejar las peticiones fetch
async function handleRequest(url, options) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido en el servidor' }));
            // Extraer mensaje de error de la estructura de tu API
            const errorMessage = errorData.message || errorData.mensaje || `Error ${response.status}`;
            throw new Error(errorMessage);
        }
        // Para DELETE, el cuerpo de la respuesta puede estar vacío.
        if (options.method === 'DELETE' || response.status === 204) {
            return { success: true };
        }
        return await response.json();
    } catch (error) {
        console.error('Error en la petición a la API:', error);
        throw error;
    }
}

// GET: Obtener la lista paginada de lugares
export const getPlans = (page = 0, size = 10, sort = 'nombreLugar,asc') => {
    return handleRequest(`${API_BASE_URL}/listar?page=${page}&size=${size}&sort=${sort}`, {
        method: 'GET'
    });
};

// GET: Buscar lugares por un criterio específico
export const searchPlans = (query, type, page = 0, size = 10, sort = 'nombreLugar,asc') => {
    let searchPath;
    // El endpoint de nombre es diferente según el controller
    if (type === 'nombre') {
       searchPath = `buscar/${encodeURIComponent(query)}`;
    } else {
       searchPath = `buscar/${type}/${encodeURIComponent(query)}`;
    }
    
    const url = `${API_BASE_URL}/${searchPath}?page=${page}&size=${size}&sort=${sort}`;
    return handleRequest(url, { method: 'GET' });
};

// POST: Crear un nuevo lugar turístico
export const createPlan = (planData) => {
    return handleRequest(API_BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(planData)
    });
};

// PUT: Actualizar un lugar turístico existente por su ID
export const updatePlan = (id, planData) => {
    return handleRequest(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(planData)
    });
};

// DELETE: Eliminar un lugar turístico por su ID
export const deletePlan = (id) => {
    return handleRequest(`${API_BASE_URL}/${id}`, {
        method: 'DELETE'
    });
};

