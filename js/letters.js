// EndoGame の おてがみ（サンタさん・パパ）の ほぞんと おくりとどけ
// ・メッセージは この端末の IndexedDB に ほぞん（声は Blob のまま）
// ・おうちのひとメニューで サーバー（Cloudflare Worker）と「かぞくの かぎ」を せっていすると、
//   パパの スマホ（papa.html）と やりとりできる。サーバーが ない ときは この端末の なかだけ。
// メッセージ：{ id, kidId, kidName, thread:'santa'|'papa', from:'kid'|'papa'|'santa', text, hasAudio, mime, ts, u, heard, synced }

const CFG_KEY = 'endogame.letters';
// かぞくの サーバー（アドレスは ひみつでは ない。よむには「かぞくの かぎ」が いる）
export const DEFAULT_SERVER = 'https://endogame-letters.endogame-kids.workers.dev';
function rawCfg() { try { return JSON.parse(localStorage.getItem(CFG_KEY) || '{}'); } catch (e) { return {}; } }
export function getCfg() { const c = rawCfg(); if (!c.server) c.server = DEFAULT_SERVER; return c; }
export function setCfg(c) { localStorage.setItem(CFG_KEY, JSON.stringify({ ...rawCfg(), ...c })); }
export const online = () => !!getCfg().key;
// 「かんたん せっていの リンク」か かぎ そのものから { s, k } を とりだす
export function parseSetup(text) {
  const t = String(text || '').trim();
  const m = t.match(/#setup=([A-Za-z0-9_-]+)/);
  if (m) { try { const o = JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g, '+').replace(/_/g, '/'))))); if (o.k) return { s: o.s || DEFAULT_SERVER, k: o.k }; } catch (e) {} }
  return t ? { s: DEFAULT_SERVER, k: t } : null;
}
// この 端末の なまえ（おうちのひとが かえられる）
export function deviceName() {
  try { const n = localStorage.getItem('endogame.deviceName'); if (n) return n; } catch (e) {}
  const ua = navigator.userAgent;
  const ipad = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (ipad) return 'iPad';
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/Android/.test(ua)) return 'Android';
  const br = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : '';
  return (/Mac/.test(ua) ? 'Mac' : 'PC') + (br ? '・' + br : '');
}
export function setDeviceName(n) { try { if (n) localStorage.setItem('endogame.deviceName', n.slice(0, 20)); else localStorage.removeItem('endogame.deviceName'); } catch (e) {} }
// こどもは「なまえ」で まとめる（ちがう 端末でも おなじ なまえなら おなじ こ）
export const nameKey = s => String(s || '').trim().toLowerCase();
const isKid = (m, kid) => m.kidId !== '*' && (m.kidId === kid.id || nameKey(m.kidName) === nameKey(kid.name));
const base = () => getCfg().server.replace(/\/+$/, '');

// ---------- IndexedDB ----------
let dbp;
function idb() {
  return dbp ||= new Promise((res, rej) => {
    const r = indexedDB.open('endogame-letters', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('msgs', { keyPath: 'id' }); r.result.createObjectStore('audio'); };
    r.onsuccess = () => { const d = r.result; d.onversionchange = () => { d.close(); dbp = null; }; res(d); }; r.onerror = () => { dbp = null; rej(r.error); };
  });
}
const reqP = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function st(name, mode = 'readonly') { return (await idb()).transaction(name, mode).objectStore(name); }
export async function allMsgs() { return (await reqP((await st('msgs')).getAll())).sort((a, b) => a.ts - b.ts); }
async function getMsg(id) { return reqP((await st('msgs')).get(id)); }
async function putMsg(m) { return reqP((await st('msgs', 'readwrite')).put(m)); }
async function getAudio(id) { return reqP((await st('audio')).get(id)); }
async function putAudio(id, blob) { return reqP((await st('audio', 'readwrite')).put(blob, id)); }

// kid：{ id, name }（ぼうけんしゃ）
export async function thread(kid, th) { return (await allMsgs()).filter(m => isKid(m, kid) && m.thread === th); }
// まだ きいていない へんじの かず { santa: n, papa: n }
export async function unheard(kid) {
  const out = { santa: 0, papa: 0 };
  for (const m of await allMsgs()) if (isKid(m, kid) && m.from !== 'kid' && !m.heard) out[m.thread]++;
  return out;
}

