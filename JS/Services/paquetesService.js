// URL base para los endpoints de la API
const LUGAR_API_URL = 'http://localhost:8080/api/lugares/lugares';
const IMAGE_UPLOAD_API_URL = 'http://localhost:8080/api/image/upload-to-folder'; // Asumiendo este endpoint para imágenes

/**
 * Obtiene una lista paginada de lugares turísticos (paquetes).
 * @param {object} params - Parámetros de paginación y búsqueda.
 * @returns {Promise<any>}
 */
export const getLugares = async (params) => {
    const { page = 0, size = 10, sort = 'nombreLugar,asc', search = '' } = params;
    
    const endpoint = search
        ? `${LUGAR_API_URL}/buscar/${encodeURIComponent(search)}`
        : `${LUGAR_API_URL}/listar`;
    
    const url = `${endpoint}?page=${page}&size=${size}&sort=${sort}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Fallo la conexión con la API en getLugares:", error);
        throw new Error('No se pudo conectar al servidor. Verifica que la API esté corriendo.');
    }
};

/**
 * Sube un archivo de imagen.
 * @param {File} imageFile - El archivo de imagen a subir.
 * @returns {Promise<string>} La URL de la imagen subida.
 */
export const uploadImage = async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('folder', 'next_travel_places'); // Carpeta destino

    const response = await fetch(IMAGE_UPLOAD_API_URL, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al subir la imagen: ${errorText}`);
    }
    const result = await response.json();
    return result.url; // Asume que la API devuelve un objeto con la URL
};

/**
 * Crea un nuevo lugar turístico (paquete).
 * @param {object} planData - Los datos del paquete.
 */
export const createLugar = async (planData) => {
    const response = await fetch(LUGAR_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido al crear el paquete.' }));
        throw new Error(error.message);
    }
    return await response.json();
};

/**
 * Actualiza un lugar turístico existente.
 * @param {number} id - El ID del lugar a actualizar.
 * @param {object} planData - Los datos del paquete.
 */
export const updateLugar = async (id, planData) => {
    const response = await fetch(`${LUGAR_API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido al actualizar el paquete.' }));
        throw new Error(error.message);
    }
    return await response.json();
};

/**
 * Elimina un lugar turístico.
 * @param {number} id - El ID del lugar a eliminar.
 */
export const deleteLugar = async (id) => {
    const response = await fetch(`${LUGAR_API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error al eliminar el paquete');
    }
    return true; // Éxito
};
