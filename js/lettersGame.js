// EndoGame：サンタさんへの おてがみ ／ パパと おはなし（こどもの 画面）
import { openDrawPad, showBig } from './drawpad.js';
import { sharedImage, parseSetup, deviceName, setDeviceName, DEFAULT_SERVER, claimPairCode } from './letters.js';
import { thread, unheard, send, markHeard, audioURL, audioBlob, imageBlob, sync, online, getCfg, setCfg, testConnection, Recorder, pickMime, speakAs, santaLine, playSanta, stopSanta, unlockAudio } from './letters.js';

const WHO = {
  santa: { name: 'サンタさん', title: '🎅 サンタさんへ おてがみ', img: 'cards/santa.jpg', emoji: '🎅',
    stamps: [['🎁', 'プレゼント たのしみ！'], ['😊', 'いいこに してるよ！'], ['⛄', 'さむいけど げんき？'], ['❤️', 'サンタさん だいすき！']],
    thanks: 'ホッホッホー！ おてがみ ありがとう。ちゃんと よんで、おへんじ するからね。たのしみに まっていてね。' },
  papa: { name: 'パパ', title: '👨 パパと おはなし', img: null, emoji: '👨',
    stamps: [['❤️', 'パパ だいすき！'], ['🎉', 'きょう がんばったよ！'], ['🏠', 'はやく かえってきてね！'], ['😴', 'おやすみなさい']],
    thanks: null },
  mama: { name: 'ママ', title: '👩 ママと おはなし', img: null, emoji: '👩',
    stamps: [['❤️', 'ママ だいすき！'], ['🎉', 'きょう がんばったよ！'], ['🍳', 'ごはん なあに？'], ['😴', 'おやすみなさい']],
    thanks: null },
};
const PAPA_PHOTO = 'endogame.papaPhoto';      // まるい 顔（チャットの アイコン）
const PAPA_CARD = 'endogame.papaCard';        // ボタンの 大きな 絵（この iPad の なかだけ）
const SANTA_CARD = 'cards/santa-card.jpg';    // サンタさんの 全身の 絵
// ママの しゃしん（パパと おなじ しくみ）
const MAMA_PHOTO = 'endogame.mamaPhoto', MAMA_CARD = 'endogame.mamaCard';
const mamaPhoto = () => { try { return localStorage.getItem(MAMA_PHOTO); } catch (e) { return null; } };
const mamaCard = () => { try { return localStorage.getItem(MAMA_CARD) || localStorage.getItem(MAMA_PHOTO); } catch (e) { return null; } };
const papaCard = () => { try { return localStorage.getItem(PAPA_CARD) || localStorage.getItem(PAPA_PHOTO); } catch (e) { return null; } };
// たての 絵（3:4）に する（顔が きれないように 上を のこす）
function portraitPhoto(file, W = 600, H = 800) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const k = Math.max(W / img.width, H / img.height), w = img.width * k, h = img.height * k;
      c.getContext('2d').drawImage(img, (W - w) / 2, Math.min(0, (H - h) * 0.2), w, h);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.84));
    };
    img.onerror = rej; img.src = url;
  });
}
const cardArt = th => {
  const src = th === 'santa' ? SANTA_CARD : th === 'mama' ? mamaCard() : papaCard();
  const emoji = WHO[th].emoji;
  return `<span class="tc-art"><i>${emoji}</i>${src ? `<img src="${src}" alt="" onerror="this.remove()">` : ''}</span>`;
};
const LIMIT = 5;   // へんじが くるまで おくれる かず
const PIC_LIMIT = 2;   // そのうち 絵は 2まいまで
const picsOf = list => { let n = 0; for (let i = list.length - 1; i >= 0 && list[i].from === 'kid'; i--) if (list[i].hasImage) n++; return n; };
// さいごの へんじの あとに こどもが おくった かず
const streakOf = list => { let n = 0; for (let i = list.length - 1; i >= 0 && list[i].from === 'kid'; i--) n++; return n; };
const papaPhoto = () => { try { return localStorage.getItem(PAPA_PHOTO); } catch (e) { return null; } };
export function whoAvatar(th, cls = '') {
  const w = WHO[th];
  const src = th === 'papa' ? papaPhoto() : th === 'mama' ? mamaPhoto() : w.img;
  return src ? `<span class="lt-av ${cls}"><img src="${src}" alt="" onerror="this.parentNode.textContent='${w.emoji}'"></span>` : `<span class="lt-av ${cls}">${w.emoji}</span>`;
}
const hhmm = ts => { const d = new Date(ts), t = new Date(); const day = d.toDateString() === t.toDateString() ? 'きょう' : `${d.getMonth() + 1}/${d.getDate()}`; return `${day} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };

export function installLetters(api) {
  const { S, SCREENS, ACTIONS, AFTER, BG, LEAVE, go, render, activeProfile, esc, toast, sfx, header, squarePhoto } = api;
  Object.assign(BG, { letters: 'hub' });
  // かんたん せってい：#setup=…（サーバーと かぎ）の リンクで ひらくと つながる。かぎは「#」の あとなので サーバーには おくられない
  if (location.hash.startsWith('#setup=')) {
    const c = parseSetup(location.hash);
    if (c) { setCfg({ server: c.s, key: c.k, since: 0 }); setTimeout(() => toast('✅ おてがみサーバーに つながりました', 3000), 800); }
    history.replaceState(null, '', location.pathname);
  }
  let rec = null, recBlob = null, player = null, poll = null;

  // ---------- ゲームを えらぶ 画面の 下の ボタン ----------
  const hubGames = SCREENS.games;
  SCREENS.games = () => hubGames().replace(/<\/div>\s*$/, `
      <div class="talk-row">
        <button class="talk-card santa" data-act="openLetters" data-th="santa">${cardArt('santa')}<span class="tc-body"><span class="tb-t">サンタさんと <br>はなす</span><span class="tb-s">🎤 こえ・🎨 え・✏️ もじ</span>${online() ? '' : '<span class="tb-off">📡 まだ つながって いないよ</span>'}</span><b class="tb-badge" id="badge-santa" hidden></b></button>
        <button class="talk-card papa" data-act="openLetters" data-th="papa">${cardArt('papa')}<span class="tc-body"><span class="tb-t">パパと <br>はなす</span><span class="tb-s">🎤 こえ・🎨 え・✏️ もじ</span>${online() ? '' : '<span class="tb-off">📡 まだ つながって いないよ</span>'}</span><b class="tb-badge" id="badge-papa" hidden></b></button>
        <button class="talk-card mama" data-act="openLetters" data-th="mama">${cardArt('mama')}<span class="tc-body"><span class="tb-t">ママと <br>はなす</span><span class="tb-s">🎤 こえ・🎨 え・✏️ もじ</span>${online() ? '' : '<span class="tb-off">📡 まだ つながって いないよ</span>'}</span><b class="tb-badge" id="badge-mama" hidden></b></button>
      </div>
    </div>`);
  const badges = async () => {
    const p = activeProfile(); if (!p) return;
    const n = await unheard(p);
    for (const th of ['santa', 'papa', 'mama']) { const b = document.getElementById('badge-' + th); if (b) { b.hidden = !n[th]; b.textContent = n[th] ? `おへんじ ${n[th]}` : ''; } }
  };
  // パパの しゃしんが サーバーに あれば この iPad に とりこむ（この iPad で えらんだ ものより あたらしい ときだけ）
  const blobToURL = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
  let pulledAll = false;
  async function pullShared(who, CARD, ICON) {
    try {
      let card = await sharedImage(who + 'Photo');
      // みつからない ときは サーバーから ぜんぶ とりなおす（いちどだけ）
      if (!card && who === 'papa' && online() && !pulledAll) { pulledAll = true; setCfg({ since: 0 }); await sync().catch(() => {}); card = await sharedImage('papaPhoto'); }
      if (!card) return false;
      const mine = Number(localStorage.getItem(`endogame.${who}PhotoTs`) || 0);
      if (card.ts <= mine) return false;
      const icon = await sharedImage(who + 'Icon');
      const cb = await imageBlob(card), ib = icon && await imageBlob(icon);
      if (!cb) return false;
      localStorage.setItem(CARD, await blobToURL(cb));
      localStorage.setItem(ICON, ib ? await blobToURL(ib) : await blobToURL(cb));
      localStorage.setItem(`endogame.${who}PhotoTs`, String(card.ts));
      return true;
    } catch (e) { return false; }
  }
  async function pullPapaPhoto() { const a = await pullShared('papa', PAPA_CARD, PAPA_PHOTO), b = await pullShared('mama', MAMA_CARD, MAMA_PHOTO); return a || b; }
  // おきた とき：つながって いれば すぐ あたらしい ものと パパの しゃしんを もらう
  if (online()) setTimeout(() => sync().then(async () => { if (await pullPapaPhoto() && S.screen === 'games') render(); else badges(); }).catch(() => {}), 300);
  const prevGames = AFTER.games;
  AFTER.games = () => { prevGames?.(); badges(); sync().then(async n => { if (n) badges(); if (await pullPapaPhoto() && S.screen === 'games') render(); }).catch(() => {}); };

  // ---------- おてがみの 画面 ----------
  SCREENS.letters = () => {
    const p = activeProfile(), th = S.lettersTo, w = WHO[th];
    return `
    ${header(p, { back: 'games' })}
    <div class="page letters ${th}">
      <div class="lt-head">${whoAvatar(th, 'xl')}<div><h2>${w.title}</h2><p class="sub">${th === 'santa' ? 'こえ・え・もじ で サンタさんに おてがみを おくろう' : `こえ・え・もじ で ${w.name}に おくろう`}</p>${online() ? '' : '<p class="lt-off">📡 まだ つながっていないので、おくった ものは この たんまつに たまるよ（おうちのひとに つないでもらってね）</p>'}</div></div>
      <div class="lt-list" id="ltList"><p class="lt-empty">よみこみちゅう…</p></div>
      <div class="lt-rec" id="ltRec"></div>
      <div class="lt-stamps" id="ltStamps">${w.stamps.map(([e, t], i) => `<button class="lt-stamp" data-act="ltStamp" data-i="${i}">${e} ${t}</button>`).join('')}</div>
    </div>`;
  };
  let STREAK = 0, PICS = 0;
  const recArea = (state, sec = 0) => {
    const el = document.getElementById('ltRec'); if (!el) return;
    const canRec = pickMime() !== null && navigator.mediaDevices?.getUserMedia;
    const left = LIMIT - STREAK, who = WHO[S.lettersTo].name;
    if (state === 'idle' && left <= 0) state = 'wait';
    document.getElementById('ltStamps')?.classList.toggle('off', state === 'wait');
    el.innerHTML = state === 'wait'
      ? `<div class="lt-wait">📮 ${LIMIT}かい おくったよ！<br><b>${who}の おへんじを まってね</b><small>おへんじが きたら また おくれるよ</small></div>`
      : state === 'text'
      ? `<div class="lt-text"><textarea id="ltTxt" maxlength="100" placeholder="ここに かいてね（キーボードの 🎤 で しゃべっても かけるよ）"></textarea>
          <div class="row center wrap"><button class="btn primary big" data-act="ltSendText">📮 おくる</button><button class="btn ghost" data-act="ltCancel">やめる</button></div></div>`
      : state === 'rec'
      ? `<button class="lt-mic on" data-act="ltStop"><span>⏹️</span></button><div class="lt-rec-msg">はなしてね… <b>${Math.floor(sec)}</b> / 30びょう<br><small>おわったら もういちど おしてね</small></div>`
      : state === 'done'
      ? `<div class="row center wrap"><button class="btn" data-act="ltPreview">▶️ きいてみる</button><button class="btn primary big" data-act="ltSend">📮 おくる</button><button class="btn ghost" data-act="ltCancel">🗑️ やりなおす</button></div>`
      : state === 'sending' ? `<div class="lt-rec-msg">おくっているよ…</div>`
      : `<div class="lt-modes">
           ${canRec ? `<button class="lt-mode voice" data-act="ltRec"><i>🎤</i><span>こえ</span></button>` : ''}
           <button class="lt-mode draw ${PICS >= PIC_LIMIT ? 'off' : ''}" data-act="ltDraw"><i>🎨</i><span>え</span></button>
           <button class="lt-mode text" data-act="ltText"><i>✏️</i><span>もじ</span></button>
         </div>
         <div class="lt-left">あと <b>${left}</b>かい おくれるよ${PICS >= PIC_LIMIT ? '（え は おへんじが きたら また かけるよ）' : `（え は あと ${PIC_LIMIT - PICS}まい）`}</div>`;
    if (state === 'text') setTimeout(() => document.getElementById('ltTxt')?.focus(), 50);
  };
  async function fillList() {
    const p = activeProfile(), th = S.lettersTo, el = document.getElementById('ltList');
    if (!el || !p) return;
    const list = await thread(p, th);
    const before = STREAK + PICS * 100; STREAK = streakOf(list); PICS = picsOf(list);
    if (before !== STREAK + PICS * 100) { const r = document.getElementById('ltRec'); if (r && !rec && !recBlob && !r.querySelector('#ltTxt')) recArea('idle'); }
    if (!list.length) { el.innerHTML = `<p class="lt-empty">${th === 'santa' ? 'サンタさんに はじめての おてがみを おくってみよう！' : `${WHO[th].name}に メッセージを おくってみよう！`}</p>`; return; }
    el.innerHTML = list.map(m => {
      const mine = m.from === 'kid';
      return `<div class="bub-row ${mine ? 'mine' : 'them'}">
        ${mine ? '' : whoAvatar(th)}
        <button class="bub ${mine ? 'mine' : 'them'} ${!mine && !m.heard ? 'new' : ''}" data-act="ltPlay" data-id="${m.id}">
          ${m.hasImage ? `<img class="bub-img" data-img="${m.id}" alt="え">` : `<span class="bub-play">${m.hasAudio ? '🔊' : '💬'}</span>`}
          ${m.text ? `<span class="bub-text">${esc(m.text)}</span>` : m.hasAudio ? `<span class="bub-text voice">${mine ? 'こえの おてがみ' : 'こえの おへんじ'}</span>` : ''}
          ${!mine && !m.heard ? '<b class="bub-new">あたらしい！</b>' : ''}
          <small class="bub-time">${hhmm(m.ts)}${mine && online() && !m.synced ? '・まだ とどいていないよ' : ''}</small>
        </button>
      </div>`;
    }).join('');
    el.scrollTop = el.scrollHeight;
    LIST = list;
    // 絵を よみこむ
    el.querySelectorAll('img[data-img]').forEach(async im => {
      const m = list.find(x => x.id === im.dataset.img);
      const b = m && await imageBlob(m).catch(() => null);
      if (b) { im.src = URL.createObjectURL(b); im.onload = () => { el.scrollTop = el.scrollHeight; }; } else im.alt = 'え（よみこみちゅう）';
    });
  }
  let LIST = [];
  AFTER.letters = () => {
    fillList().then(() => recArea('idle'));
    clearInterval(poll);
    poll = setInterval(() => sync().then(n => { if (n) { sfx.bonus?.(); fillList(); } }).catch(() => {}), 15000);
    sync().then(n => n && fillList()).catch(() => {});
    if (S.lettersTo === 'santa') setTimeout(() => santaSays('greet', 'メリークリスマス！ サンタさんだよ。おはなし きかせてね。'), 400);
  };
  LEAVE.letters = () => { clearInterval(poll); rec?.cancel(); rec = null; recBlob = null; player?.pause(); speechSynthesis.cancel(); stopSanta(); };
  // サンタの きまり文句：パパが ろくおんした こえ（サンタ風）。なければ よみあげ
  async function santaSays(kind, fallback) {
    const m = await santaLine(kind).catch(() => null);
    const b = m && await audioBlob(m).catch(() => null);
    if (b) { try { await playSanta(b); return; } catch (e) {} }
    speakAs(fallback, 'santa');
  }

  async function playMsg(m) {
    player?.pause(); speechSynthesis.cancel(); stopSanta();
    if (m.from !== 'kid' && !m.heard) { m.heard = true; markHeard(m.id).then(fillList); }
    if (m.hasImage) {
      const b = await imageBlob(m).catch(() => null);
      if (b) showBig(URL.createObjectURL(b));
      if (!m.hasAudio && !m.text) return;
    }
    if (m.hasAudio && m.from === 'santa') {
      const b = await audioBlob(m).catch(() => null);
      if (b) { try { await playSanta(b); } catch (e) { toast('こえを よみこめなかったよ'); } } else toast('こえを よみこめなかったよ');
    } else if (m.hasAudio) {
      const url = await audioURL(m).catch(() => null);
      if (url) { player = new Audio(url); await player.play().catch(() => {}); }
      else toast('こえを よみこめなかったよ');
    } else if (m.text) {
      speakAs(m.text, m.from === 'santa' ? 'santa' : m.from === 'papa' ? 'papa' : m.from === 'mama' ? 'mama' : 'kid');
    }
  }
  async function deliver({ text = '', audio = null, image = null }) {
    const p = activeProfile(), th = S.lettersTo, cur = await thread(p, th);
    if (streakOf(cur) >= LIMIT) { recArea('wait'); toast(`${WHO[th].name}の おへんじを まってね`); return; }
    if (image && picsOf(cur) >= PIC_LIMIT) { toast('え は 2まいまで。おへんじを まってね'); return; }
    recArea('sending');
    await send({ kidId: p.id, kidName: p.name, thread: th, from: 'kid', text, audio, image });
    await sync().catch(() => {});
    recBlob = null; await fillList(); recArea('idle');
    sfx.bonus?.();
    if (th === 'santa') { toast('🎅 サンタさんに とどけたよ！', 2600); santaSays('thanks', WHO.santa.thanks); }
    else toast(`📮 ${WHO[th].name}に おくったよ！`, 2600);
    setTimeout(fillList, 4000);
  }

  Object.assign(ACTIONS, {
    openLetters: d => { sfx.tap(); unlockAudio(); go('letters', { lettersTo: d.th }); },
    ltRec: async () => {
      try {
        speechSynthesis.cancel(); player?.pause();
        rec = await new Recorder().start(30, s => recArea('rec', s));
        recArea('rec', 0);
        rec.done.then(b => { recBlob = b; rec = null; if (S.screen === 'letters') recArea('done'); });
      } catch (e) { rec = null; toast('マイクが つかえないよ。おうちのひとに きいてね', 3000); recArea('idle'); }
    },
    ltStop: () => { rec?.stop(); },
    ltPreview: () => { if (!recBlob) return; player?.pause(); player = new Audio(URL.createObjectURL(recBlob)); player.play().catch(() => {}); },
    ltCancel: () => { recBlob = null; recArea('idle'); },
    ltText: () => { speechSynthesis.cancel(); recArea('text'); },
    ltDraw: async () => {
      if (PICS >= PIC_LIMIT) { toast('え は 2まいまで。おへんじが きたら また かけるよ', 2800); return; }
      speechSynthesis.cancel(); stopSanta();
      const img = await openDrawPad({ title: `${WHO[S.lettersTo].name}に えを かこう` });
      if (img) deliver({ image: img });
    },
    ltSendText: () => { const t = document.getElementById('ltTxt')?.value.trim(); if (!t) { toast('なにか かいてね'); return; } deliver({ text: t.slice(0, 100) }); },
    ltSend: () => { if (recBlob) deliver({ audio: recBlob }); },
    ltStamp: d => { const [e, t] = WHO[S.lettersTo].stamps[Number(d.i)]; deliver({ text: `${e} ${t}` }); },
    ltPlay: d => { unlockAudio(); const m = LIST.find(x => x.id === d.id); if (m) playMsg(m); },
  });

  // ---------- おうちのひと メニュー（💌 おてがみ） ----------
  return {
    parentHTML: () => {
      const c = getCfg(), ph = papaPhoto();
      return `
      <div class="card"><h3>👨 パパの しゃしん</h3>
        <p class="hint">「パパと はなす」の 大きな ボタンと、おへんじの アイコンに でます。この iPad で えらぶと、この iPad の なかだけに ほぞんします。サーバーに つないでいると、パパが かぞくの サーバーに いれた しゃしんが じどうで とどきます（かぎが ないと みられません）。たてながの しゃしん（かおが 上の ほう）が きれいに うつります。</p>
        <div class="row wrap">${ph ? `<img src="${papaCard()}" alt="" style="width:90px;height:120px;object-fit:cover;border-radius:12px"><img class="avatar-img lg" src="${ph}" alt="">` : '<span class="avatar lg">👨</span>'}
          <label class="btn sm">📷 しゃしんを えらぶ<input type="file" accept="image/*" id="papaPhotoInput" hidden></label>
          ${ph ? '<button class="btn sm ghost" data-act="ltPapaPhotoOff">しゃしんを はずす</button>' : ''}</div>
      </div>
      <div class="card"><h3>👩 ママの しゃしん</h3>
        <p class="hint">「ママと はなす」の ボタンと アイコンに でます（えらぶと この iPad の なかだけ。ママが サーバーに いれた しゃしんは じどうで とどきます）。</p>
        <div class="row wrap">${mamaPhoto() ? `<img src="${mamaCard()}" alt="" style="width:90px;height:120px;object-fit:cover;border-radius:12px"><img class="avatar-img lg" src="${mamaPhoto()}" alt="">` : '<span class="avatar lg">👩</span>'}
          <label class="btn sm">📷 しゃしんを えらぶ<input type="file" accept="image/*" id="mamaPhotoInput" hidden></label>
          ${mamaPhoto() ? '<button class="btn sm ghost" data-act="ltMamaPhotoOff">しゃしんを はずす</button>' : ''}</div>
      </div>
      <div class="card"><h3>📱 かぞくの サーバーに つなぐ ${online() ? '<span style="color:#2a9d4a">✅ つながっています</span>' : '<span style="color:#d9343a">📡 まだ</span>'}</h3>
        <div style="background:#eef6ff;border-radius:14px;padding:12px 14px;margin:6px 0 12px">
          <b>いちばん かんたん：つなぐ ばんごう（6けた）</b>
          <p class="hint" style="margin:4px 0 8px">パパの スマホの へんじページで「📲 iPadを つなぐ」を おすと 6けたの ばんごうが でます。それを いれて「つなぐ」。</p>
          <div class="row wrap"><input id="ltPair" inputmode="numeric" maxlength="7" placeholder="123 456" style="max-width:160px;font-size:1.4rem;letter-spacing:.1em;text-align:center"><button class="btn primary" data-act="ltPairGo">つなぐ</button></div>
        </div>
        <p class="hint">または「かぞくの かぎ」を いれても つながります。つながると、こどもの おてがみが パパの スマホに とどき、パパの しゃしんや おへんじが この たんまつに とどきます。かぎの かわりに「かんたん せっていの リンク」を まるごと はりつけても OK です。</p>
        <label class="field"><span>かぞくの かぎ</span><input id="ltKey" type="password" value="${esc(c.key || '')}" autocomplete="off" placeholder="xxxxx-xxxxx-xxxxx-xxxxx"></label>
        <details><summary class="hint">くわしい せってい（サーバーの アドレス）</summary><label class="field"><span>サーバーの アドレス</span><input id="ltServer" value="${esc(c.server || DEFAULT_SERVER)}" autocomplete="off"></label></details>
        <div class="row wrap"><button class="btn sm primary" data-act="ltSaveCfg">つなぐ</button>${online() ? '<button class="btn sm ghost" data-act="ltClearCfg">つなぐのを やめる</button>' : ''}</div>
        <p class="hint" id="ltCfgMsg"></p>
      </div>
      <div class="card"><h3>📛 この たんまつの なまえ</h3>
        <p class="hint">パパの へんじページで「どの たんまつから きたか」が わかるように なります（れい：はるとの iPad）。</p>
        <div class="row wrap"><input id="ltDevice" value="${esc(deviceName())}" maxlength="20" style="max-width:240px"><button class="btn sm" data-act="ltSaveDevice">ほぞん</button></div>
      </div>
      <div class="card"><h3>✉️ おへんじを かく</h3>
        <p class="hint">へんじページで、こどもの こえを きいて、パパ または サンタさん として おへんじを かけます。サンタさんの おへんじは、パパの こえを ろくおんすると サンタさん風の こえ（ひくく・ゆっくり）に なります。</p>
        <a class="btn" href="papa.html" target="_blank" rel="noopener">✉️ へんじページを ひらく</a>
        <p class="hint">パパの スマホでは <b>${esc(location.origin + location.pathname.replace(/[^/]*$/, ''))}papa.html</b> を ひらいて、おなじ かぎを いれてください。</p>
      </div>`;
    },
    bindParent: () => {
      const mf = document.getElementById('mamaPhotoInput');
      mf?.addEventListener('change', async () => {
        const file = mf.files?.[0]; if (!file) return;
        try { localStorage.setItem(MAMA_PHOTO, await squarePhoto(file)); localStorage.setItem(MAMA_CARD, await portraitPhoto(file)); localStorage.setItem('endogame.mamaPhotoTs', String(Date.now())); toast('しゃしんを ほぞんしました'); render(); } catch (e) { alert('しゃしんを よみこめませんでした'); }
      });
      const f = document.getElementById('papaPhotoInput');
      f?.addEventListener('change', async () => {
        const file = f.files?.[0]; if (!file) return;
        try { localStorage.setItem(PAPA_PHOTO, await squarePhoto(file)); localStorage.setItem(PAPA_CARD, await portraitPhoto(file)); localStorage.setItem('endogame.papaPhotoTs', String(Date.now())); toast('しゃしんを ほぞんしました'); render(); } catch (e) { alert('しゃしんを よみこめませんでした'); }
      });
    },
    actions: {
      ltMamaPhotoOff: () => { localStorage.removeItem(MAMA_PHOTO); localStorage.removeItem(MAMA_CARD); render(); },
      ltPapaPhotoOff: () => { localStorage.removeItem(PAPA_PHOTO); localStorage.removeItem(PAPA_CARD); render(); },
      ltSaveCfg: async () => {
        const msg = document.getElementById('ltCfgMsg');
        const c = parseSetup(document.getElementById('ltKey').value);
        const server = (c?.s !== DEFAULT_SERVER ? c?.s : '') || document.getElementById('ltServer')?.value.trim() || DEFAULT_SERVER;
        if (!c?.k) { msg.textContent = 'かぞくの かぎを いれてください'; return; }
        msg.textContent = 'つないでいます…';
        try {
          await testConnection(server, c.k); setCfg({ server, key: c.k, since: 0 });
          msg.textContent = '✅ つながりました！ パパの しゃしんや おへんじを うけとっています…';
          await sync().catch(() => {}); await pullPapaPhoto();
          toast('✅ つながりました', 2500); render();
        } catch (e) { msg.textContent = '❌ つながりませんでした（' + e.message + '）'; }
      },
      ltPairGo: async () => {
        const msg = document.getElementById('ltCfgMsg');
        const code = (document.getElementById('ltPair').value || '').replace(/\D/g, '');
        if (code.length !== 6) { msg.textContent = '6けたの ばんごうを いれてください'; return; }
        msg.textContent = 'つないでいます…';
        try {
          await claimPairCode(code, getCfg().server);
          msg.textContent = '✅ つながりました！ パパの しゃしんや おへんじを うけとっています…';
          await sync().catch(() => {}); await pullPapaPhoto();
          toast('✅ つながりました', 2500); render();
        } catch (e) { msg.textContent = '❌ ' + e.message; }
      },
      ltClearCfg: () => { setCfg({ key: '' }); render(); },
      ltSaveDevice: () => { setDeviceName(document.getElementById('ltDevice').value.trim()); toast('ほぞんしました'); render(); },
    },
  };
}
