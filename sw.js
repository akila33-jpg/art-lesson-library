// 離線快取：第一次打開後，沒有網路也能使用。改版時把 VERSION 加 1。
const VERSION = 'v4';
const CORE = ['./', 'index.html', 'assets/site.css', 'assets/app.js', 'data/lessons.json', 'manifest.webmanifest'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(CORE);
    try { const d = await (await fetch('data/lessons.json')).json();
      const imgs = new Set(); d.forEach(l => {
        [l.cover, l.diagram, l.deck&&l.deck.pdf, ...(l.handouts||[]).map(h=>h.src), ...(l.photos||[]).map(p=>`images/${l.id}/${p.file}`), ...((l.deck&&l.deck.slides)||[])].filter(Boolean).forEach(u => imgs.add(u));
      });
      await Promise.all([...imgs].map(u => c.add(u).catch(() => {})));
    } catch (_) {}
  }));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // 資料檔先抓網路（拿到最新教案），失敗時用快取；其他檔案先用快取。
  if (u.pathname.endsWith('lessons.json')) {
    e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
    return;
  }
  // 其他檔案：先給快取（快），同時在背景更新。
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(e.request, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
