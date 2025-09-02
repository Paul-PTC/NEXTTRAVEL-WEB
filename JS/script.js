document.addEventListener("DOMContentLoaded", () => {
  // Recuperar usuario guardado en localStorage
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  console.log(usuario);

  if (usuario) {
    const nav = document.querySelector(".bottom-nav");

    // Siempre inicio
    let botones = 
    `
      <button id="Menu">
        <img src="IMG/Menu.png" alt="Menu" style="width:24px; height:24px; object-fit:contain;">
      </button>
    `;

    if (usuario.rol === "Vendedor") {
      botones += 
      `
        <button id="Gestionar">
          <img src="IMG/Gestionar.png" alt="Gestionar" style="width:24px; height:24px; object-fit:contain;">
        </button>
        <button id="Informacion">
          <img src="IMG/Personal.png" alt="Informacion" style="width:24px; height:24px; object-fit:contain;">
        </button>
      `;
    } else if (usuario.rol === "Usuario") {
      botones += 
      `
        <button id="Favoritos">
          <img src="IMG/Favoritos.png" alt="Favoritos" style="width:24px; height:24px; object-fit:contain;">
        </button>
        <button id="Buscar">
          <img src="IMG/Buscar.png" alt="Buscar" style="width:24px; height:24px; object-fit:contain;">
        </button>
        <button id="Informacion">
          <img src="IMG/Personal.png" alt="Informacion" style="width:24px; height:24px; object-fit:contain;">
        </button>
      `;
    }

    // Insertamos todo de golpe
    nav.innerHTML = botones;

     // --- Agregar eventos a los botones ---
    document.getElementById("Menu").addEventListener("click", () => {
      window.location.href = "index.html";
    });

    const infoBtn = document.getElementById("Informacion");
    if (infoBtn) {
      infoBtn.addEventListener("click", () => {
        window.location.href = "Usuario.html"; // reemplaza con tu página
      });
    }

    const favBtn = document.getElementById("Favoritos");
    if (favBtn) {
      favBtn.addEventListener("click", () => {
        window.location.href = "Favoritos.html";
      });
    }

    const buscarBtn = document.getElementById("Buscar");
    if (buscarBtn) {
      buscarBtn.addEventListener("click", () => {
        window.location.href = "Propiedades.html";
      });
    }

    const gestionarBtn = document.getElementById("Gestionar");
    if (gestionarBtn) {
      gestionarBtn.addEventListener("click", () => {
        window.location.href = "Visitas.html";
      });
    }
  } else {
    // Si no hay usuario, redirigir al login
    window.location.href = "login.html";
  }
});

