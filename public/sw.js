const CACHE_NAME = 'screenrecorder-studio-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through fetch for studio app assets
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
