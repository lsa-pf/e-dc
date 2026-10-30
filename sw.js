// e-DC (écran du Directeur de course) — mise en cache pour s'ouvrir même sans réseau.
// Changer VERSION à chaque mise à jour de la page pour que les appareils la récupèrent.
const VERSION = 'e-dc-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Réseau d'abord (dernière version), cache si pas de réseau.
// Seuls les fichiers de la page et le SDK Firebase (www.gstatic.com) sont mis en cache.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const mine = url.origin === self.location.origin, sdk = url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/');
  if (!mine && !sdk) return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)).catch(() => {}); }
      return r;
    }).catch(() => caches.match(e.request).then(m => m || (mine ? caches.match('./index.html') : Response.error())))
  );
});
