import{
    ObtenerVehiculos,
    InsertarVehiculos,
    ActualizarVehiculo,
    BorrarVehiculo,
    ObtenerVehiculosPorID
}from '../Services/vehiculoService.js';

//------- 2. Variables de la Paginacion----------
let currentPage = 0;
let currentSize = 10;


document.addEventListener("DOMContentLoaded", () => {
    //Refrencia a los Elementos del DOM

    const TableBody = document.querySelector("#itemTable tbody");
    const form = document.getElementById("VehiculoForm");
    const modal = new bootstrap.Modal(document.getElementById("itemModal"));
    const ModalLabel = document.getElementById("itemModalLabel");
    const btnAdd = document.getElementById("btnAdd");

    //-------------- Donde estaran  ------------------
    const imageFileInput = document.getElementById("VehiculoImageFile"); //Input type="file"
    const imageUrlHidden = document.getElementById("VehiculoImagenUrl"); //Campo Hidden
    const imagePreview = document.getElementById("VehiculoImagePreview"); // Vehiculo preview <img>


    // ------ Selector de Tamaño Pagina ------
    const sizeSelector = document.getElementById("pageSize");
    sizeSelector.addEventListener("change", () =>{
        currentSize = parseInt(sizeSelector.value);
        currentPage = 0;
        CargarVehiculos();
    });

    // Resetear el formulario.
    btnAdd.addEventListener("click", () => {
        limpiarFormulario();
        ModalLabel.textContent = "Agregar Producto";
        modal.show();
    });

    //Payload que se enviara a la API
        form.addEventListener("submit", async(e) => {
        e.preventDefault();
        let id = form.IdVehiculo.value;
        //------ Construccion del payload para enviar a la API ------
        const payload = {
            placa: form.Placa.value.trim(),
            modelo: form.Modelo.value.trim(),
            capacidad: Number(form.Capacidad.value),
            AnioFabricacion: form.anio.value,
            estado: form.Estado.value,
        };
        //-------- Crear o Actualizar Producto--------
        try{
            if(id){
                await ActualizarVehiculo(id,payload);
            }else{
                await InsertarVehiculos(payload);
            }
            modal.hide();
            await CargarVehiculos(); //Refrescar Tabla
        }catch(err){
            console.error("Error Guardando:" , err);
            alert("Ocurrio un errro al guardar el producto");
        }
    });

    async function CargarVehiculos(){
        try{
            const data = await ObtenerVehiculos(currentPage, currentSize);
            const items = data.content || [];

            TableBody.innerHTML = "";

            renderPagination(data.number, data.totalPages);

            items.forEach((item) => {

                const tr = document.createElement("tr");

                //Para el ID
                const tdId = document.createElement("td");
                tdId.textContent = item.idVehiculo; 
                tr.appendChild(tdId);
                //Placa 
                const tdPlaca = document.createElement("td");
                tdPlaca.textContent = item.placa;
                tr.appendChild(tdPlaca);
                //modelo
                const tdModelo = document.createElement("td");
                tdModelo.textContent = item.modelo;
                tr.appendChild(tdModelo);
                //Capacidad
                const tdCapacidad = document.createElement("td");
                tdCapacidad.textContent = item.capacidad;
                tr.appendChild(tdCapacidad);
                //Año Fabricacion
                const tdAnioFabricacion = document.createElement("td");
                tdAnioFabricacion.textContent = item.anioFabricacion;
                tr.appendChild(tdAnioFabricacion);
                //Estado
                const tdEstado = document.createElement("td");
                tdEstado.textContent = item.estado;
                tr.appendChild(tdEstado);

                //Botones para editar y Eliminar
                const tdBtns = document.createElement("td");
                //Boton de Editar
                const btnEdit = document.createElement("button");
                btnEdit.className = "btn btn-sm btn-outline-secondary me-1 edit-btn";
                btnEdit.title = "Editar";

                //El icono es sacado de Lucidev.dev
                btnEdit.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pen-icon lucide-square-pen"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>
                `;

                btnEdit.addEventListener("click", () => {setFromulario(item)});
                tdBtns.appendChild(btnEdit);

                //Boton de Eliminar
                const btnDel = document.createElement("button");
                btnDel.className = "btn btn-sm btn-outline-danger delete-btn";
                btnDel.title = "Eliminar";

                //El icono es sacado de Lucidev.dev
                btnDel.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                `;
                btnDel.addEventListener("click", () => {
                    if(confirm("¿Desea Eliminar este Vehiculo?")){
                        EliminarVehiculo(item.id);
                    }
                });
                tdBtns.appendChild(btnDel);
                tr.appendChild(tdBtns);

                //Esa fila sera a anexada al tbody

                TableBody.appendChild(tr);
            });
        }catch(err){
            console.error("Error Cargando Productos:", err);
        }
    }
    //para restablecer el Formulario
    function setFromulario(item){
        form.IdVehiculo.value = item.idVehiculo;
        form.Placa.value = item.placa;
        form.Modelo.value = item.modelo;
        form.Capacidad.value = item.capacidad;
        form.anio.value = item.anio;
        form.Estado.value = item.estado;

        ModalLabel.textContent = "Editar Producto";
        modal.show();
    }

    //Limpiar el formulario.
    function limpiarFormulario(){
        form.reset();
        form.IdVehiculo.value = "";
    }

    //Eliminar vehiculo
    async function EliminarVehiculo(id){
        try{
            await BorrarVehiculo(id);
            await ObtenerVehiculos();
        }catch(error){
            console.error("Error a la hora de Eliminar:", error);
        } 
    }

    // ---  sacado del proyecto: Renderizado de paginación ---
function renderPagination(current, totalPages) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = ""; // Limpiamos el contenedor antes de dibujar los botones

  // --- Botón "Anterior" ---
  const prev = document.createElement("li");
  // Si estamos en la primera página (current === 0), se desactiva el botón
  prev.className = `page-item ${current === 0 ? "disabled" : ""}`;
  
  const prevLink = document.createElement("a");
  prevLink.className = "page-link"; // Clase de Bootstrap para darle estilo
  prevLink.href = "#"; // No redirige a otra página
  prevLink.textContent = "Anterior"; // Texto visible en el botón
  prevLink.addEventListener("click", (e) => {
    e.preventDefault(); // Evita que el enlace recargue la página
    if (current > 0) { 
      currentPage = current - 1; // Retrocedemos una página
      CargarVehiculos();         // Y recargamos los productos
    }
  });
  prev.appendChild(prevLink); // Metemos el <a> dentro del <li>
  pagination.appendChild(prev); // Agregamos el botón al paginador

  // --- Botones numéricos ---
  for (let i = 0; i < totalPages; i++) {
    const li = document.createElement("li");
    // Si "i" es la página actual, se marca como "active"
    li.className = `page-item ${i === current ? "active" : ""}`;
    
    const link = document.createElement("a");
    link.className = "page-link";
    link.href = "#";
    link.textContent = i + 1; // Mostramos número de página (1, 2, 3, …)
    link.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = i; // Cambiamos la página actual al número clicado
      CargarVehiculos(); // Volvemos a pedir productos de esa página
    });

    li.appendChild(link);
    pagination.appendChild(li);
  }

  // --- Botón "Siguiente" ---
  const next = document.createElement("li");
  // Se desactiva si ya estamos en la última página
  next.className = `page-item ${current >= totalPages - 1 ? "disabled" : ""}`;
  
  const nextLink = document.createElement("a");
  nextLink.className = "page-link";
  nextLink.href = "#";
  nextLink.textContent = "Siguiente";
  nextLink.addEventListener("click", (e) => {
    e.preventDefault();
    if (current < totalPages - 1) {
      currentPage = current + 1; // Avanzamos una página
      CargarVehiculos();         // Y actualizamos los productos
    }
  });

  next.appendChild(nextLink);
  pagination.appendChild(next);
}


//---------- Cargar datos iniciales ----------------
CargarVehiculos();
});