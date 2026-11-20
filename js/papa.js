// EndoGame：パパの へんじページ（パパ または サンタさん として へんじする）
import { openDrawPad, showBig } from './drawpad.js';
import { APP_VERSION } from './version.js';
import { getStatus, setControl } from './letters.js';
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
let showWatch = false, watchMsg = '';
let showSetup = false, rec = null, recBlob = null, msgs = [];
let idOf = k => k;
let line = { kind: '', rec: null, blob: null };   // きまり文句の ろくおん
const LINES = [['greet', '👋 あいさつ（画面を開いたとき）', '例：「ホッホッホー！ メリークリスマス！ サンタさんだよ。きょうは どんな おはなしを してくれるのかな？」'],
  ['thanks', '💌 お礼（お手紙が届いたとき）', '例：「ホッホッホー！ おてがみ ありがとう。ちゃんと よんだら おへんじ するからね。」']];

async function render() {
  msgs = await allMsgs();
  const main = $('main');
  document.body.classList.remove('chat');
  if (showWatch && !showSetup) { $('compose').hidden = true; $('watchBtn').innerHTML = '✉️<span class="lbl"> お手紙</span>'; document.querySelector('header h1').textContent = '📊 見守り'; await renderWatch(main); return; }
  $('watchBtn').innerHTML = '📊<span class="lbl"> 見守り</span>'; document.querySelector('header h1').textContent = '✉️ 返事';
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
  if (!kids.length) { $('compose').hidden = true; main.innerHTML = `<div class="card empty">まだお手紙はありません。<br>子どもが送ると、ここに表示されます。</div>${online() ? '' : '<p class="hint">今はこの端末の中だけです（⚙️ でサーバーにつなげます）</p>'}`; return; }
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
    ${list.length ? `<div style="text-align:right;margin:-4px 0 6px"><button class="btn" id="delAll" style="font-size:13px;padding:6px 10px">🗑️ このタブを全部消す（${list.length}通）</button></div>` : ''}
    ${online() || location.search.includes('demo') ? '' : '<p class="hint">今はこの端末の中だけです（⚙️ でサーバーにつなぐと、スマホから返事できます）</p>'}
    ${cur.th === 'santa' ? await linesHTML() : ''}
    <div class="card msgbox" id="msgbox"><div class="msgs">${list.length ? list.map(m => `
      <div class="m ${m.from} ${m.from === 'kid' && !s[m.id] ? 'unread' : ''}">
        <button class="del" data-del="${esc(m.id)}" title="消す">🗑️</button>
        <div class="meta">${m.from === 'kid' ? esc(m.kidName) + (m.device ? `（${esc(m.device)}）` : '') : TH[m.from]}・${when(m.ts)}${m.from !== 'kid' ? (m.heard ? '・✅ 聞いた' : '・未読') : ''}${!m.synced && online() ? ` <span class="unsent">・⚠️ 未送信${m.lastError ? '（' + esc(m.lastError) + '）' : ''}</span> <button class="btn" data-retry="${esc(m.id)}" style="font-size:12px;padding:3px 8px">もう一度送る</button>` : ''}</div>
        ${m.hasImage ? `<img data-img="${esc(m.id)}" alt="絵" style="display:block;width:240px;max-width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px;background:#fff;margin-top:4px;cursor:zoom-in">` : ''}
        ${m.text ? `<div>${esc(m.text)}</div>` : ''}
        ${m.hasAudio && m.from === 'santa' ? `<button class="btn" data-santa="${esc(m.id)}" style="margin-top:4px">🎅 サンタの声で聞く</button>` : m.hasAudio ? `<audio controls preload="none" data-aid="${esc(m.id)}"></audio>` : ''}
        ${m.from === 'santa' && m.text ? `<button class="btn" data-say="${esc(m.id)}" style="margin-top:4px;font-size:13px">🔊 サンタの声で聞く</button>` : ''}
      </div>`).join('') : '<div class="empty">まだありません</div>'}</div></div>`;
  main.querySelectorAll('.tab').forEach(b => b.onclick = () => { cur = { kid: b.dataset.kid, th: b.dataset.th }; localStorage.setItem('endogame.papaView', JSON.stringify(cur)); recBlob = null; render(); });
  main.querySelectorAll('audio[data-aid]').forEach(a => {
    a.addEventListener('play', async () => { if (a.src) return; a.pause(); const m = msgs.find(x => x.id === a.dataset.aid); const u = await audioURL(m).catch(() => null); if (u) { a.src = u; a.play(); } else alert('声を読み込めませんでした'); }, { once: false });
  });
  main.querySelectorAll('[data-say]').forEach(b => b.onclick = () => { const m = msgs.find(x => x.id === b.dataset.say); speakAs(m.text, 'santa'); });
  main.querySelectorAll('[data-santa]').forEach(b => b.onclick = async () => { unlockAudio(); const m = msgs.find(x => x.id === b.dataset.santa); const bl = await audioBlob(m).catch(() => null); if (bl) playSanta(bl); else alert('声を読み込めませんでした'); });
  if (cur.th === 'santa') bindLines();
  main.querySelectorAll('[data-retry]').forEach(b => b.onclick = async () => { b.disabled = true; b.textContent = '送信中…'; try { await retrySend(b.dataset.retry); } catch (e) { alert('送れませんでした（' + e.message + '）'); } render(); });
  main.querySelectorAll('img[data-img]').forEach(async im => {
    const m = msgs.find(x => x.id === im.dataset.img);
    const b = m && await imageBlob(m).catch(() => null);
    if (b) { const u = URL.createObjectURL(b); im.src = u; im.onclick = () => showBig(u); im.onload = () => { const box = $('msgbox'); if (box) box.scrollTop = box.scrollHeight; }; }
  });
  main.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    const m = msgs.find(x => x.id === b.dataset.del); if (!m) return;
    if (!confirm('このお手紙を消しますか？（子どもの端末からも消えます。元に戻せません）')) return;
    try { await deleteMsgs([m.id]); } catch (e) { alert('消せませんでした（' + e.message + '）'); }
    render();
  });
  if ($('delAll')) $('delAll').onclick = async () => {
    if (!confirm(`「${name}」のこのタブのお手紙 ${list.length}通を全部消しますか？（子どもの端末からも消えます。元に戻せません）`)) return;
    try { await deleteMsgs(list.map(m => m.id)); } catch (e) { alert('消せませんでした（' + e.message + '）'); }
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
    <textarea id="txt" placeholder="${santa ? 'サンタとして文字で返事（🎤 声のほうが自然です）' : esc(name) + 'へ返事'}"></textarea>
    <div class="row" style="margin-top:6px">
      <button class="btn ${santa ? 'santa' : 'primary'}" id="sendTxt">${santa ? '🎅 文字を送る' : '📮 送る'}</button>
      ${santa ? `<button class="btn" id="preview">🔊 サンタの声で試す</button>` : ''}
      ${canRec ? `<button class="btn ${santa && !recBlob && !rec ? 'santa' : ''}" id="recBtn">${rec ? '⏹️ 止める' : recBlob ? '🎤 録り直す' : '🎤 声で返事'}</button>` : ''}
      ${recBlob ? `<button class="btn" id="recPlay">${santa ? '🎅 サンタの声で聞く' : '▶️ 聞く'}</button><button class="btn ${santa ? 'santa' : 'primary'}" id="recSend">📮 声を送る</button>` : ''}
      <button class="btn" id="drawBtn">🎨 絵で返事</button>
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
      rec = await new Recorder().start(60, s => { const m = $('recMsg'); if (m) m.textContent = `● 録音中 ${Math.floor(s)}秒`; });
      renderCompose(name);
      rec.done.then(b => { recBlob = b; rec = null; renderCompose(name); });
    } catch (e) { rec = null; alert('マイクが使えません'); }
  };
  $('drawBtn').onclick = async () => {
    const img = await openDrawPad({ title: santa ? 'サンタとして絵を描く' : esc(name) + 'へ絵を描く' });
    if (!img) return;
    await send({ kidId: idOf(cur.kid), kidName: name, thread: cur.th, from: cur.th, image: img }); await sync().catch(() => {});
    render();
  };
  fitPad(); requestAnimationFrame(fitPad);
  if ($('recPlay')) $('recPlay').onclick = () => { if (santa) playSanta(recBlob); else new Audio(URL.createObjectURL(recBlob)).play(); };
  if ($('recSend')) $('recSend').onclick = async () => {
    $('recSend').disabled = true;
    if (!recBlob || !recBlob.size) { alert('録音が空でした。もう一度録音してください'); recBlob = null; renderCompose(name); return; }
    try { await send({ kidId: idOf(cur.kid), kidName: name, thread: cur.th, from: cur.th, audio: recBlob }); }
    catch (e) { alert('声を保存できませんでした（' + e.message + '）'); $('recSend').disabled = false; return; }
    await sync().catch(e => alert('送れませんでした（' + e.message + '）。あとで「もう一度送る」を押してください'));
    recBlob = null; await render();
  };
}

async function linesHTML() {
  const rows = [];
  for (const [k, title, ex] of LINES) {
    const m = await santaLine(k), busy = line.kind === k;
    rows.push(`<div style="border-top:1px solid var(--line);padding:8px 0">
      <b>${title}</b> <span class="hint">${m ? '✅ 録音済み' : '未録音（今は機械の声）'}</span>
      <div class="hint">${ex}</div>
      <div class="row" style="margin-top:4px">
        ${m ? `<button class="btn" data-line-play="${k}">🎅 今の声を聞く</button>` : ''}
        <button class="btn ${busy && line.rec ? '' : 'santa'}" data-line-rec="${k}">${busy && line.rec ? '⏹️ 止める' : busy && line.blob ? '🎤 録り直す' : '🎤 録音'}</button>
        ${busy && line.blob ? `<button class="btn" data-line-try="${k}">🎅 サンタの声で聞く</button><button class="btn primary" data-line-save="${k}">💾 これにする</button>` : ''}
        ${busy && line.rec ? '<span class="recdot" id="lineMsg">● 録音中</span>' : ''}
      </div></div>`);
  }
  return `<details class="card" ${line.kind ? 'open' : ''}><summary><b>🎅 サンタの決まり文句（子ども全員共通）</b></summary>
    <p class="hint">録音したパパの声は、子どもが聞くときに低い声のサンタ風になります。「ホッホッホー」から始めるとサンタらしくなります。</p>${rows.join('')}</details>`;
}
function bindLines() {
  document.querySelectorAll('[data-line-play]').forEach(b => b.onclick = async () => { unlockAudio(); const m = await santaLine(b.dataset.linePlay); const bl = m && await audioBlob(m).catch(() => null); if (bl) playSanta(bl); });
  document.querySelectorAll('[data-line-rec]').forEach(b => b.onclick = async () => {
    unlockAudio(); stopSanta();
    const k = b.dataset.lineRec;
    if (line.rec && line.kind === k) { line.rec.stop(); return; }
    try {
      line = { kind: k, rec: await new Recorder().start(30, sec => { const el = document.getElementById('lineMsg'); if (el) el.textContent = `● 録音中 ${Math.floor(sec)}秒`; }), blob: null };
      render();
      line.rec.done.then(bl => { line.blob = bl; line.rec = null; render(); });
    } catch (e) { line = { kind: '', rec: null, blob: null }; alert('マイクが使えません'); }
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
  const back = '<div class="card"><button class="btn primary" id="back">⬅ 戻る</button></div>';
  const ver = `<div class="card row" style="justify-content:space-between"><span class="hint">🧩 このページの版：<b>${APP_VERSION}</b></span><button class="btn" id="forceUpd">🔄 最新にする</button></div>`;
  const keyCard = (open) => `<details class="card" ${open ? 'open' : ''}><summary><b>🔑 合言葉（鍵）でつなぐ</b></summary>
    <p class="hint">iPad の「おうちのひとメニュー → 💌 おてがみ」に入れたのと同じ鍵を入れても、つながります。</p>
    <label>サーバーのアドレス</label><input id="srv" value="${esc(c.server || '')}" autocomplete="off">
    <label>家族の鍵</label><input id="key" type="password" value="${esc(c.key || '')}" autocomplete="off">
    <div class="row" style="margin-top:10px"><button class="btn primary" id="save">保存してつなぐ</button></div>
    <p class="hint" id="msg"></p></details>`;
  if (online()) return back + notifyHTML() + photosHTML() + keyCard(false) + ver + back;
  return `<div class="card"><h2>📱 6桁の番号でつなぐ</h2>
    <p class="hint">つながっているスマホ（パパ）のこのページで「📲 つなぐ」を押すと、6桁の番号が出ます。それを入れるだけです。</p>
    <div class="row"><input id="pairIn" inputmode="numeric" maxlength="7" placeholder="123 456" style="max-width:170px;font-size:22px;letter-spacing:.1em;text-align:center"><button class="btn primary" id="pairGo">つなぐ</button></div>
    <p class="hint" id="pairMsg"></p>
    <p class="hint">このページをスマホのホーム画面に追加すると、アプリのように開けます（通知も受け取れます）。</p></div>
  ${keyCard(false)}${ver}${msgs.length ? back : ''}`;
}
// 🔔 通知
const ROLE_KEY = 'endogame.parentRole';
const pushReady = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const standaloneApp = () => navigator.standalone || matchMedia('(display-mode: standalone)').matches;
function notifyHTML() {
  const role = localStorage.getItem(ROLE_KEY) || 'papa';
  const on = localStorage.getItem('endogame.pushOn') === '1' && pushReady() && Notification.permission === 'granted';
  const iosNeedsHome = /iPhone|iPad/.test(navigator.userAgent) && !standaloneApp();
  return `<div class="card"><h2>🔔 子どもからのお手紙を通知</h2>
    <p class="hint">私は：</p>
    <div class="segs" style="--n:3">${[['papa', '👨 パパ'], ['mama', '👩 ママ'], ['both', '👪 全部']].map(([k, l]) => `<button class="seg ${role === k ? 'on' : ''}" data-role="${k}">${l}</button>`).join('')}</div>
    <p class="hint">パパ：パパ宛て＋サンタ宛て／ママ：ママ宛て＋サンタ宛て／全部：すべて</p>
    ${iosNeedsHome ? '<p class="hint" style="color:#d6303f">iPhone では、このページを「ホーム画面に追加」して、ホーム画面のアイコンから開いたときだけ通知を受け取れます。</p>' : ''}
    ${!pushReady() ? '<p class="hint" style="color:#d6303f">このブラウザは通知に対応していません。</p>' : ''}
    <div class="row" style="margin-top:6px">${on ? '<button class="btn" id="pushTest">🔔 試しに送る</button><button class="btn" id="pushOff">通知をやめる</button>' : '<button class="btn primary" id="pushOn">🔔 通知を受け取る</button>'}</div>
    <p class="hint" id="pushMsg">${on ? '✅ 通知が届きます' : ''}</p></div>`;
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
      if (!pushReady()) throw new Error('このブラウザは通知に対応していません');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') throw new Error('通知が「許可しない」になっています（設定アプリの「通知」で許可してください）');
      const reg = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(() => navigator.serviceWorker.ready);
      const key = Uint8Array.from(atob(VAPID_PUBLIC.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - VAPID_PUBLIC.length % 4) % 4)), c => c.charCodeAt(0));
      const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      await pushSubscribe(sub.toJSON(), localStorage.getItem(ROLE_KEY) || 'papa');
      localStorage.setItem('endogame.pushOn', '1');
      render();
    } catch (e) { msg.textContent = '❌ ' + e.message; }
  };
  if ($('pushTest')) $('pushTest').onclick = async () => {
    try { const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription(); const r = await pushTest(sub.endpoint); $('pushMsg').textContent = r.ok ? '📨 送りました。少し待ってください' : '❌ 送れませんでした（' + r.status + '）'; }
    catch (e) { $('pushMsg').textContent = '❌ ' + e.message; }
  };
  if ($('pushOff')) $('pushOff').onclick = async () => {
    try { const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription(); if (sub) { await pushUnsubscribe(sub.endpoint); await sub.unsubscribe(); } } catch (e) {}
    localStorage.removeItem('endogame.pushOn'); render();
  };
}
// パパ・ママの しゃしんを サーバーに いれて、ぜんぶの iPad に くばる
function photosHTML() {
  return `<div class="card"><h2>🖼️ 写真を iPad に配る</h2>
    <p class="hint">ここで選んだ写真が、子どもの iPad の「パパと はなす」「ママと はなす」のボタンとアイコンに出ます（家族の鍵がないと見られません）。縦長で、顔が上の方にある写真がきれいに出ます。</p>
    <div class="row"><label class="btn">👨 パパの写真<input type="file" accept="image/*" data-who="papa" class="sharePhoto" hidden></label>
    <label class="btn">👩 ママの写真<input type="file" accept="image/*" data-who="mama" class="sharePhoto" hidden></label></div>
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
  // ふるい 版で とまった ときの ため：保存した プログラムを けして よみなおす（おてがみと せっていは けさない）
  if ($('forceUpd')) $('forceUpd').onclick = async () => {
    $('forceUpd').textContent = '…';
    try { const reg = await navigator.serviceWorker?.getRegistration?.(); if (reg) await reg.update(); } catch (e) {}
    try { for (const k of await caches.keys()) if (!k.startsWith('cq-assets')) await caches.delete(k); } catch (e) {}
    location.replace(location.pathname + '?u=' + Date.now());
  };
  if ($('pairGo')) $('pairGo').onclick = async () => {
    const code = ($('pairIn').value || '').replace(/\D/g, '');
    if (code.length !== 6) { $('pairMsg').textContent = '6桁の番号を入れてください'; return; }
    $('pairMsg').textContent = '接続中…';
    try { await claimPairCode(code, getCfg().server); showSetup = false; $('pairMsg').textContent = '✅ つながりました'; await sync().catch(() => {}); render(); }
    catch (e) { $('pairMsg').textContent = '❌ ' + e.message; }
  };
  document.querySelectorAll('.sharePhoto').forEach(inp => inp.addEventListener('change', async () => {
    const file = inp.files?.[0]; if (!file) return; const who = inp.dataset.who;
    $('photoMsg').textContent = '送信中…';
    try {
      const card = await cropTo(file, 600, 800, 0.2), icon = await cropTo(file, 256, 256, 0.25);
      await send({ kidId: '*', kidName: '', thread: who, from: who, image: card, kind: who + 'Photo' });
      await send({ kidId: '*', kidName: '', thread: who, from: who, image: icon, kind: who + 'Icon' });
      await sync();
      $('photoMsg').textContent = `✅ ${who === 'papa' ? 'パパ' : 'ママ'}の写真を配りました（iPad は次に開いたときに変わります）`;
    } catch (e) { $('photoMsg').textContent = '❌ 送れませんでした（' + e.message + '）'; }
  }));
  if ($('save')) $('save').onclick = async () => {
    const server = $('srv').value.trim(), key = $('key').value.trim();
    if (!server || !key) { $('msg').textContent = '両方入れてください'; return; }
    $('msg').textContent = '確認中…';
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
        b.innerHTML = '✅ <b>設定できました！</b><br>このまま下の<b>共有ボタン（□↑）→「ホーム画面に追加」</b>を押してください。次からはアイコンを押すだけで開けます。';
        document.querySelector('header').after(b);
      }
    }
  } catch (e) { console.warn('setup link', e); }
}

