// オフラインでも動くように、ゲームのファイルをiPadに保存しておく
// ・ネットにつながっているときは、いつも最新のプログラムを取りにいく（更新がすぐ反映される）
// ・つながっていないときは、保存しておいたものを使う
const VERSION = 'cq-v38';
const BG_FILES = ['endogame-adventure', 'hero', 'title', 'hub', 'study', 'select', 'build-day', 'build-sunset', 'build-night', 'exchange', 'ghosts', 'workshop', 'habitat-jungle', 'habitat-volcano', 'habitat-coast']
  .map(n => `./bg/${n}.jpg`);
const CASTLE_FILES = ['himeji', 'neuschwanstein', 'windsor', 'montsaintmichel', 'edinburgh', 'alhambra', 'chambord', 'hearst', 'forbiddencity', 'pena', 'tsuruga']
  .map(id => `./js/diorama/castles/${id}.js`);
const LOCAL = [
  './', './index.html', './rally.html', './manifest.webmanifest', './css/style.css',
  './js/main.js', './js/store.js', './js/words.js', './js/quiz.js', './js/review.js',
  './js/speech.js', './js/sfx.js', './js/castles.js', './js/photos.js', './js/sentences.js', './js/math.js', './js/letters.js', './js/drawpad.js', './js/lettersGame.js', './papa.html', './js/papa.js', './js/diorama/engine.js', ...CASTLE_FILES,
  './js/dinoGame.js', './js/dinos.js', './js/dino/view.js', './js/dino/trex.js', './js/dino/dinoBase.js', './js/dino/look.js',
  './cards/dino-trex.jpg', './cards/dino-trex-baby.jpg',
  './cards/dino-care.jpg', './cards/santa.jpg', './cards/santa-card.jpg', './cards/rally-card.jpg', './cards/rally-chibi.jpg', './cards/rally-taxi.jpg', './cards/rally-truck.jpg', './cards/rally-police.jpg', './cards/rally-ambulance.jpg', './cards/rally-bus.jpg', './cards/rally-fire.jpg', './cards/rally-sports.jpg', './cards/rally-monster.jpg', './cards/rally-camper.jpg', './cards/rally-racer.jpg', './cards/rally-rocket.jpg', './cards/rally-limo.jpg', './cards/rally-rainbow.jpg', './cards/rally-star.jpg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', ...BG_FILES,
];
const CDN = [
  'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js',
  'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/utils/BufferGeometryUtils.js',
  'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/environments/RoomEnvironment.js',
];

self.addEventListener('install', e => {
  // ブラウザの一時保存（古いファイル）を使わず、必ず新しく取りにいく
  e.waitUntil(caches.open(VERSION)
    .then(c => Promise.all([...LOCAL, ...CDN].map(u => fetch(new Request(u, { cache: 'reload' })).then(r => r.ok && c.put(u, r)).catch(() => {}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && !k.startsWith('cq-photos')).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const isCode = url => /\.(html|js|css|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(e.request, { ignoreSearch: true });
    // プログラム（同じサイトのhtml/js/css）は、ネット優先
    if (url.origin === location.origin && isCode(url)) {
      try {
        const res = await fetch(e.request, { cache: 'no-cache' });
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      } catch (err) {
        return hit || Response.error();
      }
    }
    // 画像・写真・3Dの部品は、保存したものを先に使う（速い）
    if (hit) return hit;
    try {
      const res = await fetch(e.request);
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    } catch (err) {
      return Response.error();
    }
  }));
});
