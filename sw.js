// オフラインでも動くように、ゲームのファイルをiPadに保存しておく
// ・プログラム（html/js/css）：保存した ものを すぐ 使う。新しい 版は sw.js が かわると まとめて とりなおして 入れかわる
// ・画像・3Dモデル・写真：「中身の 指紋」（asset-hashes.js）つきで 保存。指紋が おなじ あいだは ネットに いかない（はやい）。
//   絵を さしかえると 指紋が かわるので、自動で とりなおす。版を あげても 画像は けさない（更新が かるい）
//   公開の まえに node tools/release.cjs（指紋の 作りなおし＋版あげ）
try { importScripts('./asset-hashes.js'); } catch (e) {}
const HASH = self.ASSET_HASH || {};
const SCOPE = new URL('./', self.location).pathname;
const VERSION = 'cq-v81';
const ASSETS = 'cq-assets-v2';
const BG_FILES = ['top', 'dino-study', 'dino-result', 'dino-exchange', 'dino-home', 'dino-nest', 'dino-shop', 'dino-zukan', 'santa', 'papa', 'rest', 'night', 'endogame-adventure', 'hero', 'title', 'hub', 'study', 'select', 'build-day', 'build-sunset', 'build-night', 'exchange', 'ghosts', 'workshop', 'habitat-jungle', 'habitat-volcano', 'habitat-coast']
  .map(n => `./bg/${n}.jpg`);
const CASTLE_FILES = ['himeji', 'neuschwanstein', 'windsor', 'montsaintmichel', 'edinburgh', 'alhambra', 'chambord', 'hearst', 'forbiddencity', 'pena', 'tsuruga']
  .map(id => `./js/diorama/castles/${id}.js`);
const CODE = [
  './', './index.html', './rally.html', './toride.html', './manifest.webmanifest', './css/style.css',
  './js/main.js', './js/store.js', './js/words.js', './js/quiz.js', './js/review.js',
  './js/speech.js', './js/sfx.js', './js/castles.js', './js/photos.js', './js/sentences.js', './js/math.js', './js/puzzle.js', './js/easy.js', './js/watch.js', './js/shadow.js', './js/shadowItems.js', './js/letters.js', './js/drawpad.js', './js/lettersGame.js', './papa.html', './papa.webmanifest', './js/papa.js', './js/diorama/engine.js', ...CASTLE_FILES,
  './asset-hashes.js', './js/version.js', './js/dinoGame.js', './js/dinos.js', './js/dino/view.js', './js/dino/trex.js', './js/dino/dinoBase.js', './js/dino/look.js', './js/dino/rig.js',
];
const RALLY = ['chibi', 'taxi', 'truck', 'police', 'ambulance', 'bus', 'fire', 'sports', 'monster', 'camper', 'racer', 'rocket', 'limo', 'rainbow', 'star'].map(id => `./cards/rally-${id}.jpg`);
const TORIDE = ['tsuruga.jpg', 'map2.jpg', 'map3.jpg', 'map4.jpg', 'map5.jpg', 'map6.jpg', 'hero.png', 'foe.png', 'boss.png', 'yagura.png', 'ozutsu.png'].map(f => `./cards/toride-${f}`);
const IMAGES = [
  './cards/himeji.jpg', './cards/dino-trex.jpg', './cards/dino-trex-baby.jpg', './cards/dino-care.jpg', './cards/santa.jpg', './cards/santa-card.jpg', './cards/rally-card.jpg', ...RALLY, ...TORIDE,
  ...['english', 'math', 'puzzle', 'review', 'castle', 'exchange', 'ghostbook', 'dinobook', 'shop', 'care', 'egg'].map(n => `./icons/ui/icon-${n}.png`), './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', ...BG_FILES,
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
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== ASSETS).map(k => caches.delete(k))))
    .then(pruneAssets)
    .then(() => self.clients.claim())
    .then(() => { fillAssets(); }));
});
// 保存する ときの 名前（指紋つき）
function assetKey(url) {
  const rel = url.pathname.startsWith(SCOPE) ? decodeURIComponent(url.pathname.slice(SCOPE.length)) : '';
  return HASH[rel] ? url.origin + url.pathname + '?h=' + HASH[rel] : url.origin + url.pathname;
}
// 指紋が かわった（さしかえた）古い 画像を けす
async function pruneAssets() {
  const c = await caches.open(ASSETS);
  for (const req of await c.keys()) {
    const u = new URL(req.url);
    if (u.origin !== location.origin) continue;
    if (req.url !== assetKey(u) || (u.searchParams.get('h') && !Object.values(HASH).includes(u.searchParams.get('h')))) await c.delete(req);
  }
}
// まだ 保存して いない 絵を うらで あつめる（写真は main.js が 1日1かい すこしずつ）
async function fillAssets() {
  const c = await caches.open(ASSETS);
  for (const u of [...IMAGES.map(p => new URL(p, self.location).href), ...CDN]) {
    try { const key = u.startsWith(location.origin) ? assetKey(new URL(u)) : u; if (!(await c.match(key))) { const r = await fetch(u, { cache: 'reload' }); if (r.ok) await c.put(key, r); } } catch (e) {}
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
  // 画像・3Dの 部品・写真：指紋つきで 保存した ものを つかう（ない／さしかえた ときだけ とりにいく）
  const key = url.origin === location.origin ? assetKey(url) : e.request.url;
  e.respondWith(caches.open(ASSETS).then(async cache => {
    const hit = await cache.match(key);
    if (hit) return hit;
    try { const res = await fetch(url.origin === location.origin ? new Request(url.origin + url.pathname, { cache: 'reload' }) : e.request); if (res.ok) cache.put(key, res.clone()); return res; }
    catch (err) { return Response.error(); }
  }));
});

// ---------- 通知（こどもから おてがみが きた） ----------
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || '📮 おてがみが きたよ', {
    body: d.body || '', tag: d.tag || 'endogame', renotify: true,
    icon: './icons/icon-192.png', badge: './icons/icon-192.png', data: { url: d.url || 'papa.html' },
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || 'papa.html', self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if (c.url.includes('papa.html') && 'focus' in c) return c.focus();
    return clients.openWindow(url);
  }));
});
