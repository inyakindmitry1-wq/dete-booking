/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';

// Clean up old caches
cleanupOutdatedCaches();

// Precaching assets injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache images and static assets per tenant (CacheFirst)
registerRoute(
  ({ request, url }) =>
    request.destination === 'image' ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webp'),
  new CacheFirst({
    cacheName: 'tenant-media-v1',
  })
);

// Cache fonts (CacheFirst)
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'tenant-fonts-v1',
  })
);

// IMPORTANT INVARIANT 6: DO NOT cache owner / private data or auth requests!
registerRoute(
  ({ url }) =>
    url.pathname.includes('/owner') ||
    url.pathname.includes('/auth') ||
    url.pathname.includes('/payments'),
  new NetworkFirst({
    cacheName: 'no-private-cache',
    networkTimeoutSeconds: 5,
  })
);

// Listen for message events (e.g. skip waiting or clear private caches upon owner logout)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_PRIVATE_CACHE') {
    // Purge any transient runtime caches when owner logs out
    caches.delete('no-private-cache');
  }
});

// Push notification handling for Web Push outbox
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Новое уведомление';
    const options: NotificationOptions = {
      body: data.body || '',
      icon: data.icon || '/favicon.svg',
      badge: '/favicon.svg',
      data: {
        url: data.url || '/',
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Failed to parse push notification payload', err);
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
