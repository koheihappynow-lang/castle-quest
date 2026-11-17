// EndoGame：サンタさんへの おてがみ ／ パパと おはなし（こどもの 画面）
import { openDrawPad, showBig } from './drawpad.js';
import { sharedImage } from './letters.js';
import { thread, unheard, send, markHeard, audioURL, audioBlob, imageBlob, sync, online, getCfg, setCfg, testConnection, Recorder, pickMime, speakAs, santaLine, playSanta, stopSanta, unlockAudio } from './letters.js';

const WHO = {
  santa: { name: 'サンタさん', title: '🎅 サンタさんへ おてがみ', img: 'cards/santa.jpg', emoji: '🎅',
    stamps: [['🎁', 'プレゼント たのしみ！'], ['😊', 'いいこに してるよ！'], ['⛄', 'さむいけど げんき？'], ['❤️', 'サンタさん だいすき！']],
    thanks: 'ホッホッホー！ おてがみ ありがとう。ちゃんと よんで、おへんじ するからね。たのしみに まっていてね。' },
  papa: { name: 'パパ', title: '👨 パパと おはなし', img: null, emoji: '👨',
    stamps: [['❤️', 'パパ だいすき！'], ['🎉', 'きょう がんばったよ！'], ['🏠', 'はやく かえってきてね！'], ['😴', 'おやすみなさい']],
    thanks: null },
};
const PAPA_PHOTO = 'endogame.papaPhoto';      // まるい 顔（チャットの アイコン）
const PAPA_CARD = 'endogame.papaCard';        // ボタンの 大きな 絵（この iPad の なかだけ）
const SANTA_CARD = 'cards/santa-card.jpg';    // サンタさんの 全身の 絵
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
  const src = th === 'santa' ? SANTA_CARD : papaCard();
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
  const src = th === 'papa' ? papaPhoto() : w.img;
  return src ? `<span class="lt-av ${cls}"><img src="${src}" alt="" onerror="this.parentNode.textContent='${w.emoji}'"></span>` : `<span class="lt-av ${cls}">${w.emoji}</span>`;
}
const hhmm = ts => { const d = new Date(ts), t = new Date(); const day = d.toDateString() === t.toDateString() ? 'きょう' : `${d.getMonth() + 1}/${d.getDate()}`; return `${day} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };

export function installLetters(api) {
  const { S, SCREENS, ACTIONS, AFTER, BG, LEAVE, go, render, activeProfile, esc, toast, sfx, header, squarePhoto } = api;
  Object.assign(BG, { letters: 'hub' });
  let rec = null, recBlob = null, player = null, poll = null;

  // ---------- ゲームを えらぶ 画面の 下の ボタン ----------
  const hubGames = SCREENS.games;
  SCREENS.games = () => hubGames().replace(/<\/div>\s*$/, `
      <div class="talk-row">
        <button class="talk-card santa" data-act="openLetters" data-th="santa">${cardArt('santa')}<span class="tc-body"><span class="tb-t">サンタさんと<br>はなす</span><span class="tb-s">🎤 こえで おてがみを おくろう</span></span><b class="tb-badge" id="badge-santa" hidden></b></button>
        <button class="talk-card papa" data-act="openLetters" data-th="papa">${cardArt('papa')}<span class="tc-body"><span class="tb-t">パパと<br>はなす</span><span class="tb-s">🎤 こえで メッセージを おくろう</span></span><b class="tb-badge" id="badge-papa" hidden></b></button>
      </div>
    </div>`);
  const badges = async () => {
    const p = activeProfile(); if (!p) return;
    const n = await unheard(p.id);
    for (const th of ['santa', 'papa']) { const b = document.getElementById('badge-' + th); if (b) { b.hidden = !n[th]; b.textContent = n[th] ? `おへんじ ${n[th]}` : ''; } }
  };
  // パパの しゃしんが サーバーに あれば この iPad に とりこむ（この iPad で えらんだ ものより あたらしい ときだけ）
  const blobToURL = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
  async function pullPapaPhoto() {
    try {
      const card = await sharedImage('papaPhoto'); if (!card) return false;
      const mine = Number(localStorage.getItem('endogame.papaPhotoTs') || 0);
      if (card.ts <= mine) return false;
      const icon = await sharedImage('papaIcon');
      const cb = await imageBlob(card), ib = icon && await imageBlob(icon);
      if (!cb) return false;
      localStorage.setItem(PAPA_CARD, await blobToURL(cb));
      localStorage.setItem(PAPA_PHOTO, ib ? await blobToURL(ib) : await blobToURL(cb));
      localStorage.setItem('endogame.papaPhotoTs', String(card.ts));
      return true;
    } catch (e) { return false; }
  }
  const prevGames = AFTER.games;
  AFTER.games = () => { prevGames?.(); badges(); sync().then(async n => { if (n) badges(); if (await pullPapaPhoto() && S.screen === 'games') render(); }).catch(() => {}); };

  // ---------- おてがみの 画面 ----------
  SCREENS.letters = () => {
    const p = activeProfile(), th = S.lettersTo, w = WHO[th];
    return `
    ${header(p, { back: 'games' })}
    <div class="page letters ${th}">
      <div class="lt-head">${whoAvatar(th, 'xl')}<div><h2>${w.title}</h2><p class="sub">${th === 'santa' ? 'こえ・え・もじ で サンタさんに おてがみを おくろう' : 'こえ・え・もじ で パパに おくろう'}</p></div></div>
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
    const list = await thread(p.id, th);
    const before = STREAK + PICS * 100; STREAK = streakOf(list); PICS = picsOf(list);
    if (before !== STREAK + PICS * 100) { const r = document.getElementById('ltRec'); if (r && !rec && !recBlob && !r.querySelector('#ltTxt')) recArea('idle'); }
    if (!list.length) { el.innerHTML = `<p class="lt-empty">${th === 'santa' ? 'サンタさんに はじめての おてがみを おくってみよう！' : 'パパに メッセージを おくってみよう！'}</p>`; return; }
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
      speakAs(m.text, m.from === 'santa' ? 'santa' : m.from === 'papa' ? 'papa' : 'kid');
    }
  }
  async function deliver({ text = '', audio = null, image = null }) {
    const p = activeProfile(), th = S.lettersTo, cur = await thread(p.id, th);
    if (streakOf(cur) >= LIMIT) { recArea('wait'); toast(`${WHO[th].name}の おへんじを まってね`); return; }
    if (image && picsOf(cur) >= PIC_LIMIT) { toast('え は 2まいまで。おへんじを まってね'); return; }
    recArea('sending');
    await send({ kidId: p.id, kidName: p.name, thread: th, from: 'kid', text, audio, image });
    await sync().catch(() => {});
    recBlob = null; await fillList(); recArea('idle');
    sfx.bonus?.();
    if (th === 'santa') { toast('🎅 サンタさんに とどけたよ！', 2600); santaSays('thanks', WHO.santa.thanks); }
    else toast('📮 パパに おくったよ！', 2600);
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
      <div class="card"><h3>📱 パパの スマホと つなぐ</h3>
        <p class="hint">おてがみを あずかる サーバーの アドレスと「かぞくの かぎ」を いれると、こどもの おてがみが パパの スマホに とどき、スマホから おへんじ（パパ／サンタさん）が できます。いれない あいだは、この iPad の なかだけで やりとりします（へんじは この iPad で へんじページを ひらいて かきます）。</p>
        <label class="field"><span>サーバーの アドレス</span><input id="ltServer" placeholder="https://endogame-letters.xxxx.workers.dev" value="${esc(c.server || '')}" autocomplete="off"></label>
        <label class="field"><span>かぞくの かぎ</span><input id="ltKey" type="password" value="${esc(c.key || '')}" autocomplete="off"></label>
        <div class="row wrap"><button class="btn sm primary" data-act="ltSaveCfg">ほぞんして つながるか ためす</button>${c.server ? '<button class="btn sm ghost" data-act="ltClearCfg">つなぐのを やめる</button>' : ''}</div>
        <p class="hint" id="ltCfgMsg">${online() ? '✅ つながる せってい に なっています' : 'いまは この iPad の なかだけ'}</p>
      </div>
      <div class="card"><h3>✉️ おへんじを かく</h3>
        <p class="hint">へんじページで、こどもの こえを きいて、パパ または サンタさん として おへんじを かけます。サンタさんの おへんじは、パパの こえを ろくおんすると サンタさん風の こえ（ひくく・ゆっくり）に なります。</p>
        <a class="btn" href="papa.html" target="_blank" rel="noopener">✉️ へんじページを ひらく</a>
        <p class="hint">パパの スマホでは <b>${esc(location.origin + location.pathname.replace(/[^/]*$/, ''))}papa.html</b> を ひらいて、おなじ アドレスと かぎを いれてください。</p>
      </div>`;
    },
    bindParent: () => {
      const f = document.getElementById('papaPhotoInput');
      f?.addEventListener('change', async () => {
        const file = f.files?.[0]; if (!file) return;
        try { localStorage.setItem(PAPA_PHOTO, await squarePhoto(file)); localStorage.setItem(PAPA_CARD, await portraitPhoto(file)); localStorage.setItem('endogame.papaPhotoTs', String(Date.now())); toast('しゃしんを ほぞんしました'); render(); } catch (e) { alert('しゃしんを よみこめませんでした'); }
      });
    },
    actions: {
      ltPapaPhotoOff: () => { localStorage.removeItem(PAPA_PHOTO); localStorage.removeItem(PAPA_CARD); render(); },
      ltSaveCfg: async () => {
        const server = document.getElementById('ltServer').value.trim(), key = document.getElementById('ltKey').value.trim();
        const msg = document.getElementById('ltCfgMsg');
        if (!server || !key) { msg.textContent = 'アドレスと かぎを りょうほう いれてください'; return; }
        if (!/^https:\/\//.test(server) && !/^http:\/\/(127\.0\.0\.1|localhost)/.test(server)) { msg.textContent = 'アドレスは https:// で はじまります'; return; }
        msg.textContent = 'ためしています…';
        try { await testConnection(server, key); setCfg({ server, key, since: 0 }); msg.textContent = '✅ つながりました！'; sync().catch(() => {}); }
        catch (e) { msg.textContent = '❌ つながりませんでした（' + e.message + '）'; }
      },
      ltClearCfg: () => { setCfg({ server: '', key: '' }); render(); },
    },
  };
}
