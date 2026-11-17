// EndoGame：パパの へんじページ（パパ または サンタさん として へんじする）
import { openDrawPad, showBig } from './drawpad.js';
import { nameKey, makePairCode } from './letters.js';
import { allMsgs, send, audioURL, audioBlob, imageBlob, sync, online, getCfg, setCfg, testConnection, Recorder, pickMime, speakAs, santaLine, playSanta, stopSanta, unlockAudio } from './letters.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const when = ts => { const d = new Date(ts); return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
const TH = { papa: '👨 パパ', santa: '🎅 サンタ' };
// 見ている こども・スレッド。既読（パパが みた）は この端末だけに おぼえる
let cur = JSON.parse(localStorage.getItem('endogame.papaView') || '{}');
const seenKey = 'endogame.papaSeen';
const seen = () => { try { return JSON.parse(localStorage.getItem(seenKey) || '{}'); } catch (e) { return {}; } };
const markSeen = ids => { const s = seen(); ids.forEach(i => { s[i] = 1; }); localStorage.setItem(seenKey, JSON.stringify(s)); };
let showSetup = false, rec = null, recBlob = null, msgs = [];
let idOf = k => k;
let line = { kind: '', rec: null, blob: null };   // きまり文句の ろくおん
const LINES = [['greet', '👋 あいさつ（がめんを ひらいたとき）', 'れい：「ホッホッホー！ メリークリスマス！ サンタさんだよ。きょうは どんな おはなしを してくれるのかな？」'],
  ['thanks', '💌 おれい（おてがみが とどいたとき）', 'れい：「ホッホッホー！ おてがみ ありがとう。ちゃんと よんだら おへんじ するからね。」']];

async function render() {
  msgs = await allMsgs();
  const main = $('main');
  if (showSetup || (!online() && !msgs.length)) { $('compose').hidden = true; main.innerHTML = setupHTML(); bindSetup(); return; }
  // こども × スレッド
  // こどもは「なまえ」で まとめる（ちがう 端末から でも おなじ こ）。へんじは その こ の ぜんぶの 端末に とどく
  const info = new Map();
  for (const m of msgs) {
    if (m.kidId === '*' || !m.kidName) continue;
    const k = nameKey(m.kidName);
    const o = info.get(k) || { name: m.kidName, ids: [], devices: new Set() };
    if (m.from === 'kid') { o.name = m.kidName; if (!o.ids.includes(m.kidId)) o.ids.push(m.kidId); if (m.device) o.devices.add(m.device); }
    info.set(k, o);
  }
  const kids = [...info.entries()].map(([k, o]) => [k, o.name]);
  idOf = k => info.get(k)?.ids.at(-1) || k;
  if (!kids.length) { $('compose').hidden = true; main.innerHTML = `<div class="card empty">まだ おてがみは ありません。<br>こどもが おくると ここに でます。</div>${online() ? '' : '<p class="hint">いまは この端末の なかだけです（⚙️ で サーバーに つなげます）</p>'}`; return; }
  if (!cur.kid || !kids.some(([id]) => id === cur.kid)) cur = { kid: kids[0][0], th: 'papa' };
  const s = seen();
  const unread = (kid, th) => msgs.filter(m => m.kidId !== '*' && nameKey(m.kidName) === kid && m.thread === th && m.from === 'kid' && !s[m.id]).length;
  const tabs = kids.flatMap(([id, name]) => ['papa', 'santa'].map(th => {
    const n = unread(id, th);
    return `<button class="tab ${cur.kid === id && cur.th === th ? 'on' : ''}" data-kid="${esc(id)}" data-th="${th}">${esc(name)}${info.get(id).devices.size ? `<small style="opacity:.7">（${[...info.get(id).devices].map(esc).join('・')}）</small>` : ''} → ${TH[th]}${n ? `<b>${n}</b>` : ''}</button>`;
  })).join('');
  const list = msgs.filter(m => m.kidId !== '*' && nameKey(m.kidName) === cur.kid && m.thread === cur.th);
  const name = kids.find(([id]) => id === cur.kid)[1];
  main.innerHTML = `
    <div class="tabs">${tabs}</div>
    ${online() ? '' : '<p class="hint">いまは この端末の なかだけ（⚙️ で サーバーに つなぐと スマホから へんじできます）</p>'}
    ${cur.th === 'santa' ? await linesHTML() : ''}
    <div class="card"><div class="msgs">${list.length ? list.map(m => `
      <div class="m ${m.from} ${m.from === 'kid' && !s[m.id] ? 'unread' : ''}">
        <div class="meta">${m.from === 'kid' ? esc(m.kidName) + (m.device ? `（${esc(m.device)}）` : '') : TH[m.from]}・${when(m.ts)}${m.from !== 'kid' ? (m.heard ? '・✅ きいたよ' : '・まだ きいていない') : ''}${!m.synced && online() ? ' <span class="unsent">・まだ おくれていない</span>' : ''}</div>
        ${m.hasImage ? `<img data-img="${esc(m.id)}" alt="え" style="display:block;width:240px;max-width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px;background:#fff;margin-top:4px;cursor:zoom-in">` : ''}
        ${m.text ? `<div>${esc(m.text)}</div>` : ''}
        ${m.hasAudio && m.from === 'santa' ? `<button class="btn" data-santa="${esc(m.id)}" style="margin-top:4px">🎅 サンタの こえで きく</button>` : m.hasAudio ? `<audio controls preload="none" data-aid="${esc(m.id)}"></audio>` : ''}
        ${m.from === 'santa' && m.text ? `<button class="btn" data-say="${esc(m.id)}" style="margin-top:4px;font-size:13px">🔊 サンタの こえで きく</button>` : ''}
      </div>`).join('') : '<div class="empty">まだ ありません</div>'}</div></div>`;
  main.querySelectorAll('.tab').forEach(b => b.onclick = () => { cur = { kid: b.dataset.kid, th: b.dataset.th }; localStorage.setItem('endogame.papaView', JSON.stringify(cur)); recBlob = null; render(); });
  main.querySelectorAll('audio[data-aid]').forEach(a => {
    a.addEventListener('play', async () => { if (a.src) return; a.pause(); const m = msgs.find(x => x.id === a.dataset.aid); const u = await audioURL(m).catch(() => null); if (u) { a.src = u; a.play(); } else alert('こえを よみこめませんでした'); }, { once: false });
  });
  main.querySelectorAll('[data-say]').forEach(b => b.onclick = () => { const m = msgs.find(x => x.id === b.dataset.say); speakAs(m.text, 'santa'); });
  main.querySelectorAll('[data-santa]').forEach(b => b.onclick = async () => { unlockAudio(); const m = msgs.find(x => x.id === b.dataset.santa); const bl = await audioBlob(m).catch(() => null); if (bl) playSanta(bl); else alert('こえを よみこめませんでした'); });
  if (cur.th === 'santa') bindLines();
  main.querySelectorAll('img[data-img]').forEach(async im => {
    const m = msgs.find(x => x.id === im.dataset.img);
    const b = m && await imageBlob(m).catch(() => null);
    if (b) { const u = URL.createObjectURL(b); im.src = u; im.onclick = () => showBig(u); }
  });
  markSeen(list.filter(m => m.from === 'kid').map(m => m.id));
  renderCompose(name);
  window.scrollTo(0, document.body.scrollHeight);
}

