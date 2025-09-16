// URLs base para los endpoints de la API
const RESERVA_API_URL = 'http://localhost:8080/api/reservas';
const ESTADO_VIAJE_API_URL = 'http://localhost:8080/api/estadoviaje';
const ESTADOS_API_URL = 'http://localhost:8080/api/estados'; 

/**
 * Obtiene una lista paginada de reservas.
 * @param {object} params - Parámetros de paginación y búsqueda.
 * @param {number} params.page - Página actual.
 * @param {number} params.size - Elementos por página.
 * @param {string} params.sort - Criterio de ordenación.
 * @param {string} params.search - Término de búsqueda.
 * @param {string} params.type - Tipo de búsqueda (cliente, dui, lugar, estado).
 * @returns {Promise<any>}
 */
export const getReservas = async (params) => {
    const { page = 0, size = 10, sort = 'fechaReserva,desc', search = '', type = 'cliente' } = params;
    
    let endpoint = 'listar';
    if (search) {
        // Construye el endpoint de búsqueda basado en el tipo
        switch (type) {
            case 'cliente':
                endpoint = `buscar/cliente/${encodeURIComponent(search)}`;
                break;
            case 'dui':
                endpoint = `buscar/dui/${encodeURIComponent(search)}`;
                break;
            case 'lugar':
                endpoint = `buscar/lugar/${encodeURIComponent(search)}`;
                break;
            case 'estado':
                endpoint = `buscar/estado/${encodeURIComponent(search)}`;
                break;
        }
    }

    const url = new URL(`${RESERVA_API_URL}/${endpoint}`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("size", String(size));
    url.searchParams.set("sort", sort);

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al obtener reservas: ${response.status} ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error en getReservas:", error);
        throw error;
    }
};

/**
 * Obtiene todos los estados de viaje disponibles.
 * @returns {Promise<any[]>} - Un array de objetos de estado.
 */
export const getEstados = async () => {
    try {
        const response = await fetch(ESTADOS_API_URL);
        if (!response.ok) {
            throw new Error(`Error al obtener los estados: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error en getEstados:", error);
        throw error;
    }
};

/**
 * Actualiza el estado de una reserva creando un nuevo registro de EstadoViaje.
 * @param {number} idReserva - El ID de la reserva a actualizar.
 * @param {number} idEstado - El ID del nuevo estado.
 * @returns {Promise<any>}
 */
export const updateEstadoReserva = async (idReserva, idEstado) => {
    try {
        const response = await fetch(ESTADO_VIAJE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idReserva, idEstado }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido al actualizar el estado.' }));
            throw new Error(errorData.message);
        }
        return await response.json();
    } catch (error) {
        console.error("Error en updateEstadoReserva:", error);
        throw error;
    }
};

/**
 * Crea una nueva reserva.
 * @param {object} reservaData - Los datos de la nueva reserva.
 * @returns {Promise<any>}
 */
export const createReserva = async (reservaData) => {
    try {
        const response = await fetch(RESERVA_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reservaData),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido al crear la reserva.' }));
            throw new Error(errorData.message);
        }
        return await response.json();
    } catch (error) {
        console.error("Error en createReserva:", error);
        throw error;
    }
};

/**
 * Elimina una reserva por su ID.
 * @param {number} idReserva - El ID de la reserva a eliminar.
 * @returns {Promise<void>}
 */
export const deleteReserva = async (idReserva) => {
    try {
        const response = await fetch(`${RESERVA_API_URL}/${idReserva}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido al eliminar la reserva.' }));
            throw new Error(errorData.message);
        }
        // DELETE puede no devolver contenido
        return response.status === 204 || response.status === 200;
    } catch (error) {
        console.error("Error en deleteReserva:", error);
        throw error;
    }
};
