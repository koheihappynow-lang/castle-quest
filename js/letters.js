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
// 声・絵は { buf: ArrayBuffer, type } で ほぞん（iPhone の Safari は Blob の ほぞんに しっぱいする ことが ある）
async function getAudio(id) {
  const v = await reqP((await st('audio')).get(id));
  if (!v) return null;
  if (v instanceof Blob) return v;
  return new Blob([v.buf], { type: v.type || '' });
}
async function putAudio(id, blob) {
  const v = { buf: await blob.arrayBuffer(), type: blob.type || '' };
  return reqP((await st('audio', 'readwrite')).put(v, id));
}
async function dropLocal(id) {
  await reqP((await st('msgs', 'readwrite')).delete(id));
  const a = await st('audio', 'readwrite'); await reqP(a.delete(id)); await reqP((await st('audio', 'readwrite')).delete('img:' + id));
}
// おてがみを けす（この 端末と サーバー。ほかの 端末は つぎの こうしんで きえる）
export async function deleteMsgs(ids) {
  if (!ids.length) return;
  if (online()) await api('POST', '/api/delete', { ids });
  for (const id of ids) await dropLocal(id);
}

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
// おくれなかった ものを もういちど おくる
export async function retrySend(id) {
  const m = await getMsg(id); if (!m) return;
  delete m.failed; delete m.lastError; m.synced = false; await putMsg(m);
  return sync();
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

// ---------- サンタの こえ（パパの 声を「大きくて あたたかい サンタ」に） ----------
// 1) 声の 高さを さげる（体の 大きい 人の 声）。でも 話す はやさは そのまま（WSOLA で のびを もどす）
// 2) 胸に ひびく 低音・すこし ずらした 声を かさねて 太く・暖炉の へやの ひびき
// 3) まえに 鈴（シャンシャン）、さいごに ベル（キラーン）
let actx, cur;
export function unlockAudio() {
  try { actx ||= new (window.AudioContext || window.webkitAudioContext)(); if (actx.state !== 'running') actx.resume(); } catch (e) {}
}
export function stopSanta() { try { cur?.stop(); } catch (e) {} cur = null; }
const PITCH = 0.76;     // 声の 高さ（やく 4.7はん音 さげる）
const SPEED = 0.97;     // 話す はやさ（ほぼ そのまま。すこしだけ ゆったり）
const LEAD = 1.15;      // 鈴の あいだ（びょう）

// 高さを かえずに 長さだけ かえる（factor < 1 で みじかく）
function stretch(x, factor, sr) {
  const W = Math.max(256, Math.round(sr * 0.04) & ~1), Hs = W / 2, Ha = Hs / factor, tol = Math.round(W / 6), step = 4;
  const win = new Float32Array(W); for (let i = 0; i < W; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / W);
  const outLen = Math.floor(x.length * factor) + W * 2, y = new Float32Array(outLen), norm = new Float32Array(outLen);
  let prev = 0, inPos = 0, outPos = 0;
  while (true) {
    const want = Math.round(inPos);
    if (want + W + tol >= x.length || outPos + W >= outLen) break;
    let best = want;
    if (outPos > 0) {
      // まえの かたまりの「つづき」に いちばん にている ところを さがす
      const ref = prev + Hs; let bestC = -Infinity;
      for (let d = -tol; d <= tol; d += 2) {
        const s = want + d; if (s < 0) continue;
        let c = 0; for (let i = 0; i < W; i += step) c += x[ref + i] * x[s + i];
        if (c > bestC) { bestC = c; best = s; }
      }
    }
    for (let i = 0; i < W; i++) { y[outPos + i] += x[best + i] * win[i]; norm[outPos + i] += win[i]; }
    prev = best; inPos += Ha; outPos += Hs;
  }
  for (let i = 0; i < outLen; i++) if (norm[i] > 1e-3) y[i] /= norm[i];
  return y.subarray(0, outPos + Hs);
}
function roomIR(ctx, sec, decay) {
  const len = Math.floor(ctx.sampleRate * sec), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let lp = 0; for (let i = 0; i < len; i++) { lp = lp * 0.6 + (Math.random() * 2 - 1) * 0.4; d[i] = lp * Math.pow(1 - i / len, decay); } }
  return ir;
}
// 鈴（シャンシャン）
function sleighBells(ctx, t0, dur) {
  const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
  const nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const out = ctx.createGain(); out.gain.value = 0.32; out.connect(ctx.destination);
  for (let t = 0; t < dur; t += 0.16) {
    const at = t0 + t + (Math.random() - 0.5) * 0.02;
    const n = ctx.createBufferSource(); n.buffer = noise;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 6500 + Math.random() * 1500; bp.Q.value = 3;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.9, at + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.14);
    n.connect(bp).connect(g).connect(out); n.start(at); n.stop(at + 0.2);
    for (const f of [2637, 3520, 4186]) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.02);
      const og = ctx.createGain(); og.gain.setValueAtTime(0.0001, at); og.gain.exponentialRampToValueAtTime(0.12, at + 0.004); og.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
      o.connect(og).connect(out); o.start(at); o.stop(at + 0.2);
    }
  }
}
// ベル（キラーン）
function chime(ctx, at) {
  const out = ctx.createGain(); out.gain.value = 0.25; out.connect(ctx.destination);
  [[1568, 0], [2093, 0.09], [3136, 0.18]].forEach(([f, d]) => {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, at + d); g.gain.exponentialRampToValueAtTime(0.5, at + d + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + d + 1.2);
    o.connect(g).connect(out); o.start(at + d); o.stop(at + d + 1.3);
  });
}
// パパの 声（Blob）→ サンタの 声（AudioBuffer）
export async function renderSanta(blob) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const dec = new OAC(1, 1, 44100);
  const src0 = await dec.decodeAudioData(await blob.arrayBuffer());
  const sr = src0.sampleRate, mono = new Float32Array(src0.length);
  for (let c = 0; c < src0.numberOfChannels; c++) { const d = src0.getChannelData(c); for (let i = 0; i < d.length; i++) mono[i] += d[i] / src0.numberOfChannels; }
  const voice = stretch(mono, PITCH * SPEED, sr);           // さきに みじかく → ひくく した ときに もとの はやさ
  const voiceSec = voice.length / sr / PITCH;
  const total = LEAD + voiceSec + 1.8;
  const ctx = new OAC(2, Math.ceil(total * sr), sr);
  const vb = ctx.createBuffer(1, voice.length, sr); vb.getChannelData(0).set(voice);
  // 声の みち
  const bus = ctx.createGain(); bus.gain.value = 1;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 70;
  const chest = ctx.createBiquadFilter(); chest.type = 'lowshelf'; chest.frequency.value = 180; chest.gain.value = 7;
  const harsh = ctx.createBiquadFilter(); harsh.type = 'peaking'; harsh.frequency.value = 3200; harsh.Q.value = 1; harsh.gain.value = -4;
  const soft = ctx.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 7000;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -22; comp.ratio.value = 3.5; comp.attack.value = 0.005; comp.release.value = 0.2;
  bus.connect(hp).connect(chest).connect(harsh).connect(soft).connect(comp);
  const dry = ctx.createGain(); dry.gain.value = 0.95; comp.connect(dry).connect(ctx.destination);
  const verb = ctx.createConvolver(); verb.buffer = roomIR(ctx, 1.5, 2.6);
  const wet = ctx.createGain(); wet.gain.value = 0.22; comp.connect(verb).connect(wet).connect(ctx.destination);
  // 声を 2つ かさねて 太く（すこし ひくく・すこし おくらせる）
  const v1 = ctx.createBufferSource(); v1.buffer = vb; v1.playbackRate.value = PITCH; v1.connect(bus); v1.start(LEAD);
  const v2 = ctx.createBufferSource(); v2.buffer = vb; v2.playbackRate.value = PITCH * 0.985;
  const v2g = ctx.createGain(); v2g.gain.value = 0.28; const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  if (pan) { pan.pan.value = 0.35; v2.connect(v2g).connect(pan).connect(bus); } else v2.connect(v2g).connect(bus);
  v2.start(LEAD + 0.018);
  sleighBells(ctx, 0.05, LEAD - 0.15);
  chime(ctx, LEAD + voiceSec + 0.15);
  const out = await ctx.startRendering();
  // おおきさを そろえる
  let peak = 0; for (let c = 0; c < out.numberOfChannels; c++) { const d = out.getChannelData(c); for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i])); }
  const k = peak > 0 ? 0.9 / peak : 1;
  for (let c = 0; c < out.numberOfChannels; c++) { const d = out.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= k; }
  return out;
}
export async function playSanta(blob) {
  unlockAudio(); stopSanta();
  const out = await renderSanta(blob);
  const src = actx.createBufferSource(); src.buffer = out; src.connect(actx.destination);
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
let fullDone = false;   // おきて さいしょの 1かいは ぜんぶ とりなおす
async function doSync() {
  if (!online()) return 0;
  // 1) おくる：1つ しっぱいしても ほかは つづける（まえは 1つ しっぱいすると うけとりまで とまっていた）
  for (const m of (await allMsgs()).filter(x => !x.synced && !x.failed)) {
    try {
      const { synced, ...meta } = m;
      const body = { msg: meta };
      if (m.hasAudio && !m.audioSent) { const b = await getAudio(m.id); if (b) body.audio = await blobToDataURL(b); }
      if (m.hasImage && !m.audioSent) { const b = await getAudio('img:' + m.id); if (b) body.image = await blobToDataURL(b); }
      const r = await api('POST', '/api/msgs', body);
      if (r.deleted) { await dropLocal(m.id); continue; }   // パパが けした もの
      m.synced = true; m.audioSent = true; m.u = r.u || m.u; await putMsg(m);
    } catch (e) {
      if (/かぎ/.test(e.message)) throw e;
      m.lastError = String(e.message || e).slice(0, 80);
      if (/サーバー 4\d\d/.test(e.message)) m.failed = true;   // おくれない もの（大きすぎる など）は いったん とめる
      await putMsg(m);
    }
  }
  // 2) うけとる：おきた ときは ぜんぶ、そのあとは 10ぷん さかのぼって（とりこぼし ふせぎ）
  const since = fullDone ? Math.max(0, (getCfg().since || 0) - 600000) : 0;
  const r = await api('GET', `/api/msgs?since=${since}`);
  fullDone = true;
  let fresh = 0;
  for (const meta of r.msgs || []) {
    if (meta.deleted) { await dropLocal(meta.id); continue; }   // ほかで けされた
    const cur = await getMsg(meta.id);
    if (cur && !cur.synced && !cur.failed) continue;            // こちらの かわった ものが さき
    if (!cur && meta.from !== 'kid') fresh++;
    if (cur && cur.heard && !meta.heard) { meta.heard = true; }
    await putMsg({ ...meta, synced: true, audioSent: true });
  }
  setCfg({ since: r.now || Date.now() });
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
