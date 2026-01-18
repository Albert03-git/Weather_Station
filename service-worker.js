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

self.addEventListener('fetch', event => {
    // Jeśli zapytanie dotyczy danych z ThingSpeak, pobieraj ZAWSZE z sieci (nie z cache)
    if (event.request.url.includes('api.thingspeak.com')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                // Jeśli nie ma internetu, spróbuj jednak poszukać w cache (awaryjnie)
                return caches.match(event.request);
            })
        );
    } else {
        // Dla plików strony (style, ikony) stosuj standardowy cache
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request);
            })
        );
    }
});