function renderCompose(name) {
  $('compose').hidden = false;
  const santa = cur.th === 'santa', canRec = pickMime() !== null && navigator.mediaDevices?.getUserMedia;
  $('composeIn').innerHTML = `
    <textarea id="txt" placeholder="${santa ? 'サンタとして もじで へんじ（きかいの こえで よみあげます。🎤 で パパの こえを ろくおんする ほうが しぜんです）' : esc(name) + 'へ へんじ'}"></textarea>
    <div class="row" style="margin-top:6px">
      <button class="btn ${santa ? 'santa' : 'primary'}" id="sendTxt">${santa ? '🎅 サンタとして おくる' : '📮 おくる'}</button>
      ${santa ? `<button class="btn" id="preview">🔊 サンタの こえで ためす</button>` : ''}
      ${canRec ? `<button class="btn ${santa && !recBlob && !rec ? 'santa' : ''}" id="recBtn">${rec ? '⏹️ とめる' : recBlob ? '🎤 とりなおす' : santa ? '🎤 サンタとして こえで へんじ' : '🎤 こえで へんじ'}</button>` : ''}
      ${recBlob ? `<button class="btn" id="recPlay">${santa ? '🎅 サンタの こえで きく' : '▶️ きく'}</button><button class="btn ${santa ? 'santa' : 'primary'}" id="recSend">📮 こえを おくる</button>` : ''}
      <button class="btn" id="drawBtn">🎨 えで へんじ</button>
      <span id="recMsg" class="recdot"></span>
    </div>`;
  $('sendTxt').onclick = async () => {
    const t = $('txt').value.trim(); if (!t) return;
    $('sendTxt').disabled = true;
    await send({ kidId: idOf(cur.kid), kidName: name, thread: cur.th, from: cur.th, text: t }); await sync().catch(() => {});
    await render();
  };
  if ($('preview')) $('preview').onclick = () => { const t = $('txt').value.trim(); if (t) speakAs(t, 'santa'); };
  if ($('recBtn')) $('recBtn').onclick = async () => {
    unlockAudio(); stopSanta();
    if (rec) { rec.stop(); return; }
    try {
      rec = await new Recorder().start(60, s => { const m = $('recMsg'); if (m) m.textContent = `● ろくおん ${Math.floor(s)}びょう`; });
      renderCompose(name);
      rec.done.then(b => { recBlob = b; rec = null; renderCompose(name); });
    } catch (e) { rec = null; alert('マイクが つかえません'); }
  };
  $('drawBtn').onclick = async () => {
    const img = await openDrawPad({ title: santa ? 'サンタとして えを かく' : esc(name) + 'へ えを かく' });
    if (!img) return;
    await send({ kidId: idOf(cur.kid), kidName: name, thread: cur.th, from: cur.th, image: img }); await sync().catch(() => {});
    render();
  };
  if ($('recPlay')) $('recPlay').onclick = () => { if (santa) playSanta(recBlob); else new Audio(URL.createObjectURL(recBlob)).play(); };
  if ($('recSend')) $('recSend').onclick = async () => {
    $('recSend').disabled = true;
    await send({ kidId: idOf(cur.kid), kidName: name, thread: cur.th, from: cur.th, audio: recBlob }); await sync().catch(() => {});
    recBlob = null; await render();
  };
}

