const CACHE_NAME = "phrasebook-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/src/main.tsx",
  "/src/App.css",
  "/src/components/SearchBar.tsx",
  "/src/components/PhraseList.tsx",
  "/src/components/AddPhraseForm.tsx"
];

// Installera Service Worker och cacha resurser
self.addEventListener("install", (event: any) => {
  console.log("[Service Worker] Install event");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching app shell");
      return cache.addAll(urlsToCache);
    })
  );
});

// Hantera nätverksförfrågningar
self.addEventListener("fetch", (event: any) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log("[Service Worker] Returning cached resource:", event.request.url);
        return response;
      }
      console.log("[Service Worker] Fetching resource:", event.request.url);
      return fetch(event.request);
    })
  );
});

// Aktivera Service Worker och rensa gammal cache
self.addEventListener("activate", (event: any) => {
  console.log("[Service Worker] Activate event");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
