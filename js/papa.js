// EndoGame：パパの へんじページ（パパ または サンタさん として へんじする）
import { allMsgs, send, audioURL, sync, online, getCfg, setCfg, testConnection, Recorder, pickMime, speakAs } from './letters.js';

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

async function render() {
  msgs = await allMsgs();
  const main = $('main');
  if (showSetup || (!online() && !msgs.length)) { $('compose').hidden = true; main.innerHTML = setupHTML(); bindSetup(); return; }
  // こども × スレッド
  const kids = [...new Map([...msgs.filter(m => m.from !== 'kid'), ...msgs.filter(m => m.from === 'kid')].map(m => [m.kidId, m.kidName])).entries()];
  if (!kids.length) { $('compose').hidden = true; main.innerHTML = `<div class="card empty">まだ おてがみは ありません。<br>こどもが おくると ここに でます。</div>${online() ? '' : '<p class="hint">いまは この端末の なかだけです（⚙️ で サーバーに つなげます）</p>'}`; return; }
  if (!cur.kid || !kids.some(([id]) => id === cur.kid)) cur = { kid: kids[0][0], th: 'papa' };
  const s = seen();
  const unread = (kid, th) => msgs.filter(m => m.kidId === kid && m.thread === th && m.from === 'kid' && !s[m.id]).length;
  const tabs = kids.flatMap(([id, name]) => ['papa', 'santa'].map(th => {
    const n = unread(id, th);
    return `<button class="tab ${cur.kid === id && cur.th === th ? 'on' : ''}" data-kid="${esc(id)}" data-th="${th}">${esc(name)} → ${TH[th]}${n ? `<b>${n}</b>` : ''}</button>`;
  })).join('');
  const list = msgs.filter(m => m.kidId === cur.kid && m.thread === cur.th);
  const name = kids.find(([id]) => id === cur.kid)[1];
  main.innerHTML = `
    <div class="tabs">${tabs}</div>
    ${online() ? '' : '<p class="hint">いまは この端末の なかだけ（⚙️ で サーバーに つなぐと スマホから へんじできます）</p>'}
    <div class="card"><div class="msgs">${list.length ? list.map(m => `
      <div class="m ${m.from} ${m.from === 'kid' && !s[m.id] ? 'unread' : ''}">
        <div class="meta">${m.from === 'kid' ? esc(name) : TH[m.from]}・${when(m.ts)}${m.from !== 'kid' ? (m.heard ? '・✅ きいたよ' : '・まだ きいていない') : ''}${!m.synced && online() ? ' <span class="unsent">・まだ おくれていない</span>' : ''}</div>
        ${m.text ? `<div>${esc(m.text)}</div>` : ''}
        ${m.hasAudio ? `<audio controls preload="none" data-aid="${esc(m.id)}"></audio>` : ''}
        ${m.from === 'santa' && m.text ? `<button class="btn" data-say="${esc(m.id)}" style="margin-top:4px;font-size:13px">🔊 サンタの こえで きく</button>` : ''}
      </div>`).join('') : '<div class="empty">まだ ありません</div>'}</div></div>`;
  main.querySelectorAll('.tab').forEach(b => b.onclick = () => { cur = { kid: b.dataset.kid, th: b.dataset.th }; localStorage.setItem('endogame.papaView', JSON.stringify(cur)); recBlob = null; render(); });
  main.querySelectorAll('audio[data-aid]').forEach(a => {
    a.addEventListener('play', async () => { if (a.src) return; a.pause(); const m = msgs.find(x => x.id === a.dataset.aid); const u = await audioURL(m).catch(() => null); if (u) { a.src = u; a.play(); } else alert('こえを よみこめませんでした'); }, { once: false });
  });
  main.querySelectorAll('[data-say]').forEach(b => b.onclick = () => { const m = msgs.find(x => x.id === b.dataset.say); speakAs(m.text, 'santa'); });
  markSeen(list.filter(m => m.from === 'kid').map(m => m.id));
  renderCompose(name);
  window.scrollTo(0, document.body.scrollHeight);
}

function renderCompose(name) {
  $('compose').hidden = false;
  const santa = cur.th === 'santa', canRec = !santa && pickMime() !== null && navigator.mediaDevices?.getUserMedia;
  $('composeIn').innerHTML = `
    <textarea id="txt" placeholder="${santa ? 'サンタさんとして へんじ（ひくい サンタの こえで よみあげます）' : esc(name) + 'へ へんじ'}"></textarea>
    <div class="row" style="margin-top:6px">
      <button class="btn ${santa ? 'santa' : 'primary'}" id="sendTxt">${santa ? '🎅 サンタとして おくる' : '📮 おくる'}</button>
      ${santa ? `<button class="btn" id="preview">🔊 サンタの こえで ためす</button>` : ''}
      ${canRec ? `<button class="btn" id="recBtn">${rec ? '⏹️ とめる' : recBlob ? '🎤 とりなおす' : '🎤 こえで へんじ'}</button>` : ''}
      ${recBlob ? `<button class="btn" id="recPlay">▶️ きく</button><button class="btn primary" id="recSend">📮 こえを おくる</button>` : ''}
      <span id="recMsg" class="recdot"></span>
    </div>`;
  $('sendTxt').onclick = async () => {
    const t = $('txt').value.trim(); if (!t) return;
    $('sendTxt').disabled = true;
    await send({ kidId: cur.kid, kidName: name, thread: cur.th, from: cur.th, text: t }); await sync().catch(() => {});
    await render();
  };
  if ($('preview')) $('preview').onclick = () => { const t = $('txt').value.trim(); if (t) speakAs(t, 'santa'); };
  if ($('recBtn')) $('recBtn').onclick = async () => {
    if (rec) { rec.stop(); return; }
    try {
      rec = await new Recorder().start(60, s => { const m = $('recMsg'); if (m) m.textContent = `● ろくおん ${Math.floor(s)}びょう`; });
      renderCompose(name);
      rec.done.then(b => { recBlob = b; rec = null; renderCompose(name); });
    } catch (e) { rec = null; alert('マイクが つかえません'); }
  };
  if ($('recPlay')) $('recPlay').onclick = () => new Audio(URL.createObjectURL(recBlob)).play();
  if ($('recSend')) $('recSend').onclick = async () => {
    $('recSend').disabled = true;
    await send({ kidId: cur.kid, kidName: name, thread: cur.th, from: cur.th, audio: recBlob }); await sync().catch(() => {});
    recBlob = null; await render();
  };
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

$('setBtn').onclick = () => { showSetup = true; render(); };
$('syncBtn').onclick = async () => { $('syncBtn').textContent = '…'; try { await sync(); } catch (e) { alert(e.message); } $('syncBtn').textContent = '🔄 こうしん'; render(); };
// ひらいている あいだは 20びょう ごとに あたらしい おてがみを みる
setInterval(async () => { if (rec || document.activeElement?.id === 'txt') return; try { const n = await sync(); if (n !== undefined) { const before = msgs.length; const all = await allMsgs(); if (all.length !== before) render(); } } catch (e) {} }, 20000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sync().then(render).catch(() => {}); });
sync().catch(() => {}).finally(render);
