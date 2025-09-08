// URLs base para los endpoints de la API
const RESERVA_API_URL = 'http://localhost:8080/api/reservas/reservas';
const ESTADO_VIAJE_API_URL = 'http://localhost:8080/api/estadoviaje/estadoviaje';
// Asumiendo que tienes un endpoint para listar todos los estados posibles
const ESTADOS_API_URL = 'http://localhost:8080/api/estados'; 

/**
 * Obtiene una lista paginada de reservas.
 * @param {object} params - Parámetros de paginación y búsqueda.
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