const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
// kind：'greet'（サンタの あいさつ）／'thanks'（おれい）。kidId '*' は こども ぜんいん むけ
export async function send({ kidId, kidName, thread: th, from, text = '', audio = null, image = null, kind = '' }) {
  const now = Date.now();
  const m = { id: rid(), kidId, kidName, thread: th, from, text: String(text).slice(0, 500), hasAudio: !!audio, mime: audio?.type || '', hasImage: !!image, device: deviceName(), ts: now, u: now, heard: from === 'kid' || kidId === '*', synced: false, ...(kind ? { kind } : {}) };
  if (audio) await putAudio(m.id, audio);
  if (image) await putAudio('img:' + m.id, image);
  await putMsg(m);
  sync().catch(() => {});
  return m;
}
export async function markHeard(id) {
  const m = await getMsg(id); if (!m || m.heard) return;
  m.heard = true; m.u = Date.now(); m.synced = false; await putMsg(m);
  sync().catch(() => {});
}
// こえ（この端末に なければ サーバーから もらう）
export async function audioBlob(m) {
  let b = await getAudio(m.id);
  if (!b && online()) {
    const r = await api('GET', `/api/audio/${encodeURIComponent(m.id)}`);
    if (r?.audio) { b = await (await fetch(r.audio)).blob(); await putAudio(m.id, b); }
  }
  return b || null;
}
// 絵（この端末に なければ サーバーから もらう）
export async function imageBlob(m) {
  let b = await getAudio('img:' + m.id);
  if (!b && online()) {
    const r = await api('GET', `/api/image/${encodeURIComponent(m.id)}`);
    if (r?.image) { b = await (await fetch(r.image)).blob(); await putAudio('img:' + m.id, b); }
  }
  return b || null;
}
export async function audioURL(m) { const b = await audioBlob(m); return b ? URL.createObjectURL(b) : null; }
// かぞく ぜんいん むけの 絵（パパの しゃしん など）：いちばん あたらしい もの
export async function sharedImage(kind) {
  const list = (await allMsgs()).filter(m => m.kidId === '*' && m.kind === kind && m.hasImage);
  return list[list.length - 1] || null;
}
// サンタの きまり文句（いちばん あたらしい もの）
export async function santaLine(kind) {
  const list = (await allMsgs()).filter(m => m.kidId === '*' && m.kind === kind && m.hasAudio);
  return list[list.length - 1] || null;
}

