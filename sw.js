// sw.js
const CACHE_NAME = "guionico-v2"; //  CAMBIA ESTE NÚMERO (v1, v2, v3...) EN CADA DEPLOY

// Archivos estáticos que SÍ se cachean (CSS, JS, imágenes)
const STATIC_ASSETS = [
  "/html/index.html",
  "/css/main.css",
  "/js/app.js",
  "/assets/img/logo.png", 
   '/html/index.html',
  '/css/main.css',
  '/js/app.js',
  '/manifest.json',
  '/assets/icons/favicon-32x32.png',
  '/assets/icons/apple-touch-icon.png',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
];
  
  // Añade
  //  aquí tus imágenes fijas si quieres


// 1️⃣ INSTALACIÓN: Guarda los archivos estáticos en caché
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting(); // Fuerza la activación inmediata sin esperar a cerrar pestañas
});

// 2️⃣ ACTIVACIÓN: Borra cachés viejas para liberar espacio
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clientsClaim(); // Toma el control de todas las pestañas abiertas al instante
});

// 3️⃣ PETICIONES: Estrategia inteligente
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 🚨 HTML y JSON SIEMPRE de RED (para que vean películas nuevas al instante)
  if (
    event.request.destination === "document" ||
    url.pathname.endsWith(".json")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 📦 CSS, JS e IMÁGENES: CACHE FIRST (rápido y offline)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          // Guarda en caché lo que venga de red para la próxima visita
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
      );
    }),
  );
});
