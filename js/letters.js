// EndoGame の おてがみ（サンタさん・パパ）の ほぞんと おくりとどけ
// ・メッセージは この端末の IndexedDB に ほぞん（声は Blob のまま）
// ・おうちのひとメニューで サーバー（Cloudflare Worker）と「かぞくの かぎ」を せっていすると、
//   パパの スマホ（papa.html）と やりとりできる。サーバーが ない ときは この端末の なかだけ。
// メッセージ：{ id, kidId, kidName, thread:'santa'|'papa', from:'kid'|'papa'|'santa', text, hasAudio, mime, ts, u, heard, synced }

const CFG_KEY = 'endogame.letters';
export function getCfg() { try { return JSON.parse(localStorage.getItem(CFG_KEY) || '{}'); } catch (e) { return {}; } }
export function setCfg(c) { localStorage.setItem(CFG_KEY, JSON.stringify({ ...getCfg(), ...c })); }
export const online = () => { const c = getCfg(); return !!(c.server && c.key); };
const base = () => getCfg().server.replace(/\/+$/, '');

// ---------- IndexedDB ----------
let dbp;
function idb() {
  return dbp ||= new Promise((res, rej) => {
    const r = indexedDB.open('endogame-letters', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('msgs', { keyPath: 'id' }); r.result.createObjectStore('audio'); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
const reqP = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function st(name, mode = 'readonly') { return (await idb()).transaction(name, mode).objectStore(name); }
export async function allMsgs() { return (await reqP((await st('msgs')).getAll())).sort((a, b) => a.ts - b.ts); }
async function getMsg(id) { return reqP((await st('msgs')).get(id)); }
async function putMsg(m) { return reqP((await st('msgs', 'readwrite')).put(m)); }
async function getAudio(id) { return reqP((await st('audio')).get(id)); }
async function putAudio(id, blob) { return reqP((await st('audio', 'readwrite')).put(blob, id)); }

export async function thread(kidId, th) { return (await allMsgs()).filter(m => m.kidId === kidId && m.thread === th); }
// まだ きいていない へんじの かず { santa: n, papa: n }
export async function unheard(kidId) {
  const out = { santa: 0, papa: 0 };
  for (const m of await allMsgs()) if (m.kidId === kidId && m.from !== 'kid' && !m.heard) out[m.thread]++;
  return out;
}

const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export async function send({ kidId, kidName, thread: th, from, text = '', audio = null }) {
  const now = Date.now();
  const m = { id: rid(), kidId, kidName, thread: th, from, text: String(text).slice(0, 500), hasAudio: !!audio, mime: audio?.type || '', ts: now, u: now, heard: from === 'kid' ? true : false, synced: false };
  if (audio) await putAudio(m.id, audio);
  await putMsg(m);
  sync().catch(() => {});
  return m;
}
export async function markHeard(id) {
  const m = await getMsg(id); if (!m || m.heard) return;
  m.heard = true; m.u = Date.now(); m.synced = false; await putMsg(m);
  sync().catch(() => {});
}
// こえを ならす URL（この端末に なければ サーバーから もらう）
export async function audioURL(m) {
  let b = await getAudio(m.id);
  if (!b && online()) {
    const r = await api('GET', `/api/audio/${encodeURIComponent(m.id)}`);
    if (r?.audio) { b = await (await fetch(r.audio)).blob(); await putAudio(m.id, b); }
  }
  return b ? URL.createObjectURL(b) : null;
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
