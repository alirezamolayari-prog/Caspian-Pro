/* Caspian Pro – web push handlers, loaded into the Workbox service worker. */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'کاسپین پرو', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'کاسپین پرو';
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, {
        body: data.body || '',
        icon: '/pwa-192.png',
        badge: '/pwa-192.png',
        dir: 'rtl',
        lang: 'fa',
        tag: data.tag,
        data: { url: data.url || '#/notifications' },
      }),
      // Open app windows refresh their lists right away.
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((list) => list.forEach((c) => c.postMessage({ type: 'caspian-push' }))),
    ]),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const hash = (event.notification.data && event.notification.data.url) || '#/notifications';
  const target = new URL('/' + hash, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (new URL(c.url).origin === self.location.origin && 'focus' in c) {
          c.navigate(target).catch(() => undefined);
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