$('setBtn').onclick = () => { showSetup = true; render(); };
$('watchBtn').onclick = () => { showWatch = !showWatch; showSetup = false; window.scrollTo(0, 0); render(); };
// みまもりを ひらいている あいだは 30びょう ごとに こうしん
setInterval(() => { if (showWatch && !showSetup && document.visibilityState === 'visible' && document.activeElement?.id !== 'wMsg') render(); }, 30000);
// 📲 iPad を つなぐ：6けたの ばんごうを だす（10ぷん）
$('pairBtn').onclick = async () => {
  if (!online()) { alert('先にこのページをサーバーにつないでください（⚙️）'); return; }
  try {
    const r = await makePairCode();
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;inset:0;z-index:50;background:rgba(20,30,50,.6);display:flex;align-items:center;justify-content:center;padding:16px';
    box.innerHTML = `<div style="background:#fff;border-radius:18px;padding:22px 20px;max-width:380px;width:100%;text-align:center;font-size:16px;line-height:1.6">
      <b>📲 つなぐ番号</b>
      <p style="margin:8px 0">iPad の「⚙️ おうちのひと → 💌 おてがみ」か、<br>ママのスマホの返事ページ（⚙️）に入れてください</p>
      <div style="font:900 44px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.12em;color:#2f7fe8;margin:10px 0">${r.code.slice(0, 3)} ${r.code.slice(3)}</div>
      <p class="hint" id="pairLeft">残り 10:00（1台に1回使えます）</p>
      <button class="btn primary" id="pairClose" style="margin-top:8px">閉じる</button></div>`;
    document.body.appendChild(box);
    const t = setInterval(() => { const s = Math.max(0, Math.round((r.expires - Date.now()) / 1000)); const el = document.getElementById('pairLeft'); if (el) el.textContent = s ? `残り ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}（1台に1回使えます）` : '時間切れです。もう一度押してください'; if (!s) clearInterval(t); }, 1000);
    document.getElementById('pairClose').onclick = () => { clearInterval(t); box.remove(); };
  } catch (e) { alert('番号を作れませんでした（' + e.message + '）'); }
};
$('syncBtn').onclick = async () => { $('syncBtn').textContent = '…'; try { await sync(); } catch (e) { alert(e.message); } $('syncBtn').innerHTML = '🔄<span class="lbl"> 更新</span>'; render(); };
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

