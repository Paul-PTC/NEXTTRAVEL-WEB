// Este archivo contiene las llamadas a la API para la gestión de clientes

const API_URL = 'http://localhost:8080/api/clientes';

export const getClientes = async (page = 0, size = 10, sort = 'fechaRegistro,desc', searchType = 'dui', searchTerm = '') => {
    try {
        let url;
        
        if (searchTerm && searchType !== 'dui') {
            // Manejar las rutas de búsqueda correctas, excluyendo la búsqueda por DUI
            switch(searchType) {
                case 'telefono':
                    url = `${API_URL}/buscar/telefono/${searchTerm}?page=${page}&size=${size}&sort=${sort}`;
                    break;
                case 'direccion':
                    url = `${API_URL}/buscar/direccion/${searchTerm}?page=${page}&size=${size}&sort=${sort}`;
                    break;
                case 'fechaRegistro':
                    const [desde, hasta] = searchTerm.split('|');
                    url = `${API_URL}/buscar/fecha?desde=${desde}&hasta=${hasta}&page=${page}&size=${size}&sort=${sort}`;
                    break;
                default:
                    url = `${API_URL}?page=${page}&size=${size}&sort=${sort}`;
            }
        } else {
            url = `${API_URL}?page=${page}&size=${size}&sort=${sort}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error en getClientes:', error);
        throw error;
    }
};

export const getClienteByDui = async (dui) => {
    try {
        const response = await fetch(`${API_URL}/buscar/dui/${dui}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                // Devolvemos null si el cliente no se encuentra
                return null;
            }
            throw new Error(`Error en la petición: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error al obtener cliente por DUI:', error);
        throw error;
    }
};

export const createCliente = async (cliente) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(cliente),
    });
    return response;
};

export const updateCliente = async (dui, cliente) => {
    const response = await fetch(`${API_URL}/${dui}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(cliente),
    });
    return response;
};

export const deleteCliente = async (dui) => {
    const response = await fetch(`${API_URL}/${dui}`, {
        method: 'DELETE',
    });
    return response;
};