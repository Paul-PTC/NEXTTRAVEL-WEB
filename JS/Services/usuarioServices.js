const API_URL = 'http://localhost:8080/api/usuarios';

export const getUsuarios = async (page = 0, size = 10, sort = 'nombreUsuario,asc', search = '', searchType = 'nombre') => {
    let url = `${API_URL}?page=${page}&size=${size}&sort=${sort}`;
    if (search && searchType) {
        url += `&search=${encodeURIComponent(search)}&searchType=${encodeURIComponent(searchType)}`;
    }
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) {
        throw new Error('Error al obtener los usuarios');
    }
    return await response.json();
};

export const crearUsuario = async (payload) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        
        body: payload 
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el usuario');
    }
    return await response.json();
};

export const actualizarUsuario = async (id, payload) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        
        body: payload
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el usuario');
    }
    return await response.json();
};

export const eliminarUsuario = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el usuario');
    }
    // No se espera un cuerpo de respuesta en una eliminación exitosa
    if (response.status === 204 || response.status === 200) {
        return true;
    }
    throw new Error('Error desconocido al eliminar el usuario.');
};
          
