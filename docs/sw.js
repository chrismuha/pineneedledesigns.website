const UPDATE_NOTIFICATION_TAG = 'pine-needle-app-update';
const UPDATE_STATE_CACHE = 'pine-needle-update-state';
const UPDATE_STATE_URL = '/__pine-needle-update-available__';
const UPDATE_NOTIFICATION_SHOWN_URL = '/__pine-needle-update-notification-shown__';
let updateAvailable = false;

const setUpdateState = async (available) => {
  updateAvailable = available;
  const cache = await caches.open(UPDATE_STATE_CACHE);
  if (available) await cache.put(UPDATE_STATE_URL, new Response('waiting'));
  else {
    await cache.delete(UPDATE_STATE_URL);
    await cache.delete(UPDATE_NOTIFICATION_SHOWN_URL);
  }
};

const hasWaitingUpdate = async () => (
  updateAvailable || Boolean(await caches.match(UPDATE_STATE_URL, { cacheName: UPDATE_STATE_CACHE }))
);

const clearBadgeWhenAppOpens = async () => {
  const notifications = await self.registration.getNotifications();
  notifications
    .filter((notification) => notification.data?.type !== 'app-update')
    .forEach((notification) => notification.close());

  // An update is the one alert that remains unread until it is installed.
  if (await hasWaitingUpdate()) await self.navigator?.setAppBadge?.(1);
  else await self.navigator?.clearAppBadge?.();
};

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'APP_OPENED') {
    event.waitUntil(clearBadgeWhenAppOpens());
  }
  if (event.data?.type === 'SET_UPDATE_AVAILABLE') {
    event.waitUntil((async () => {
      await setUpdateState(true);
      await showUpdateNotification();
    })());
  }
  if (event.data?.type === 'CLEAR_UPDATE_AVAILABLE') {
    event.waitUntil((async () => {
      await setUpdateState(false);
      await clearUpdateNotification();
    })());
  }
});

self.addEventListener('activate', (event) => {
  // An activating worker is the installed update, so its update alert is done.
  event.waitUntil((async () => {
    await setUpdateState(false);
    await clearUpdateNotification();
    await self.clients.claim();
  })());
});

// Replaced with a unique value during every production build so installed
// copies can reliably detect a deployment even when this source is unchanged.
const BUILD_ID = '2026-07-20T02:53:05.864Z';

const updateAppBadge = async (excludedTag = '') => {
  if (!self.navigator?.setAppBadge) return;
  const notifications = await self.registration.getNotifications();
  const visibleCount = notifications.filter((notification) => notification.tag !== excludedTag).length;
  const badgeCount = Math.max(visibleCount, await hasWaitingUpdate() ? 1 : 0);
  if (badgeCount) await self.navigator.setAppBadge(badgeCount);
  else if (self.navigator.clearAppBadge) await self.navigator.clearAppBadge();
};

const showUpdateNotification = async () => {
  const notificationAlreadyShown = Boolean(await caches.match(
    UPDATE_NOTIFICATION_SHOWN_URL,
    { cacheName: UPDATE_STATE_CACHE },
  ));
  if (Notification.permission === 'granted' && !notificationAlreadyShown) {
    await self.registration.showNotification('App update available', {
      body: 'Open the app and install the update to clear this alert.',
      badge: '/pwa-icon-192.png',
      icon: '/pwa-icon-192.png',
      tag: UPDATE_NOTIFICATION_TAG,
      renotify: false,
      requireInteraction: true,
      data: { url: '/dashboard', type: 'app-update' },
    });
    const cache = await caches.open(UPDATE_STATE_CACHE);
    await cache.put(UPDATE_NOTIFICATION_SHOWN_URL, new Response('shown'));
  }
  await updateAppBadge();
};

const clearUpdateNotification = async () => {
  const notifications = await self.registration.getNotifications({ tag: UPDATE_NOTIFICATION_TAG });
  notifications.forEach((notification) => notification.close());
  await updateAppBadge(UPDATE_NOTIFICATION_TAG);
};

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = { body: event.data?.text() || '' };
  }

  event.waitUntil((async () => {
    await self.registration.showNotification(data.title || 'Store update', {
      body: data.body || 'You have a new store update.',
      badge: '/pwa-icon-192.png',
      icon: data.icon || '/pwa-icon-192.png',
      // iOS/iPadOS web apps use the system notification sound when silent is false.
      // Web Push cannot package or select a custom audio file.
      silent: false,
      tag: data.tag || 'pine-needle-update',
      data: { url: data.url || '/dashboard', type: data.type || 'store-update' },
    });
    await updateAppBadge();
  })());
});

self.addEventListener('notificationclick', (event) => {
  const isAppUpdate = event.notification.data?.type === 'app-update';
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/dashboard', self.location.origin).href;

  event.waitUntil((async () => {
    await updateAppBadge(isAppUpdate ? '' : event.notification.tag);
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      await existing.navigate(targetUrl);
      return existing.focus();
    }
    return self.clients.openWindow(targetUrl);
  })());
});

self.addEventListener('notificationclose', (event) => {
  event.waitUntil((async () => {
    await updateAppBadge(event.notification.tag);
  })());
});
