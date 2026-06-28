// Sout Al-Balad Push Service Worker
self.addEventListener('install', (e) => self.skipWaiting);
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim));

self.addEventListener('push', (event) => {
 let data = {};
 try { data = event.data ? event.data.json : {}; } catch { data = { title: 'صوت البلد', body: event.data?.text || 'خبر جديد' }; }
 const title = data.title || 'صوت البلد';
 const options = {
 body: data.body || 'خبر جديد',
 icon: data.icon || '/images/logo.png',
 badge: '/images/logo.png',
 image: data.image,
 tag: data.tag || 'news',
 data: { url: data.url || '/' },
 dir: 'rtl',
 lang: 'ar',
 requireInteraction: !!data.breaking,
 vibrate: data.breaking ? [200, 100, 200, 100, 200] : [100, 50, 100],
 };
 event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
 event.notification.close;
 const url = event.notification.data?.url || '/';
 event.waitUntil((async => {
 const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
 for (const c of all) {
 if ('focus' in c) { c.navigate(url); return c.focus; }
 }
 if (self.clients.openWindow) return self.clients.openWindow(url);
 }));
});
