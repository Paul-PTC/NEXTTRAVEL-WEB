// URL base para los endpoints de la API
const API_URL = 'http://localhost:8080/api/usuarios'; // Se reutiliza el endpoint de usuarios
const ACTIVITY_URL = 'http://localhost:8080/api/actividad'; // Asumiendo un endpoint para la actividad
const IMAGE_UPLOAD_API_URL = 'http://localhost:8080/api/image/upload-to-folder';

/**
 * Obtiene los detalles de la cuenta del usuario actual (o por ID).
 * @param {number} userId - El ID del usuario.
 * @returns {Promise<any>}
 */
export async function getAccountDetails(userId) {
    const response = await fetch(`${API_URL}/${userId}`);
    if (!response.ok) {
        throw new Error('No se pudo cargar la información de la cuenta.');
    }
    return await response.json();
}

/**
 * Actualiza el perfil del usuario (nombre, correo).
 * @param {number} userId - El ID del usuario.
 * @param {object} data - Datos del perfil { nombreUsuario, correo }.
 */
export async function updateProfile(userId, data) {
    const response = await fetch(`${API_URL}/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido al actualizar el perfil.' }));
        throw new Error(error.message);
    }
    return await response.json();
}

/**
 * Actualiza la contraseña del usuario.
 * @param {number} userId - El ID del usuario.
 * @param {object} data - Contraseñas { currentPassword, newPassword }.
 */
export async function updatePassword(userId, data) {
    // El endpoint real puede variar, ej: /api/usuarios/{id}/change-password
    const response = await fetch(`${API_URL}/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
         const error = await response.json().catch(() => ({ message: 'Error desconocido al cambiar la contraseña.' }));
        throw new Error(error.message);
    }
    return await response.json();
}

/**
 * Sube una imagen de avatar.
 * @param {File} imageFile - El archivo de imagen a subir.
 * @returns {Promise<string>} La URL de la imagen subida.
 */
export async function uploadAvatar(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('folder', 'next_travel_avatars');

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
}


/**
 * Obtiene el historial de actividad de un usuario.
 * @param {number} userId - El ID del usuario.
 * @returns {Promise<any[]>}
 */
export async function getActivityLog(userId) {
    const response = await fetch(`${ACTIVITY_URL}/usuario/${userId}?sort=fecha,desc`);
    if (!response.ok) {
        throw new Error('No se pudo cargar el historial de actividad.');
    }
    const data = await response.json();
    return data.content || [];
}
