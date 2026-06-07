let dbMovies = [];
let currentMovieKey = "";
let currentSeqIdx = 0;
let isWorking = false;

// Cargar JSON al iniciar
document.addEventListener("DOMContentLoaded", () => {
  fetchData();
});

function fetchData() {
  // Ruta relativa al JSON
  fetch("json/data.json")
    .then((response) => response.json())
    .then((data) => {
      dbMovies = data.movies;
      renderCatalog();
    })
    .catch((error) => console.error("Error cargando JSON:", error));
}

function renderCatalog() {
  const grid = document.getElementById("main-catalog-grid");
  grid.innerHTML = "";

  dbMovies.forEach((movie) => {
    const card = document.createElement("div");
    const isDisabled = movie.status === "disabled" ? "disabled" : "";
    card.className = `movie-card ${isDisabled}`;

    if (!isDisabled) {
      card.onclick = () => openMovieViewer(movie.id, movie.title);
    }

    card.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title}">
            <div class="card-info">
                <h2>${movie.title}</h2>
                <p>${movie.year}</p>
                ${movie.status === "disabled" ? '<p class="status-badge">PRÓXIMAMENTE</p>' : ""}
            </div>
        `;
    grid.appendChild(card);
  });
}

function navigateTo(viewName) {
  isWorking = false;
  // Limpiar video al cambiar de vista
  document.getElementById("video-frame-container").innerHTML = "";

  document
    .querySelectorAll(".view-section")
    .forEach((section) => section.classList.remove("active"));
  document
    .querySelectorAll(".nav-btn")
    .forEach((btn) => btn.classList.remove("active"));

  if (viewName === "catalog") {
    document.getElementById("top-search-wrapper").style.display = "block";
    document.getElementById("catalog-view").classList.add("active");
  } else if (viewName === "viewer") {
    document.getElementById("top-search-wrapper").style.display = "none";
    document.getElementById("viewer-view").classList.add("active");
  } else if (viewName === "collab") {
    document.getElementById("top-search-wrapper").style.display = "block";
    document.getElementById("nav-collab").classList.add("active");
    document.getElementById("collab-view").classList.add("active");
  }
  window.scrollTo(0, 0);
}

function filterMovies() {
  if (!document.getElementById("catalog-view").classList.contains("active"))
    navigateTo("catalog");
  const query = document
    .getElementById("movie-search-input")
    .value.toLowerCase()
    .trim();
  const cards = document.querySelectorAll("#main-catalog-grid .movie-card");
  let visibleCount = 0;

  cards.forEach((card) => {
    const title = card.querySelector("h2");
    if (title) {
      const text = title.innerText.toLowerCase();
      if (text.includes(query)) {
        card.style.display = "block";
        visibleCount++;
      } else {
        card.style.display = "none";
      }
    }
  });
  document.getElementById("search-empty-state").style.display =
    visibleCount === 0 ? "block" : "none";
}

function openMovieViewer(movieId, movieName) {
  const movieData = dbMovies.find((m) => m.id === movieId);
  if (!movieData) return;

  currentMovieKey = movieId;
  currentSeqIdx = 0;
  navigateTo("viewer");

  document.getElementById("movie-title-display").innerText = movieName;
  document.getElementById("meta-director").innerText = movieData.meta.director;
  document.getElementById("meta-guion").innerText = movieData.meta.guion;
  document.getElementById("meta-foto").innerText = movieData.meta.foto;
  document.getElementById("meta-musica").innerText = movieData.meta.musica;
  document.getElementById("meta-duracion").innerText = movieData.meta.duracion;

  const navbar = document.getElementById("sequence-navbar");
  navbar.innerHTML = "";

  movieData.sequences.forEach((seq, idx) => {
    const btn = document.createElement("button");
    btn.className = "seq-btn";
    btn.innerText = seq.name;
    btn.onclick = () => loadSequence(idx);
    navbar.appendChild(btn);
  });
  loadSequence(0);
}

function loadSequence(idx) {
  if (isWorking) return;
  const movieData = dbMovies.find((m) => m.id === currentMovieKey);
  const seq = movieData.sequences[idx];
  currentSeqIdx = idx;

  document
    .querySelectorAll(".seq-btn")
    .forEach((btn) => btn.classList.remove("active"));
  // Buscar el botón activo (lógica simplificada para visualización)
  if (document.querySelectorAll(".seq-btn")[idx])
    document.querySelectorAll(".seq-btn")[idx].classList.add("active");

  const container = document.getElementById("video-frame-container");
  isWorking = true;

  // 1. ACTIVAR FADE OUT (Opacidad a 0)
  container.classList.add("is-fading");

  setTimeout(() => {
    // 2. CAMBIAR VIDEO (Mientras está invisible)
    container.innerHTML = `<iframe id="archive-iframe" src="${seq.url}" allowfullscreen="true" frameborder="0"></iframe>`;

    // 3. QUITAR FADE OUT (Opacidad a 1)
    setTimeout(() => {
      container.classList.remove("is-fading");
      isWorking = false;
    }, 300); // Esperar un poco para asegurar carga
  }, 400); // Duración de la transición CSS

  // Actualizar textos
  document.getElementById("analysis-heading").innerHTML = seq.title;
  // Texto principal (análisis)
  let htmlContent = `<div><p>${seq.text1}</p></div><div><p>${seq.text2}</p></div>`;

  // Si hay notas adicionales, las añade debajo
  if (seq.notas) {
    // Convierte los \n en saltos de línea HTML
    const notasHTML = seq.notas.replace(/\n/g, "<br>");
    htmlContent += `<div class="notas-secuencia"><h3>📝 Notas adicionales</h3><p>${notasHTML}</p></div>`;
  }

  document.getElementById("analysis-paragraph-container").innerHTML =
    htmlContent;

  const displayNum = String(idx + 1).padStart(2, "0");
  document.getElementById("meta-sec-index").innerText =
    `${displayNum} / ${String(movieData.sequences.length).padStart(2, "0")}`;
  document.getElementById("footer-counter-text").innerHTML =
    `Secuencia <span>${displayNum}</span> de ${String(movieData.sequences.length).padStart(2, "0")}`;

  document.getElementById("btn-prev-seq").disabled = idx === 0;
  document.getElementById("btn-next-seq").disabled =
    idx === movieData.sequences.length - 1;
}

function triggerPrevSeq() {
  if (currentSeqIdx > 0 && !isWorking) loadSequence(currentSeqIdx - 1);
}
function triggerNextSeq() {
  const movieData = dbMovies.find((m) => m.id === currentMovieKey);
  if (currentSeqIdx < movieData.sequences.length - 1 && !isWorking)
    loadSequence(currentSeqIdx + 1);
}