async function linesHTML() {
  const rows = [];
  for (const [k, title, ex] of LINES) {
    const m = await santaLine(k), busy = line.kind === k;
    rows.push(`<div style="border-top:1px solid var(--line);padding:8px 0">
      <b>${title}</b> <span class="hint">${m ? '✅ ろくおんずみ' : 'まだ（いまは きかいの こえ）'}</span>
      <div class="hint">${ex}</div>
      <div class="row" style="margin-top:4px">
        ${m ? `<button class="btn" data-line-play="${k}">🎅 いまの こえを きく</button>` : ''}
        <button class="btn ${busy && line.rec ? '' : 'santa'}" data-line-rec="${k}">${busy && line.rec ? '⏹️ とめる' : busy && line.blob ? '🎤 とりなおす' : '🎤 ろくおん'}</button>
        ${busy && line.blob ? `<button class="btn" data-line-try="${k}">🎅 サンタの こえで きく</button><button class="btn primary" data-line-save="${k}">💾 これに する</button>` : ''}
        ${busy && line.rec ? '<span class="recdot" id="lineMsg">● ろくおんちゅう</span>' : ''}
      </div></div>`);
  }
  return `<details class="card" ${line.kind ? 'open' : ''}><summary><b>🎅 サンタの きまり文句（こども ぜんいん きょうつう）</b></summary>
    <p class="hint">ろくおんした パパの こえは、こどもが きくとき ひくく・ゆっくりの サンタ風に なります。「ホッホッホー」から はじめると サンタらしく なります。</p>${rows.join('')}</details>`;
}
function bindLines() {
  document.querySelectorAll('[data-line-play]').forEach(b => b.onclick = async () => { unlockAudio(); const m = await santaLine(b.dataset.linePlay); const bl = m && await audioBlob(m).catch(() => null); if (bl) playSanta(bl); });
  document.querySelectorAll('[data-line-rec]').forEach(b => b.onclick = async () => {
    unlockAudio(); stopSanta();
    const k = b.dataset.lineRec;
    if (line.rec && line.kind === k) { line.rec.stop(); return; }
    try {
      line = { kind: k, rec: await new Recorder().start(30, sec => { const el = document.getElementById('lineMsg'); if (el) el.textContent = `● ろくおん ${Math.floor(sec)}びょう`; }), blob: null };
      render();
      line.rec.done.then(bl => { line.blob = bl; line.rec = null; render(); });
    } catch (e) { line = { kind: '', rec: null, blob: null }; alert('マイクが つかえません'); }
  });
  document.querySelectorAll('[data-line-try]').forEach(b => b.onclick = () => { if (line.blob) playSanta(line.blob); });
  document.querySelectorAll('[data-line-save]').forEach(b => b.onclick = async () => {
    b.disabled = true;
    await send({ kidId: '*', kidName: '', thread: 'santa', from: 'santa', audio: line.blob, kind: b.dataset.lineSave });
    await sync().catch(() => {});
    line = { kind: '', rec: null, blob: null }; render();
  });
}

