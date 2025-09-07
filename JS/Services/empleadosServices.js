const API_URL = 'http://localhost:8080/api/empleados';

// Función para obtener empleados con paginación y búsqueda
export async function getEmpleados({ page = 0, size = 10, sort = 'fechaContratacion,desc', search = '', searchType = 'nombre' }) {
    let url;

    // Construir la URL según el tipo de búsqueda
    switch (searchType) {
        case 'nombre':
            url = `${API_URL}/buscar/${search}?page=${page}&size=${size}&sort=${sort}`;
            break;
        case 'correo':
            url = `${API_URL}/buscar/correo/${search}?page=${page}&size=${size}&sort=${sort}`;
            break;
        case 'telefono':
            url = `${API_URL}/buscar/telefono/${search}?page=${page}&size=${size}&sort=${sort}`;
            break;
        case 'direccion':
            url = `${API_URL}/buscar/direccion/${search}?page=${page}&size=${size}&sort=${sort}`;
            break;
        case 'rango':
            url = `${API_URL}/buscar/rango/${search}?page=${page}&size=${size}&sort=${sort}`;
            break;
        default:
            // Caso por defecto para listar todos los empleados sin búsqueda
            url = `${API_URL}/listar?page=${page}&size=${size}&sort=${sort}`;
            break;
    }

    // Si no hay término de búsqueda, usamos la URL de listar por defecto
    if (!search || search.trim() === '') {
      url = `${API_URL}/listar?page=${page}&size=${size}&sort=${sort}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching empleados:', error);
        throw error;
    }
}
export const crearEmpleado = async (empleadoData) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(empleadoData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error de inserción: ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error creando empleado:", error);
        throw error;
    }
};


export const actualizarEmpleado = async (dui, empleadoData) => {
    try {
        const response = await fetch(`${API_URL}/${dui}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(empleadoData),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al actualizar el empleado: ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error actualizando empleado:", error);
        throw error;
    }
};


export const eliminarEmpleado = async (dui) => {
    try {
        const response = await fetch(`${API_URL}/${dui}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al eliminar el empleado: ${errorText}`);
        }
        return true; 
    } catch (error) {
        console.error("Error eliminando empleado:", error);
        throw error;
    }
};