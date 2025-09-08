// URL base para los endpoints de la API
const LUGAR_API_URL = 'http://localhost:8080/api/lugares/lugares';
const MEDIA_API_URL = 'http://localhost:8080/api/lugarmedia/media';
const IMAGE_UPLOAD_API_URL = 'http://localhost:8080/api/image/upload-to-folder';
 
/**
 * Obtiene una lista paginada de lugares turísticos.
 */
export const getLugares = async (params) => {
    // CORREGIDO: Aseguramos que el endpoint base siempre esté presente.
    const endpoint = params.search
        ? `${LUGAR_API_URL}/buscar/${encodeURIComponent(params.search)}`
        : `${LUGAR_API_URL}/listar`;
   
    const url = `${endpoint}?page=${params.page}&size=${params.size}&sort=${params.sort}`;
   
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Fallo la conexión con la API en getLugares:", error);
        // Este error se mostrará en la consola si el servidor no está disponible.
        throw new Error('No se pudo conectar al servidor. Verifica que la API esté corriendo.');
    }
};
 
/**
 * Obtiene la imagen principal de un lugar.
 */
export const getMediaPorLugar = async (nombreLugar) => {
    if (!nombreLugar || nombreLugar.trim() === '') return null;
    const url = `${MEDIA_API_URL}/buscar/${encodeURIComponent(nombreLugar)}?page=0&size=1&sort=is_primary,desc`;
   
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`No se pudo obtener media para ${nombreLugar}, status: ${response.status}`);
        return null;
    }
    const data = await response.json();
    return data.content?.[0] || null;
};
 
/**
 * Sube un archivo de imagen a Cloudinary.
 * @param {File} imageFile - El archivo de imagen a subir.
 * @returns {Promise<string>} La URL de la imagen subida.
 */
export const uploadImage = async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('folder', 'next_travel_places'); // Carpeta en Cloudinary
 
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
 * Crea un nuevo lugar turístico.
 * @param {object} planData - Los datos del plan, incluyendo la imageUrl.
 */
export const createLugar = async (planData) => {
    const response = await fetch(LUGAR_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear el plan');
    }
    return await response.json();
};
 
/**
 * Actualiza un lugar turístico existente.
 * @param {number} id - El ID del lugar a actualizar.
 * @param {object} planData - Los datos del plan, incluyendo la nueva imageUrl si aplica.
 */
export const updateLugar = async (id, planData) => {
    const response = await fetch(`${LUGAR_API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar el plan');
    }
    return await response.json();
};
 
/**
 * Elimina un lugar turístico.
 */
export const deleteLugar = async (id) => {
    const response = await fetch(`${LUGAR_API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error al eliminar el plan');
    }
    return true;
};
