// EndoGame：パパの へんじページ（パパ または サンタさん として へんじする）
import { openDrawPad, showBig } from './drawpad.js';
import { nameKey, makePairCode, deleteMsgs, retrySend, claimPairCode, VAPID_PUBLIC, pushSubscribe, pushUnsubscribe, pushTest } from './letters.js';
import { allMsgs, send, audioURL, audioBlob, imageBlob, sync, online, getCfg, setCfg, testConnection, Recorder, pickMime, speakAs, santaLine, playSanta, stopSanta, unlockAudio } from './letters.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const when = ts => { const d = new Date(ts); return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
const TH = { papa: '👨 パパ', mama: '👩 ママ', santa: '🎅 サンタ' };
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
  document.body.classList.remove('chat');
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
  // 1だんめ：こども、2だんめ：だれとして へんじ（大きな ボタン）
  const kidUnread = k => ['papa', 'mama', 'santa'].reduce((t, th) => t + unread(k, th), 0);
  const kidRow = kids.map(([id, name]) => {
    const n = kidUnread(id), dev = [...info.get(id).devices];
    return `<button class="tab seg ${cur.kid === id ? 'on' : ''}" data-kid="${esc(id)}" data-th="${cur.th}"><span>${esc(name)}${n ? `<b>${n}</b>` : ''}</span>${dev.length ? `<small>${dev.map(esc).join('・')}</small>` : ''}</button>`;
  }).join('');
  const thRow = ['papa', 'mama', 'santa'].map(th => {
    const n = unread(cur.kid, th);
    return `<button class="tab seg th-${th} ${cur.th === th ? 'on' : ''}" data-kid="${esc(cur.kid)}" data-th="${th}"><span>${TH[th]}${n ? `<b>${n}</b>` : ''}</span></button>`;
  }).join('');
  const tabs = `<div class="segs" style="--n:${kids.length}">${kidRow}</div><div class="segs" style="--n:3">${thRow}</div>`;
  const list = msgs.filter(m => m.kidId !== '*' && nameKey(m.kidName) === cur.kid && m.thread === cur.th);
  const name = kids.find(([id]) => id === cur.kid)[1];
  main.innerHTML = `
    ${tabs}
    ${list.length ? `<div style="text-align:right;margin:-4px 0 6px"><button class="btn" id="delAll" style="font-size:13px;padding:6px 10px">🗑️ この タブを ぜんぶ けす（${list.length}つう）</button></div>` : ''}
    ${online() || location.search.includes('demo') ? '' : '<p class="hint">いまは この端末の なかだけ（⚙️ で サーバーに つなぐと スマホから へんじできます）</p>'}
    ${cur.th === 'santa' ? await linesHTML() : ''}
    <div class="card msgbox" id="msgbox"><div class="msgs">${list.length ? list.map(m => `
      <div class="m ${m.from} ${m.from === 'kid' && !s[m.id] ? 'unread' : ''}">
        <button class="del" data-del="${esc(m.id)}" title="けす">🗑️</button>
        <div class="meta">${m.from === 'kid' ? esc(m.kidName) + (m.device ? `（${esc(m.device)}）` : '') : TH[m.from]}・${when(m.ts)}${m.from !== 'kid' ? (m.heard ? '・✅ きいたよ' : '・まだ きいていない') : ''}${!m.synced && online() ? ` <span class="unsent">・⚠️ まだ おくれていない${m.lastError ? '（' + esc(m.lastError) + '）' : ''}</span> <button class="btn" data-retry="${esc(m.id)}" style="font-size:12px;padding:3px 8px">もういちど おくる</button>` : ''}</div>
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
  main.querySelectorAll('[data-retry]').forEach(b => b.onclick = async () => { b.disabled = true; b.textContent = 'おくっています…'; try { await retrySend(b.dataset.retry); } catch (e) { alert('おくれませんでした（' + e.message + '）'); } render(); });
  main.querySelectorAll('img[data-img]').forEach(async im => {
    const m = msgs.find(x => x.id === im.dataset.img);
    const b = m && await imageBlob(m).catch(() => null);
    if (b) { const u = URL.createObjectURL(b); im.src = u; im.onclick = () => showBig(u); im.onload = () => { const box = $('msgbox'); if (box) box.scrollTop = box.scrollHeight; }; }
  });
  main.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    const m = msgs.find(x => x.id === b.dataset.del); if (!m) return;
    if (!confirm('この おてがみを けしますか？（こどもの 端末からも きえます。もとに もどせません）')) return;
    try { await deleteMsgs([m.id]); } catch (e) { alert('けせませんでした（' + e.message + '）'); }
    render();
  });
  if ($('delAll')) $('delAll').onclick = async () => {
    if (!confirm(`「${name}」の この タブの おてがみ ${list.length}つうを ぜんぶ けしますか？（こどもの 端末からも きえます。もとに もどせません）`)) return;
    try { await deleteMsgs(list.map(m => m.id)); } catch (e) { alert('けせませんでした（' + e.message + '）'); }
    render();
  };
  markSeen(list.filter(m => m.from === 'kid').map(m => m.id));
  renderCompose(name);
  document.body.classList.add('chat');
  fitPad(); const box = $('msgbox'); if (box) box.scrollTop = box.scrollHeight;
}

