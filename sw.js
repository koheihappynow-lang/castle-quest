// オフラインでも動くように、ゲームのファイルをiPadに保存しておく
// ゲームを更新したら VERSION を上げる
const VERSION = 'cq-v3';
const CASTLE_FILES = ['himeji', 'neuschwanstein', 'windsor', 'montsaintmichel', 'edinburgh', 'alhambra', 'chambord', 'hearst', 'forbiddencity', 'pena', 'tsuruga']
  .map(id => `./js/diorama/castles/${id}.js`);
const LOCAL = [
  './', './index.html', './manifest.webmanifest', './css/style.css',
  './js/main.js', './js/store.js', './js/words.js', './js/quiz.js', './js/review.js',
  './js/speech.js', './js/sfx.js', './js/castles.js', './js/photos.js', './js/diorama/engine.js', ...CASTLE_FILES,
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
];
const CDN = [
  'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js',
  'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/utils/BufferGeometryUtils.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll([...LOCAL, ...CDN])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && !k.startsWith('cq-photos')).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// 保存したものをすぐ使い、裏で新しいものを取りにいく
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(res => {
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
