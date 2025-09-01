//Primeramente Obtenemos Los Endpoints de La API

//Asi es como se mostraran los datos en la API
/*
  "idVehiculo": 1,
      "placa": "P123XYZ",
      "marca": "Toyota",
      "modelo": "Corolla",
      "anio": 2020,
      "fechaVencimientoCirculacion": "2025-12-31",
      "fechaVencimientoSeguro": "2025-11-30",
      "fechaVencimientoRevision": "2025-10-31"
*/ 

const API_URL = 'http://localhost:8080/apivehiculo';



export async function ObtenerVehiculos(page = 0, size = 10){
    const res = await fetch(`${API_URL}/vehiculos?page=${page}&size=${size}`)
    return res.json();   
}

export async function ObtenerVehiculosPorID(page = 0, size = 10, id){
    const res = await fetch(`${API_URL}/vehiculos?page=${page}&size=${size}/vehiculos/${id}`)
    return res.json();   
}



export async function InsertarVehiculos(data){
    const res = await fetch(`${API_URL}/insertar`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data),
    });
}

export async function ActualizarVehiculo(id, data){
    await fetch(`${API_URL}/actualizar/${id}`,{
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data),
    });
}

export async function BorrarVehiculo(id){
    await fetch(`${API_URL}/eliminar/${id}`, {method: 'DELETE'});
}

