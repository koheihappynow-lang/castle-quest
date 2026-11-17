// オフラインでも動くように、ゲームのファイルをiPadに保存しておく
// ・プログラム（html/js/css）：保存した ものを すぐ 使う。新しい 版は sw.js が かわると まとめて とりなおして 入れかわる
// ・画像・3Dモデル：保存した ものを すぐ 使い、うらで 新しい ものが ないか 確かめる。
//   画像の 保存場所（ASSETS）は 版を あげても けさない → 更新の たびに 全部 とりなおさない（起動が はやい）
//   ※ 画像を さしかえた ときは ASSETS の 番号を あげる（cq-assets-v2 …）
const VERSION = 'cq-v45';
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

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // ほかの サイト（おてがみサーバー など）は さわらない。ほぞんするのは 3Dの 部品（jsdelivr）だけ
  if (url.origin !== location.origin && !url.hostname.endsWith('jsdelivr.net')) return;
  // プログラム：ほぞんした ものを すぐ つかう（あたらしい 版は sw.js の こうしんで まとめて いれかわる）
  if (isCode(url)) {
    e.respondWith(caches.open(VERSION).then(async cache => {
      const hit = await cache.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
      try { const res = await fetch(e.request); if (res.ok) cache.put(e.request, res.clone()); return res; }
      catch (err) { return Response.error(); }
    }));
    return;
  }
  // 画像・3Dの 部品：保存した ものを つかう（ない ときだけ とりにいく）。絵を さしかえた ときは ASSETS の 名前を かえる
  e.respondWith(caches.open(ASSETS).then(async cache => {
    const hit = await cache.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    try { const res = await fetch(e.request); if (res.ok) cache.put(e.request, res.clone()); return res; }
    catch (err) { return Response.error(); }
  }));
});