function setupHTML() {
  const c = getCfg();
  return `<div class="card"><h2>📱 サーバーに つなぐ</h2>
    <p class="hint">iPad の「おうちのひと メニュー → 💌 おてがみ」に いれたのと おなじ アドレスと かぎを いれてください。</p>
    <label>サーバーの アドレス</label><input id="srv" value="${esc(c.server || '')}" placeholder="https://endogame-letters.xxxx.workers.dev" autocomplete="off">
    <label>かぞくの かぎ</label><input id="key" type="password" value="${esc(c.key || '')}" autocomplete="off">
    <div class="row" style="margin-top:10px"><button class="btn primary" id="save">ほぞんして つなぐ</button>${online() || msgs.length ? '<button class="btn" id="back">もどる</button>' : ''}</div>
    <p class="hint" id="msg"></p>
    <p class="hint">この ページを スマホの ホーム画面に ついかすると、アプリのように ひらけます。</p></div>`;
}
function bindSetup() {
  $('save').onclick = async () => {
    const server = $('srv').value.trim(), key = $('key').value.trim();
    if (!server || !key) { $('msg').textContent = 'りょうほう いれてください'; return; }
    $('msg').textContent = 'ためしています…';
    try { await testConnection(server, key); setCfg({ server, key, since: 0 }); showSetup = false; $('msg').textContent = '✅ つながりました'; await sync().catch(() => {}); render(); }
    catch (e) { $('msg').textContent = '❌ ' + e.message; }
  };
  if ($('back')) $('back').onclick = () => { showSetup = false; render(); };
}

// かんたん せってい：QRコードの リンク（#setup=…）で アドレスと かぎを 入れる
// ・かぎは「#」の あとに あるので サーバーには おくられない
// ・iPhone の ホーム画面アプリは Safari と べつの ほぞん場所なので、ホーム画面に ついかするまで リンクを のこす
const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
if (location.hash.startsWith('#setup=')) {
  try {
    const b64 = location.hash.slice(7).replace(/-/g, '+').replace(/_/g, '/');
    const { s, k } = JSON.parse(decodeURIComponent(escape(atob(b64))));
    if (s && k) {
      if (getCfg().key !== k || getCfg().server !== s) setCfg({ server: s, key: k, since: 0 });
      if (standalone) history.replaceState(null, '', location.pathname);
      else {
        const b = document.createElement('div');
        b.style.cssText = 'background:#fff7d6;border:2px solid #ffb21a;border-radius:12px;padding:12px 14px;margin:12px 16px 0;font-size:15px;line-height:1.6';
        b.innerHTML = '✅ <b>せってい できました！</b><br>このまま 下の <b>共有ボタン（□↑）→「ホーム画面に追加」</b> を おしてください。つぎからは アイコンを おすだけで ひらけます。';
        document.querySelector('header').after(b);
      }
    }
  } catch (e) { console.warn('setup link', e); }
}

$('setBtn').onclick = () => { showSetup = true; render(); };
// 📲 iPad を つなぐ：6けたの ばんごうを だす（10ぷん）
$('pairBtn').onclick = async () => {
  if (!online()) { alert('さきに この ページを サーバーに つないでください（⚙️）'); return; }
  try {
    const r = await makePairCode();
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;inset:0;z-index:50;background:rgba(20,30,50,.6);display:flex;align-items:center;justify-content:center;padding:16px';
    box.innerHTML = `<div style="background:#fff;border-radius:18px;padding:22px 20px;max-width:380px;width:100%;text-align:center;font-size:16px;line-height:1.6">
      <b>📲 iPad を つなぐ</b>
      <p style="margin:8px 0">iPad の「⚙️ おうちのひと → 💌 おてがみ」の<br>「つなぐ ばんごう」に いれてください</p>
      <div style="font:900 44px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.12em;color:#2f7fe8;margin:10px 0">${r.code.slice(0, 3)} ${r.code.slice(3)}</div>
      <p class="hint" id="pairLeft">のこり 10:00（1だいに 1かい つかえます）</p>
      <button class="btn primary" id="pairClose" style="margin-top:8px">とじる</button></div>`;
    document.body.appendChild(box);
    const t = setInterval(() => { const s = Math.max(0, Math.round((r.expires - Date.now()) / 1000)); const el = document.getElementById('pairLeft'); if (el) el.textContent = s ? `のこり ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}（1だいに 1かい つかえます）` : 'じかんぎれ。もういちど おしてください'; if (!s) clearInterval(t); }, 1000);
    document.getElementById('pairClose').onclick = () => { clearInterval(t); box.remove(); };
  } catch (e) { alert('ばんごうを つくれませんでした（' + e.message + '）'); }
};
$('syncBtn').onclick = async () => { $('syncBtn').textContent = '…'; try { await sync(); } catch (e) { alert(e.message); } $('syncBtn').textContent = '🔄 こうしん'; render(); };
// ひらいている あいだは 20びょう ごとに あたらしい おてがみを みる
setInterval(async () => { if (rec || document.activeElement?.id === 'txt') return; try { const n = await sync(); if (n !== undefined) { const before = msgs.length; const all = await allMsgs(); if (all.length !== before) render(); } } catch (e) {} }, 20000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sync().then(render).catch(() => {}); });
sync().catch(() => {}).finally(render);
// 新しい 版が とどいたら 1かいだけ よみなおす（へんじページも いつも 最新に）
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  const had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(reg => {
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(() => {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (had && !reloaded && !rec) { reloaded = true; location.reload(); } });
}
