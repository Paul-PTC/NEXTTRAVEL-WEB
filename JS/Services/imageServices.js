const IMAGE_API = 'http://localhost:8080/api/image';

//Sube uns imagen y devuelve el JSON del backend: {message, url}
export async function uploadImage(file) {
    const formData = new formData();
    formData.append('image', file); //Coincidir con @requestParam("image")

    const res = await fetch(`${IMAGE_API}/upload`, {
        method: 'POST',
        body: formData

    });

    return res.json();
}

//Sube a una carpeta especifica
export async function uploadImageToFolder(file, folder) {
    const formData = new FormData();
    formData.append('image',file);
    formData.append('folder', folder);
    
    const res = await fetch(`${IMAGE_API}/upload-to-folder`,{
        method:'POST',
        body: formData,
    });
    
    return res.json();
}