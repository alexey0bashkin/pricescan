const CACHE_NAME = 'pricescan-v1';
const urlsToCache = [
    '.',
    'index.html',
    'style.css',
    'script.js',
    'manifest.json',
    'icons/icon-192.png',
    'icons/icon-512.png'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Активация
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Если есть в кэше - возвращаем
                if (response) {
                    return response;
                }
                // Иначе запрашиваем с сети
                return fetch(event.request).catch(() => {
                    // Если офлайн и нет кэша - показываем заглушку
                    return new Response('Офлайн режим', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
            })
    );
});