const CACHE_NAME = 'rodizio-organistas-v5.10.0';
const urlsToCache = [
  './',
  './index.html',
  './style.css?v=5.10.0',
  './schedule.js?v=5.10.0',
  './script.js?v=5.10.0',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Montserrat:wght@300;400;600;700&family=Cinzel:wght@600;700;800&family=Lato:wght@300;400;700&display=swap'
];

// Instalar o Service Worker
self.addEventListener('install', function(event) {
  console.log('🔧 Service Worker: Instalando...');
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
  console.log('✅ Service Worker: Ativado');
  
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
  // Funções do Netlify (push) e requisições que não são GET não passam pelo cache
  if (event.request.method !== 'GET' || new URL(event.request.url).pathname.startsWith('/.netlify/')) return;

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

// Lembrete enviado pelo servidor (netlify/functions/push-send-reminders): { title, body }
self.addEventListener('push', function(event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Rodízio Organistas', {
      body: data.body || 'Nova atualização na escala!',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      vibrate: [200, 100, 200]
    })
  );
});

// Tocar na notificação abre o app (ou traz para frente se já estiver aberto)
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windows) {
      const open = windows.find(function(w) { return 'focus' in w; });
      return open ? open.focus() : clients.openWindow('./');
    })
  );
});

console.log('🎵 Service Worker do Rodízio Organistas carregado!');
