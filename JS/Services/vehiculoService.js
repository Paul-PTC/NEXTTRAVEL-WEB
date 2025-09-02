//Primeramente Obtenemos Los Endpoints de La API

//Asi es como se mostraran los datos en la API
/*
    "idVehiculo": 4,
    "placa": "M-987654",
    "modelo": "Honda CB125F",
    "capacidad": 1,
    "anioFabricacion": 2021,
    "estado": "Activo"
*/ 

const API_URL = 'http://localhost:8080/api/vehiculos';


export async function ObtenerVehiculos(page = 0, size = 10){
    try{
        const res = await fetch(`${API_URL}/vehiculos/listar?page=${page}&size=${size}`) 
        if(!res.ok)throw new Error(`Error al Buscar Vehiculos: ${res.status}`);
        return res.json();  
    }catch(error){
        console.error("Error el Buscar vehiculos:", error);
        throw error;
    } 
}

export async function ObtenerVehiculosPorID(page = 0, size = 10, modelo){
    try{
        const res = await fetch(`${API_URL}/vehiculos/buscar/modelo/${modelo}?page=${page}&size=${size}`);
        if(!res.ok)throw new Error(`Error al Buscar vehiculos por Modelo: ${res.status}`); 
        return res.json();
    }catch(err){
        console.error("Error el buscar", err);
        throw err;
    }  
}

export async function InsertarVehiculos(data){
    try{
        const res = await fetch(`${API_URL}/vehiculos`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data),
    });
    if(!res.ok)throw new Error(`Error al Insertar Vehiculos: ${res.status}`);
    }catch(er){
        console.error(`Error al insertar Vehiculo:`, er);
        throw er;
    }
}

export async function ActualizarVehiculo(id, data){
    try{
        const res = await fetch(`${API_URL}/actualizar/${id}`,{
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Error al Actualizar el vehiculo: ${res.status}`);
    return await res.json();
    }catch(err){
        console.error("Error al Actualizar Vehiculo", err);
        throw err;
    } 
}

export async function BorrarVehiculo(id){
    try{
        const res = await fetch(`${API_URL}/eliminar/${id}`, {method: 'DELETE'});
        if(!res.ok)throw new Error(`Error a la hora de Borrar vehiculo: ${res.status}`)
    }catch(err){
        console.error(`Error en la Hora de Eliminar: ${err}`);
        throw err;
    }
}

// /vehiculos/buscar/placa/
//Buscar por Placa
export async function BuscarPorPlaca(id, page = 0, size = 5){
   try{
        const res = await fetch(`${API_URL}/vehiculos/buscar/placa/${id}?page=${page}&size=${size}`);
        if (!res.ok) throw new Error(`Error en la petición: ${res.status}`);
        return await res.json();
   }catch(error){
        console.error(`Error en la hora de Obtener Vehiculos Por Placa:${error}`);
        throw error;
   }  
}