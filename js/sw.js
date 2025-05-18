const CACHE_NAME = 'mindmap-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/css/style.css',
  '/css/bootstrap.min.css',
  '/js/app.js',
  '/js/jquery.min.js',
  '/js/bootstrap.bundle.min.js',
  '/icons/favicon-32x32.png',
  '/icons/apple-touch-icon.png',
  '/images/morning-meditation.jpg',
  '/images/night-meditation.jpg',
  '/images/user-avatar.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/icons/apple-touch-icon.png',
    badge: '/icons/favicon-32x32.png'
  };
  
  event.waitUntil(
    self.registration.showNotification('MindMap Reminder', options)
  );
});