// ---------- 📊 みまもり ----------
const DOW = ['日', '月', '火', '水', '木', '金', '土'];
const MSGS = ['ごはんだよ', 'おふろだよ', 'そとで あそぼう', 'ねる じかんだよ', 'しゅくだいを しよう'];
const hm = ts => { const d = new Date(ts); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
const ago = ts => { const m = Math.round((Date.now() - ts) / 60000); return m < 1 ? 'たった今' : m < 60 ? `${m}分前` : m < 1440 ? `${Math.round(m / 60)}時間前` : when(ts); };
const pctOf = (a, b) => b ? Math.round(a / b * 100) : 0;
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
function timeOfDay(hours) {
  const parts = [['朝', 5, 10], ['昼', 10, 15], ['夕方', 15, 18], ['夜', 18, 24]].map(([n, a, b]) => [n, hours.slice(a, b).reduce((s, v) => s + v, 0)]);
  const tot = parts.reduce((s, [, v]) => s + v, 0); if (!tot) return '';
  const top = parts.sort((a, b) => b[1] - a[1])[0];
  return `${top[0]}によく遊んでいます（${pctOf(top[1], tot)}%）`;
}
// ようすから「けいこう」の ひとこと
function tips(r, todayMin) {
  const t = [];
  const days = r.days || [], played = days.filter(d => d.sec >= 60).length;
  if (r.streak >= 3) t.push(`🔥 ${r.streak}日続けて遊んでいます。ほめてあげてください`);
  if (played <= 1 && days.length) t.push('📉 この1週間はあまり遊んでいません');
  const w = (r.weak || [])[0]; if (w) t.push(`🤔 「${w.k.replace(/^\S+ /, '')}」で間違いが多めです（正解率 ${pctOf(w.ok, w.n)}%）。一緒にやってみるのもおすすめです`);
  const s = (r.strong || [])[0]; if (s) t.push(`⭐ 「${s.k.replace(/^\S+ /, '')}」が得意です（正解率 ${pctOf(s.ok, s.n)}%）`);
  if (r.limitMin && todayMin >= r.limitMin) t.push('⏰ 今日の遊べる時間を使い切りました');
  return t;
}
async function renderWatch(main) {
  if (!online()) { main.innerHTML = '<div class="card empty">サーバーにつながると、子どもの様子が見られます（⚙️）</div>'; return; }
  let st; try { st = await getStatus(); } catch (e) { main.innerHTML = `<div class="card empty">読み込めませんでした（${esc(e.message)}）</div>`; return; }
  const kids = new Map();
  for (const row of st.rows) { const k = kids.get(row.kid) || []; k.push(row); kids.set(row.kid, k); }
  if (!kids.size) { main.innerHTML = '<div class="card empty">まだ様子が届いていません。<br>子どもが iPad で遊ぶと、1分ほどでここに表示されます。<br><small>iPad がサーバーにつながっている必要があります</small></div>'; return; }
  const td = todayStr();
  main.innerHTML = [...kids.entries()].map(([kid, rows]) => {
    rows.sort((a, b) => b.ts - a.ts);
    const top = rows[0], r = top.rep || {}, name = top.name || kid;
    const ctl = st.controls[kid];
    const playing = rows.some(x => x.rep?.playing && Date.now() - x.ts < 150000);
    const todayMin = Math.round(rows.reduce((s, x) => s + ((x.rep?.days || []).find(d => d.d === td)?.sec || 0), 0) / 60);
    const lim = r.limitMin || 0, over = lim && todayMin >= lim;
    const now = ctl ? `<span class="w-now off">🌙 おやすみ中（〜${hm(ctl.until)}）</span>` : playing ? '<span class="w-now on">🟢 今遊んでいます</span>' : `<span class="w-now">最終：${ago(top.ts)}</span>`;
    const maxSec = Math.max(1800, ...(r.days || []).map(d => d.sec));
    const week = (r.days || []).map(d => { const dt = new Date(d.d + 'T00:00'); return `<div class="w-day ${d.d === td ? 'today' : ''}" title="${d.n}問"><i style="height:${Math.round(d.sec / maxSec * 80)}%"></i><span>${Math.round(d.sec / 60)}</span><span>${DOW[dt.getDay()]}</span></div>`; }).join('');
    const AREA_JA = { えいご: '英語', さんすう: '算数', パズル: 'パズル', やさしい: 'やさしいモード', ふくしゅう: '復習' };
    const areas = Object.entries(r.areas || {}).sort((a, b) => b[1].n - a[1].n).map(([k, v]) => { const p = pctOf(v.ok, v.n); return `<div class="w-area"><span>${esc(AREA_JA[k] || k)}</span><div class="w-bar ${p < 60 ? 'low' : p < 80 ? 'mid' : ''}"><i style="width:${p}%"></i></div><small>${p}%・${v.n}問</small></div>`; }).join('');
    const li = (arr, f) => arr && arr.length ? `<ul class="w-list">${arr.map(f).join('')}</ul>` : '<p class="hint">まだデータが少ないです</p>';
    const tipList = tips(r, todayMin);
    const tod = timeOfDay(r.hours || []);
    const others = rows.length > 1 ? `<p class="hint">使っている端末：${rows.map(x => `${esc(x.device || '？')}（${ago(x.ts)}）`).join('・')}</p>` : (top.device ? `<p class="hint">端末：${esc(top.device)}</p>` : '');
    return `<div class="card" data-kid="${esc(kid)}">
      <div class="w-head"><h2>${esc(name)}</h2>${now}</div>
      ${playing && r.doing ? `<p class="w-doing">今：${esc(r.doing)}</p>` : ''}
      <div class="w-today">今日 <b>${todayMin}</b> 分${lim ? ` ／ 上限 ${lim}分` : ''}</div>
      ${lim ? `<div class="w-bar ${over ? 'over' : ''}"><i style="width:${Math.min(100, pctOf(todayMin, lim))}%"></i></div>` : ''}
      ${ctl ? `${ctl.msg ? `<p class="hint">ひとこと：${esc(ctl.msg)}</p>` : ''}<button class="btn w-resume" data-resume="${esc(kid)}">▶ 遊んでいいよ（おやすみを解除）</button>`
        : `<div class="w-pause"><button class="btn" data-pause="30">⏸ 30分</button><button class="btn" data-pause="60">⏸ 1時間</button><button class="btn" data-pause="day">🌙 今日は終了</button></div>
        <div class="w-chips">${MSGS.map(m => `<button class="w-chip ${watchMsg === m ? 'on' : ''}" data-msg="${esc(m)}">${esc(m)}</button>`).join('')}</div>
        <p class="hint" style="margin:4px 0 0">ひとことを選んでから ⏸ を押すと、iPad に表示されます（なしでも OK）</p>`}
      ${tipList.length ? `<div class="w-tip">${tipList.map(esc).join('<br>')}</div>` : ''}
      <div class="w-sec">この1週間（分）</div><div class="w-week">${week}</div>
      <div class="w-sec">教科別の正解率（2週間）</div>${areas || '<p class="hint">まだ問題を解いていません</p>'}
      <div class="w-sec">⭐ 得意</div>${li(r.strong, x => `<li>${esc(x.k)}（${pctOf(x.ok, x.n)}%・${x.n}問）</li>`)}
      <div class="w-sec">🤔 苦手</div>${li(r.weak, x => `<li>${esc(x.k)}（${pctOf(x.ok, x.n)}%・${x.n}問）</li>`)}
      ${(r.weakWords || []).length ? `<div class="w-sec">よく間違える英単語</div>${li(r.weakWords, w => `<li>${esc(w.pic)} ${esc(w.en)}（${esc(w.ja)}）× ${w.wrong}</li>`)}` : ''}
      <div class="w-sec">その他</div>
      <ul class="w-list">${tod ? `<li>${tod}</li>` : ''}<li>連続 ${r.streak || 0}日</li><li>完成したお城 ${r.castles || 0}つ ／ 恐竜 ${r.dinos || 0}匹</li>${r.ghosts ? `<li>復習待ちの単語（おばけ） ${r.ghosts}語</li>` : ''}${r.easy ? '<li>🌈 やさしいモード：オン</li>' : ''}</ul>
      ${others}
    </div>`;
  }).join('') + '<p class="hint" style="text-align:center">子どもの iPad が開いている間、1分ごとに更新されます</p>';
  // おやすみ・ひとこと
  main.querySelectorAll('[data-msg]').forEach(b => b.onclick = () => { watchMsg = watchMsg === b.dataset.msg ? '' : b.dataset.msg; render(); });
  main.querySelectorAll('[data-pause]').forEach(b => b.onclick = async () => {
    const kid = b.closest('[data-kid]').dataset.kid, v = b.dataset.pause;
    let until; if (v === 'day') { const d = new Date(); d.setHours(23, 59, 0, 0); until = d.getTime(); } else until = Date.now() + Number(v) * 60000;
    b.textContent = '…';
    try { await setControl(kid, until, watchMsg); watchMsg = ''; } catch (e) { alert('できませんでした（' + e.message + '）'); }
    render();
  });
  main.querySelectorAll('[data-resume]').forEach(b => b.onclick = async () => {
    b.textContent = '…';
    try { await setControl(b.dataset.resume, 0); } catch (e) { alert('できませんでした（' + e.message + '）'); }
    render();
  });
}
