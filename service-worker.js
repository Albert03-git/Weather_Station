const CACHE_NAME = 'temperatura-pwa-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
    // Dodaj wszystkie zasoby, które chcesz buforować
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Otwarto cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - zwracamy zasób z cache
                if (response) {
                    return response;
                }
                // Jeśli brak w cache, pobieramy z sieci
                return fetch(event.request).catch(() => {
                    // Jeśli nie ma sieci i nie ma w cache, możesz zwrócić stronę offline
                    // return caches.match('/offline.html'); // Musiałbyś stworzyć taki plik
                });
            })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});