// 下の 入力欄の 高さに あわせて、ページの 下の よはくを かえる（サンタの ときは 入力欄が たかい）
function fitPad() { const c = $('compose'); $('main').style.paddingBottom = document.body.classList.contains('chat') ? '' : (c.hidden ? 24 : c.offsetHeight + 24) + 'px'; }
addEventListener('resize', fitPad);
function renderCompose(name) {
  $('compose').hidden = false;
  const santa = cur.th === 'santa', canRec = pickMime() !== null && navigator.mediaDevices?.getUserMedia;
  $('composeIn').innerHTML = `
    <textarea id="txt" placeholder="${santa ? 'サンタとして もじで へんじ（🎤 こえ の ほうが しぜん）' : esc(name) + 'へ へんじ'}"></textarea>
    <div class="row" style="margin-top:6px">
      <button class="btn ${santa ? 'santa' : 'primary'}" id="sendTxt">${santa ? '🎅 もじを おくる' : '📮 おくる'}</button>
      ${santa ? `<button class="btn" id="preview">🔊 サンタの こえで ためす</button>` : ''}
      ${canRec ? `<button class="btn ${santa && !recBlob && !rec ? 'santa' : ''}" id="recBtn">${rec ? '⏹️ とめる' : recBlob ? '🎤 とりなおす' : '🎤 こえで へんじ'}</button>` : ''}
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
  fitPad(); requestAnimationFrame(fitPad);
  if ($('recPlay')) $('recPlay').onclick = () => { if (santa) playSanta(recBlob); else new Audio(URL.createObjectURL(recBlob)).play(); };
  if ($('recSend')) $('recSend').onclick = async () => {
    $('recSend').disabled = true;
    if (!recBlob || !recBlob.size) { alert('ろくおんが からっぽでした。もういちど ろくおんしてください'); recBlob = null; renderCompose(name); return; }
    try { await send({ kidId: idOf(cur.kid), kidName: name, thread: cur.th, from: cur.th, audio: recBlob }); }
    catch (e) { alert('こえを ほぞんできませんでした（' + e.message + '）'); $('recSend').disabled = false; return; }
    await sync().catch(e => alert('おくれませんでした（' + e.message + '）。あとで「もういちど おくる」を おしてください'));
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
  const back = '<div class="card"><button class="btn primary" id="back">⬅ もどる</button></div>';
  const keyCard = (open) => `<details class="card" ${open ? 'open' : ''}><summary><b>🔑 かぎで つなぐ</b></summary>
    <p class="hint">iPad の「おうちのひと メニュー → 💌 おてがみ」に いれたのと おなじ かぎを いれても つながります。</p>
    <label>サーバーの アドレス</label><input id="srv" value="${esc(c.server || '')}" autocomplete="off">
    <label>かぞくの かぎ</label><input id="key" type="password" value="${esc(c.key || '')}" autocomplete="off">
    <div class="row" style="margin-top:10px"><button class="btn primary" id="save">ほぞんして つなぐ</button></div>
    <p class="hint" id="msg"></p></details>`;
  if (online()) return back + notifyHTML() + photosHTML() + keyCard(false) + back;
  return `<div class="card"><h2>📱 つなぐ ばんごう（6けた）で つなぐ</h2>
    <p class="hint">つながっている スマホ（パパ）の この ページで「📲 つなぐ」を おすと 6けたの ばんごうが でます。それを いれるだけ。</p>
    <div class="row"><input id="pairIn" inputmode="numeric" maxlength="7" placeholder="123 456" style="max-width:170px;font-size:22px;letter-spacing:.1em;text-align:center"><button class="btn primary" id="pairGo">つなぐ</button></div>
    <p class="hint" id="pairMsg"></p>
    <p class="hint">この ページを スマホの ホーム画面に ついかすると、アプリのように ひらけます（通知も うけとれます）。</p></div>
  ${keyCard(false)}${msgs.length ? back : ''}`;
}
// 🔔 通知
const ROLE_KEY = 'endogame.parentRole';
const pushReady = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const standaloneApp = () => navigator.standalone || matchMedia('(display-mode: standalone)').matches;
function notifyHTML() {
  const role = localStorage.getItem(ROLE_KEY) || 'papa';
  const on = localStorage.getItem('endogame.pushOn') === '1' && pushReady() && Notification.permission === 'granted';
  const iosNeedsHome = /iPhone|iPad/.test(navigator.userAgent) && !standaloneApp();
  return `<div class="card"><h2>🔔 こどもから きたら つうち</h2>
    <p class="hint">わたしは：</p>
    <div class="segs" style="--n:3">${[['papa', '👨 パパ'], ['mama', '👩 ママ'], ['both', '👪 ぜんぶ']].map(([k, l]) => `<button class="seg ${role === k ? 'on' : ''}" data-role="${k}">${l}</button>`).join('')}</div>
    <p class="hint">パパ：パパあて＋サンタあて／ママ：ママあて＋サンタあて／ぜんぶ：ぜんぶ</p>
    ${iosNeedsHome ? '<p class="hint" style="color:#d6303f">iPhone では、この ページを「ホーム画面に追加」して、ホーム画面の「へんじ」から ひらいた ときだけ 通知を うけとれます。</p>' : ''}
    ${!pushReady() ? '<p class="hint" style="color:#d6303f">この ブラウザは 通知に たいおうして いません。</p>' : ''}
    <div class="row" style="margin-top:6px">${on ? '<button class="btn" id="pushTest">🔔 ためしに おくる</button><button class="btn" id="pushOff">つうちを やめる</button>' : '<button class="btn primary" id="pushOn">🔔 つうちを うけとる</button>'}</div>
    <p class="hint" id="pushMsg">${on ? '✅ つうちが きます' : ''}</p></div>`;
}
function bindNotify() {
  document.querySelectorAll('[data-role]').forEach(b => b.onclick = async () => {
    localStorage.setItem(ROLE_KEY, b.dataset.role);
    if (localStorage.getItem('endogame.pushOn') === '1') { try { const reg = await navigator.serviceWorker.ready; const sub = await reg.pushManager.getSubscription(); if (sub) await pushSubscribe(sub.toJSON(), b.dataset.role); } catch (e) {} }
    render();
  });
  if ($('pushOn')) $('pushOn').onclick = async () => {
    const msg = $('pushMsg');
    try {
      if (!pushReady()) throw new Error('この ブラウザは 通知に たいおうして いません');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') throw new Error('通知が「ゆるさない」に なっています（せっていアプリの つうち で ゆるしてください）');
      const reg = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(() => navigator.serviceWorker.ready);
      const key = Uint8Array.from(atob(VAPID_PUBLIC.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - VAPID_PUBLIC.length % 4) % 4)), c => c.charCodeAt(0));
      const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      await pushSubscribe(sub.toJSON(), localStorage.getItem(ROLE_KEY) || 'papa');
      localStorage.setItem('endogame.pushOn', '1');
      render();
    } catch (e) { msg.textContent = '❌ ' + e.message; }
  };
  if ($('pushTest')) $('pushTest').onclick = async () => {
    try { const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription(); const r = await pushTest(sub.endpoint); $('pushMsg').textContent = r.ok ? '📨 おくりました。すこし まってね' : '❌ おくれませんでした（' + r.status + '）'; }
    catch (e) { $('pushMsg').textContent = '❌ ' + e.message; }
  };
  if ($('pushOff')) $('pushOff').onclick = async () => {
    try { const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription(); if (sub) { await pushUnsubscribe(sub.endpoint); await sub.unsubscribe(); } } catch (e) {}
    localStorage.removeItem('endogame.pushOn'); render();
  };
}
// パパ・ママの しゃしんを サーバーに いれて、ぜんぶの iPad に くばる
function photosHTML() {
  return `<div class="card"><h2>🖼️ しゃしんを iPad に くばる</h2>
    <p class="hint">ここで えらんだ しゃしんが、こどもの iPad の「パパと はなす」「ママと はなす」の ボタンと アイコンに でます（かぞくの かぎが ないと みられません）。たてながで かおが 上の ほうの しゃしんが きれいです。</p>
    <div class="row"><label class="btn">👨 パパの しゃしん<input type="file" accept="image/*" data-who="papa" class="sharePhoto" hidden></label>
    <label class="btn">👩 ママの しゃしん<input type="file" accept="image/*" data-who="mama" class="sharePhoto" hidden></label></div>
    <p class="hint" id="photoMsg"></p></div>`;
}
function cropTo(file, W, H, topBias) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; const k = Math.max(W / img.width, H / img.height), w = img.width * k, h = img.height * k;
      c.getContext('2d').drawImage(img, (W - w) / 2, Math.min(0, (H - h) * topBias), w, h); URL.revokeObjectURL(url); c.toBlob(b => res(b), 'image/jpeg', 0.86); };
    img.onerror = rej; img.src = url;
  });
}
function bindSetup() {
  bindNotify();
  if ($('pairGo')) $('pairGo').onclick = async () => {
    const code = ($('pairIn').value || '').replace(/\D/g, '');
    if (code.length !== 6) { $('pairMsg').textContent = '6けたの ばんごうを いれてください'; return; }
    $('pairMsg').textContent = 'つないでいます…';
    try { await claimPairCode(code, getCfg().server); showSetup = false; $('pairMsg').textContent = '✅ つながりました'; await sync().catch(() => {}); render(); }
    catch (e) { $('pairMsg').textContent = '❌ ' + e.message; }
  };
  document.querySelectorAll('.sharePhoto').forEach(inp => inp.addEventListener('change', async () => {
    const file = inp.files?.[0]; if (!file) return; const who = inp.dataset.who;
    $('photoMsg').textContent = 'おくっています…';
    try {
      const card = await cropTo(file, 600, 800, 0.2), icon = await cropTo(file, 256, 256, 0.25);
      await send({ kidId: '*', kidName: '', thread: who, from: who, image: card, kind: who + 'Photo' });
      await send({ kidId: '*', kidName: '', thread: who, from: who, image: icon, kind: who + 'Icon' });
      await sync();
      $('photoMsg').textContent = `✅ ${who === 'papa' ? 'パパ' : 'ママ'}の しゃしんを くばりました（iPad は つぎに ひらいた ときに かわります）`;
    } catch (e) { $('photoMsg').textContent = '❌ おくれませんでした（' + e.message + '）'; }
  }));
  if ($('save')) $('save').onclick = async () => {
    const server = $('srv').value.trim(), key = $('key').value.trim();
    if (!server || !key) { $('msg').textContent = 'りょうほう いれてください'; return; }
    $('msg').textContent = 'ためしています…';
    try { await testConnection(server, key); setCfg({ server, key, since: 0 }); showSetup = false; $('msg').textContent = '✅ つながりました'; await sync().catch(() => {}); render(); }
    catch (e) { $('msg').textContent = '❌ ' + e.message; }
  };
  document.querySelectorAll('#back').forEach(b => b.onclick = () => { showSetup = false; render(); });
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
      <b>📲 つなぐ ばんごう</b>
      <p style="margin:8px 0">iPad の「⚙️ おうちのひと → 💌 おてがみ」か<br>ママの スマホの へんじページ（⚙️）に いれてください</p>
      <div style="font:900 44px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.12em;color:#2f7fe8;margin:10px 0">${r.code.slice(0, 3)} ${r.code.slice(3)}</div>
      <p class="hint" id="pairLeft">のこり 10:00（1だいに 1かい つかえます）</p>
      <button class="btn primary" id="pairClose" style="margin-top:8px">とじる</button></div>`;
    document.body.appendChild(box);
    const t = setInterval(() => { const s = Math.max(0, Math.round((r.expires - Date.now()) / 1000)); const el = document.getElementById('pairLeft'); if (el) el.textContent = s ? `のこり ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}（1だいに 1かい つかえます）` : 'じかんぎれ。もういちど おしてください'; if (!s) clearInterval(t); }, 1000);
    document.getElementById('pairClose').onclick = () => { clearInterval(t); box.remove(); };
  } catch (e) { alert('ばんごうを つくれませんでした（' + e.message + '）'); }
};
$('syncBtn').onclick = async () => { $('syncBtn').textContent = '…'; try { await sync(); } catch (e) { alert(e.message); } $('syncBtn').innerHTML = '🔄<span class="lbl"> こうしん</span>'; render(); };
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
// 開発用：?demo で ひらくと、見本の おてがみ（この 端末の なかだけ）を ならべる。サーバーに つながって いない ときだけ
if (new URLSearchParams(location.search).has('demo') && !online()) {
  (async () => {
    if ((await allMsgs()).length) return;
    const devBefore = localStorage.getItem('endogame.deviceName'); localStorage.setItem('endogame.deviceName', 'はるとの iPad');
    const t = Date.now() - 3600000, k = { kidId: 'demo-haruto', kidName: 'Haruto' };
    const mk = (o, i) => send({ ...k, ...o }).then(m => m);
    await mk({ thread: 'mama', from: 'kid', text: '🍳 ごはん なあに？' });
    await mk({ thread: 'mama', from: 'mama', text: 'きょうは カレーだよ！ たのしみに しててね' });
    await mk({ thread: 'mama', from: 'kid', text: '❤️ ママ だいすき！' });
    await mk({ thread: 'santa', from: 'kid', text: '🎁 プレゼント たのしみ！' });
    if (devBefore) localStorage.setItem('endogame.deviceName', devBefore); else localStorage.removeItem('endogame.deviceName');
    localStorage.setItem('endogame.papaView', JSON.stringify({ kid: 'haruto', th: 'mama' }));
    render();
  })();
}
