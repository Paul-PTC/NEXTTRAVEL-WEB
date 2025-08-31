import{
    ObtenerVehiculos,
    InsertarVehiculos,
    ActualizarVehiculo,
    BorrarVehiculo
}from '../Services/VehiculoService.js';

//------- 2. Variables de la Paginacion----------
let currentPage = 0;
let currentSize = 10;


document.addEventListener("DOMContentLoaded", () => {
    //Refrencia a los Elementos del DOM

    const TableBody = document.querySelector("#itemTable tbody");
    const Formulario = document.getElementById("VehiculoForm");
    const modal = new bootstrap.Modal(document.getElementById("itemModal"));
    const ModalLabel = document.getElementById("itemModalLabel");
    const btnAdd = document.getElementById("btnAdd");

    //-------------- Donde estaran  ------------------
    const imageFileInput = document.getElementById("VehiculoImageFile"); //Input type="file"
    const imageUrlHidden = document.getElementById("VehiculoImagenUrl"); //Campo Hidden
    const imagePreview = document.getElementById("VehiculoImagePreview"); //preview <img>

    //---------- Previsualizar la Imagen -------------
    if(imageFileInput && imagePreview){
        imageFileInput.addEventListener("change", () => {
            const file = imageFileInput.files?.[0]
            if(file){
                const reader = new FileReader();
                reader.onload = () => (imagePreview.src = reader.result); //----Mostrar preview
                reader.readAsDataURL(file);     
            }else{
                imagePreview.src = imageUrlHidden?.value || "";
            }
        });
    }


    // ------ Selector de Tamaño Pagina ------
    const sizeSelector = document.getElementById("pageSize");
    sizeSelector.addEventListener("change", () =>{
        currentSize = parseInt(sizeSelector.value);
        currentPage = 0;
        cargarProductos();
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

        //------ 8. Manejo de la Imagen: Usar Valor actual o subir nueva 
        let finalImageUrl = imageUrlHidden?.value || "";
        const file = imageFileInput?.files?.[0];
        if(file){
            try{
                //Subir imagen al Backend
                const data = await uploadImageToFolder(file, "products");
                finalImageUrl = data.url || "";            
            }catch (err){
                console.error("Error subiendo la imagen", err);
                alert("No se pudo subir la imagen intenta Nuevamente");
                return; //Si falla la subida no guardamos el producto
            }
        }
        //------ Construccion del payload para enviar a la API ------
        const payload = {
            nombre: form.productName.value.trim(),
            precio: Number(form.productPrice.value),
            descripcion: form.productDescription.value.trim(),
            stock: Number(form.productStock.value),
            fechaIngreso: form.productDate.value,
            categoriaId: Number(form.productCategory.value),
            usuarioId: 2, //por ahora fijo
            imagenurl: finalImageUrl || null, //Campo correcto segun backend
        };
        //-------- Crear o Actualizar Producto--------
        try{
            if(id){
                await updateProduct(id,payload);
            }else{
                await createProduct(payload);
            }
            modal.hide();
            await cargarProductos(); //Refrescar Tabla
        }catch(err){
            console.error("Error Guardando:" , err);
            alert("Ocurrio un errro al guardar el producto");
        }
    });






});


