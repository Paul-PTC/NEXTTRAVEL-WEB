// URL base para los endpoints de la API
const API_URL = 'http://localhost:8080/api/vehiculos';
const IMAGE_UPLOAD_API_URL = 'http://localhost:8080/api/image/upload-to-folder'; // Endpoint para imágenes

/**
 * Obtiene una lista paginada de vehículos.
 * @param {object} params - Parámetros de paginación y búsqueda.
 * @returns {Promise<any>}
 */
export async function getVehiculos(params = {}) {
    const { page = 0, size = 10, sort = 'modelo,asc', search = '' } = params;
    
    // Búsqueda inteligente: si parece placa, busca por placa, si no, por modelo.
    const searchField = /^[A-Z0-9\s-]{4,}$/i.test(search) ? 'placa' : 'modelo';

    const endpoint = search
        ? `${API_URL}/buscar/${searchField}/${encodeURIComponent(search)}`
        : `${API_URL}/listar`;
    
    const url = `${endpoint}?page=${page}&size=${size}&sort=${sort}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Fallo la conexión con la API en getVehiculos:", error);
        throw new Error('No se pudo conectar al servidor. Verifica que la API esté corriendo.');
    }
}

/**
 * Obtiene un vehículo por su ID.
 * @param {number} id - El ID del vehículo.
 * @returns {Promise<object>}
 */
export async function getVehiculoById(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) {
            throw new Error(`Error al buscar el vehículo: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error al obtener vehículo por ID:", error);
        throw error;
    }
}


/**
 * Sube un archivo de imagen.
 * @param {File} imageFile - El archivo de imagen a subir.
 * @returns {Promise<string>} La URL de la imagen subida.
 */
export const uploadImage = async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('folder', 'next_travel_vehicles'); // Carpeta destino en Cloudinary

    const response = await fetch(IMAGE_UPLOAD_API_URL, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al subir la imagen: ${errorText}`);
    }
    const result = await response.json();
    return result.url;
};

/**
 * Crea un nuevo vehículo.
 * @param {object} data - Los datos del vehículo.
 */
export async function createVehiculo(data) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(data),
        });
        if (!response.ok) {
             const error = await response.json().catch(() => ({ message: 'Error desconocido.' }));
             throw new Error(error.message);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error al insertar Vehículo:`, error);
        throw error;
    }
}

/**
 * Actualiza un vehículo existente.
 * @param {number} id - El ID del vehículo.
 * @param {object} data - Los datos a actualizar.
 */
export async function updateVehiculo(id, data) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Error desconocido.' }));
            throw new Error(error.message);
        }
        return await response.json();
    } catch(err){
        console.error("Error al Actualizar Vehiculo", err);
        throw err;
    } 
}

/**
 * Elimina un vehículo.
 * @param {number} id - El ID del vehículo a eliminar.
 */
export async function deleteVehiculo(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error(`Error al eliminar el vehículo: ${response.status}`);
        }
        // DELETE puede no devolver cuerpo, así que no intentamos parsear JSON
        return true;
    } catch(err) {
        console.error(`Error al Eliminar: ${err}`);
        throw err;
    }
}

