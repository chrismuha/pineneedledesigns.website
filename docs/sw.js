self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Replaced with a unique value during every production build so installed
// copies can reliably detect a deployment even when this source is unchanged.
const BUILD_ID = '2026-07-17T17:52:42.452Z';

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = { body: event.data?.text() || '' };
  }

  event.waitUntil(self.registration.showNotification(
    data.title || 'Pine Needle Designs',
    {
      body: data.body || 'You have a new store update.',
      badge: '/pwa-icon-192.png',
      icon: '/pwa-icon-192.png',
      tag: data.tag || 'pine-needle-update',
      data: { url: data.url || '/dashboard' },
    },
  ));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/dashboard', self.location.origin).href;

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      await existing.navigate(targetUrl);
      return existing.focus();
    }
    return self.clients.openWindow(targetUrl);
  })());
});