// ---------- サンタ風の こえ（ひくく・ゆっくり・すこし ひびく） ----------
let actx, cur;
export function unlockAudio() {
  try { actx ||= new (window.AudioContext || window.webkitAudioContext)(); if (actx.state !== 'running') actx.resume(); } catch (e) {}
}
export function stopSanta() { try { cur?.stop(); } catch (e) {} cur = null; }
export const SANTA_RATE = 0.8;
export async function playSanta(blob) {
  unlockAudio(); stopSanta();
  const buf = await actx.decodeAudioData(await blob.arrayBuffer());
  const src = actx.createBufferSource(); src.buffer = buf; src.playbackRate.value = SANTA_RATE;
  const low = actx.createBiquadFilter(); low.type = 'lowshelf'; low.frequency.value = 220; low.gain.value = 5;
  const air = actx.createBiquadFilter(); air.type = 'lowpass'; air.frequency.value = 5200;
  // ちいさな へやの ひびき
  const len = Math.floor(actx.sampleRate * 0.9), ir = actx.createBuffer(2, len, actx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  const verb = actx.createConvolver(); verb.buffer = ir;
  const dry = actx.createGain(); dry.gain.value = 0.9; const wet = actx.createGain(); wet.gain.value = 0.18;
  src.connect(low).connect(air); air.connect(dry).connect(actx.destination); air.connect(verb).connect(wet).connect(actx.destination);
  cur = src; src.start();
  return new Promise(res => { src.onended = res; });
}

// ---------- サーバーと やりとり ----------
async function api(method, path, body) {
  const c = getCfg();
  const res = await fetch(base() + path, {
    method, headers: { 'X-Family-Key': c.key, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined, cache: 'no-store',
  });
  if (res.status === 401) throw new Error('かぎが ちがいます');
  if (!res.ok) throw new Error('サーバー ' + res.status);
  return res.json();
}
const blobToDataURL = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
let syncing = null;
// おくっていない ものを おくって、あたらしい ものを もらう。もどりち：あたらしく とどいた かず
export function sync() { return syncing ||= doSync().finally(() => { syncing = null; }); }
async function doSync() {
  if (!online()) return 0;
  for (const m of (await allMsgs()).filter(x => !x.synced)) {
    const { synced, ...meta } = m;
    const body = { msg: meta };
    if (m.hasAudio && !m.audioSent) { const b = await getAudio(m.id); if (b) body.audio = await blobToDataURL(b); }
    if (m.hasImage && !m.audioSent) { const b = await getAudio('img:' + m.id); if (b) body.image = await blobToDataURL(b); }
    const r = await api('POST', '/api/msgs', body);
    m.synced = true; m.audioSent = true; m.u = r.u || m.u; await putMsg(m);
  }
  const since = getCfg().since || 0;
  const r = await api('GET', `/api/msgs?since=${since}`);
  let fresh = 0;
  for (const meta of r.msgs || []) {
    const cur = await getMsg(meta.id);
    if (cur && !cur.synced) continue;            // こちらの かわった ものが さき
    if (!cur && meta.from !== 'kid') fresh++;
    if (cur && !cur.heard && meta.heard === false && cur.u >= meta.u) continue;
    await putMsg({ ...meta, synced: true, audioSent: true });
  }
  setCfg({ since: Math.max(0, (r.now || Date.now()) - 120000) });
  return fresh;
}
// つなぐ ばんごう
export async function makePairCode() { return api('POST', '/api/pair', {}); }
export async function claimPairCode(code, server = DEFAULT_SERVER) {
  const res = await fetch(server.replace(/\/+$/, '') + '/api/pair/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }), cache: 'no-store' });
  if (res.status === 404) throw new Error('ばんごうが ちがうか、じかんぎれです（だしたばかりなら 1ぷん まって もういちど）');
  if (res.status === 429) throw new Error('まちがいが おおいので、しばらく まってね');
  if (!res.ok) throw new Error('サーバー ' + res.status);
  const j = await res.json(); setCfg({ server, key: j.key, since: 0 }); return true;
}
export async function testConnection(server, key) {
  const res = await fetch(server.replace(/\/+$/, '') + '/api/msgs?since=' + Date.now(), { headers: { 'X-Family-Key': key }, cache: 'no-store' });
  if (res.status === 401) throw new Error('かぎが ちがいます');
  if (!res.ok) throw new Error('サーバー ' + res.status);
  return true;
}

// ---------- こえを とる ----------
export function pickMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const t of ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg']) if (MediaRecorder.isTypeSupported?.(t)) return t;
  return '';
}
export class Recorder {
  async start(maxSec = 30, onTick = () => {}) {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = pickMime();
    this.rec = new MediaRecorder(this.stream, mime ? { mimeType: mime } : undefined);
    this.chunks = [];
    this.rec.ondataavailable = e => e.data.size && this.chunks.push(e.data);
    this.done = new Promise(res => { this.rec.onstop = () => { this.stream.getTracks().forEach(t => t.stop()); res(new Blob(this.chunks, { type: this.rec.mimeType || mime || 'audio/mp4' })); }; });
    this.rec.start(250);
    this.t0 = Date.now();
    this.timer = setInterval(() => { const s = (Date.now() - this.t0) / 1000; onTick(s); if (s >= maxSec) this.stop(); }, 200);
    return this;
  }
  stop() { clearInterval(this.timer); if (this.rec?.state === 'recording') this.rec.stop(); return this.done; }
  cancel() { clearInterval(this.timer); try { if (this.rec?.state === 'recording') this.rec.stop(); } catch (e) {} this.stream?.getTracks().forEach(t => t.stop()); }
}

// ---------- よみあげ（サンタさんは ひくい こえ） ----------
export function speakAs(text, who) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    const ja = speechSynthesis.getVoices().filter(v => /ja/i.test(v.lang));
    if (ja.length) u.voice = ja.find(v => /otoya|ichiro|keita|male|男/i.test(v.name)) || ja[0];
    if (who === 'santa') { u.pitch = 0.55; u.rate = 0.88; } else { u.pitch = 0.95; u.rate = 1; }
    speechSynthesis.cancel(); speechSynthesis.speak(u);
    return new Promise(res => { u.onend = res; u.onerror = res; });
  } catch (e) { return Promise.resolve(); }
}
