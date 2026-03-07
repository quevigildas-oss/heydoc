// sw.js — Service Worker Dokita
// Gère le cache et les mises à jour automatiques

const CACHE_NAME = 'dokita-v1';

// Installation — ne pas mettre en cache, toujours charger depuis le réseau
self.addEventListener('install', function(e) {
  self.skipWaiting();
});

// Activation — supprimer les anciens caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — réseau en priorité, cache en fallback
self.addEventListener('fetch', function(e) {
  // Ne pas intercepter les appels API
  if (e.request.url.includes('/api/')) return;

  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        // Mettre en cache la nouvelle version
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        // Pas de réseau — utiliser le cache
        return caches.match(e.request);
      })
  );
});
