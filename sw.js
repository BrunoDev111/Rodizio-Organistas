const CACHE_NAME = 'rodizio-organistas-v5.0.0';
const urlsToCache = [
  './',
  './index.html',
  './style.css?v=5.0.0',
  './script.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Montserrat:wght@300;400;600;700&family=Cinzel:wght@600;700;800&family=Lato:wght@300;400;700&display=swap'
];

// Instalar o Service Worker
self.addEventListener('install', function(event) {
  console.log('🔧 Service Worker: Instalando versão 5.0.0...');
  // Força a ativação imediata
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('📦 Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.error('❌ Erro ao cachear arquivos:', error);
      })
  );
});

// Ativar o Service Worker
self.addEventListener('activate', function(event) {
  console.log('✅ Service Worker: Ativado versão 5.0.0');
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Força o controle imediato de todos os clientes
      return self.clients.claim();
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', function(event) {
  event.respondWith(
    // Sempre buscar da rede primeiro, depois cache
    fetch(event.request)
      .then(function(response) {
        // Verifica se recebemos uma resposta válida
        if(!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone a resposta para o cache
        var responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then(function(cache) {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(function() {
        // Fallback para cache se offline
        return caches.match(event.request)
          .then(function(response) {
            if (response) {
              return response;
            }
            
            // Fallback para página principal se necessário
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Notificações Push (opcional)
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'Nova atualização na escala!',
    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Crect width="192" height="192" fill="%236366f1"/%3E%3Ctext x="96" y="130" font-family="Arial" font-size="120" text-anchor="middle" fill="white"%3E🎵%3C/text%3E%3C/svg%3E',
    badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" fill="%236366f1"/%3E%3Ctext x="48" y="65" font-family="Arial" font-size="60" text-anchor="middle" fill="white"%3E🎵%3C/text%3E%3C/svg%3E',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore', 
        title: 'Ver Escala',
        icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="white" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/%3E%3C/svg%3E'
      },
      {
        action: 'close', 
        title: 'Fechar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Rodízio Organistas', options)
  );
});

// Click em notificações
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('./'));
  } else if (event.action === 'close') {
    event.notification.close();
  } else {
    event.waitUntil(clients.openWindow('./'));
  }
});

console.log('🎵 Service Worker do Rodízio Organistas v5.0.0 carregado!');