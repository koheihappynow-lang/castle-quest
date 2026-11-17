// オフラインでも動くように、ゲームのファイルをiPadに保存しておく
// ・プログラム（html/js/css）：ネット優先（更新がすぐ反映）。ネットが おそい・ない ときは 保存した もの
// ・画像・3Dモデル：保存した ものを すぐ 使い、うらで 新しい ものが ないか 確かめる。
//   画像の 保存場所（ASSETS）は 版を あげても けさない → 更新の たびに 全部 とりなおさない（起動が はやい）
const VERSION = 'cq-v42';
const ASSETS = 'cq-assets-v1';
const BG_FILES = ['endogame-adventure', 'hero', 'title', 'hub', 'study', 'select', 'build-day', 'build-sunset', 'build-night', 'exchange', 'ghosts', 'workshop', 'habitat-jungle', 'habitat-volcano', 'habitat-coast']
  .map(n => `./bg/${n}.jpg`);
const CASTLE_FILES = ['himeji', 'neuschwanstein', 'windsor', 'montsaintmichel', 'edinburgh', 'alhambra', 'chambord', 'hearst', 'forbiddencity', 'pena', 'tsuruga']
  .map(id => `./js/diorama/castles/${id}.js`);
const CODE = [
  './', './index.html', './rally.html', './manifest.webmanifest', './css/style.css',
  './js/main.js', './js/store.js', './js/words.js', './js/quiz.js', './js/review.js',
  './js/speech.js', './js/sfx.js', './js/castles.js', './js/photos.js', './js/sentences.js', './js/math.js', './js/letters.js', './js/drawpad.js', './js/lettersGame.js', './papa.html', './js/papa.js', './js/diorama/engine.js', ...CASTLE_FILES,
  './js/dinoGame.js', './js/dinos.js', './js/dino/view.js', './js/dino/trex.js', './js/dino/dinoBase.js', './js/dino/look.js', './js/dino/rig.js',
];
const RALLY = ['chibi', 'taxi', 'truck', 'police', 'ambulance', 'bus', 'fire', 'sports', 'monster', 'camper', 'racer', 'rocket', 'limo', 'rainbow', 'star'].map(id => `./cards/rally-${id}.jpg`);
const IMAGES = [
  './cards/himeji.jpg', './cards/dino-trex.jpg', './cards/dino-trex-baby.jpg', './cards/dino-care.jpg', './cards/santa.jpg', './cards/santa-card.jpg', './cards/rally-card.jpg', ...RALLY,
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', ...BG_FILES,
];
const CDN = [
  'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js',
  'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/utils/BufferGeometryUtils.js',
  'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/environments/RoomEnvironment.js',
  'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js',
];

self.addEventListener('install', e => {
  // プログラムだけ 新しく とる（かるい）。画像は まだ ない ものだけ（あとで うらで）
  e.waitUntil(caches.open(VERSION)
    .then(c => Promise.all(CODE.map(u => fetch(new Request(u, { cache: 'reload' })).then(r => r.ok && c.put(u, r)).catch(() => {}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== ASSETS && !k.startsWith('cq-photos')).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
    .then(() => { fillAssets(); }));
});
// 画像・3Dの 部品で まだ 保存して いない ものを うらで あつめる
async function fillAssets() {
  const c = await caches.open(ASSETS);
  for (const u of [...IMAGES, ...CDN]) {
    try { if (!(await c.match(u))) { const r = await fetch(u); if (r.ok) await c.put(u, r); } } catch (e) {}
  }
}

const isCode = url => url.origin === location.origin && (/\.(html|js|css|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/'));
// ネットが おそい ときは 2.5びょうで あきらめて 保存した ものを つかう
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // ほかの サイト（おてがみサーバー など）は さわらない。ほぞんするのは 3Dの 部品（jsdelivr）だけ
  if (url.origin !== location.origin && !url.hostname.endsWith('jsdelivr.net')) return;
  if (isCode(url)) {
    e.respondWith(caches.open(VERSION).then(async cache => {
      const hit = await cache.match(e.request, { ignoreSearch: true });
      const net = fetch(e.request, { cache: 'no-cache' }).then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; });
      try { return await withTimeout(net, hit ? 2500 : 15000); }
      catch (err) { return hit || net.catch(() => Response.error()); }
    }));
    return;
  }
  // 画像・3Dの 部品：保存した ものを すぐ かえし、うらで 新しく する
  e.respondWith(caches.open(ASSETS).then(async cache => {
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    try { return await net; } catch (err) { return Response.error(); }
  }));
});
