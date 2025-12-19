import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  ({ request }) => request.url.endsWith('.json'),
  new NetworkFirst({ cacheName: 'json-cache', networkTimeoutSeconds: 3 })
);

self.addEventListener('install', () => {
  self.skipWaiting();
});

const NOTIFICATIONS_URL = '/notifications.json';
const SHOWN_NOTIFICATIONS_KEY = 'toxi_shown_notifications';
const CHECK_INTERVAL = 60000;

function getShownNotifications() {
  try {
    const data = self.localStorage?.getItem(SHOWN_NOTIFICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function checkScheduledNotifications() {
  try {
    const response = await fetch(NOTIFICATIONS_URL + '?t=' + Date.now());
    if (!response.ok) return;
    
    const notifications = await response.json();
    const now = Date.now();
    
    const clients = await self.clients.matchAll({ type: 'window' });
    
    for (const notif of notifications) {
      const notifTime = new Date(notif.datetime).getTime();
      const timeDiff = now - notifTime;
      
      if (timeDiff >= 0 && timeDiff < CHECK_INTERVAL + 5000) {
        let shownIds = [];
        if (clients.length > 0) {
          const client = clients[0];
          const msgChannel = new MessageChannel();
          const shownPromise = new Promise(resolve => {
            msgChannel.port1.onmessage = (e) => resolve(e.data || []);
            setTimeout(() => resolve([]), 1000);
          });
          client.postMessage({ type: 'GET_SHOWN_NOTIFICATIONS' }, [msgChannel.port2]);
          shownIds = await shownPromise;
        }
        
        if (!shownIds.includes(notif.id)) {
          await self.registration.showNotification(notif.title || 'TOXI Media', {
            body: notif.body || '',
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: notif.id,
            data: { url: notif.url || '/' },
            requireInteraction: true
          });
          
          if (clients.length > 0) {
            clients[0].postMessage({ type: 'MARK_NOTIFICATION_SHOWN', id: notif.id });
          }
        }
      }
    }
  } catch (err) {
    console.error('[SW] Error checking notifications:', err);
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.includes('workbox-precache')) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

setInterval(checkScheduledNotifications, CHECK_INTERVAL);
checkScheduledNotifications();
