// EndoGame：サンタさんへの おてがみ ／ パパと おはなし（こどもの 画面）
import { thread, unheard, send, markHeard, audioURL, sync, online, getCfg, setCfg, testConnection, Recorder, pickMime, speakAs } from './letters.js';

const WHO = {
  santa: { name: 'サンタさん', title: '🎅 サンタさんへ おてがみ', img: 'cards/santa.jpg', emoji: '🎅',
    stamps: [['🎁', 'プレゼント たのしみ！'], ['😊', 'いいこに してるよ！'], ['⛄', 'さむいけど げんき？'], ['❤️', 'サンタさん だいすき！']],
    thanks: 'ホッホッホー！ おてがみ ありがとう。ちゃんと よんで、おへんじ するからね。たのしみに まっていてね。' },
  papa: { name: 'パパ', title: '👨 パパと おはなし', img: null, emoji: '👨',
    stamps: [['❤️', 'パパ だいすき！'], ['🎉', 'きょう がんばったよ！'], ['🏠', 'はやく かえってきてね！'], ['😴', 'おやすみなさい']],
    thanks: null },
};
const PAPA_PHOTO = 'endogame.papaPhoto';
const LIMIT = 5;   // へんじが くるまで おくれる かず
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
        <button class="talk-btn santa" data-act="openLetters" data-th="santa">${whoAvatar('santa', 'lg')}<span class="tb-t">サンタさんと はなす</span><span class="tb-s">こえで おてがみを おくろう</span><b class="tb-badge" id="badge-santa" hidden></b></button>
        <button class="talk-btn papa" data-act="openLetters" data-th="papa">${whoAvatar('papa', 'lg')}<span class="tb-t">パパと はなす</span><span class="tb-s">こえで メッセージを おくろう</span><b class="tb-badge" id="badge-papa" hidden></b></button>
      </div>
    </div>`);
  const badges = async () => {
    const p = activeProfile(); if (!p) return;
    const n = await unheard(p.id);
    for (const th of ['santa', 'papa']) { const b = document.getElementById('badge-' + th); if (b) { b.hidden = !n[th]; b.textContent = n[th] ? `おへんじ ${n[th]}` : ''; } }
  };
  const prevGames = AFTER.games;
  AFTER.games = () => { prevGames?.(); badges(); sync().then(n => n && badges()).catch(() => {}); };

  // ---------- おてがみの 画面 ----------
  SCREENS.letters = () => {
    const p = activeProfile(), th = S.lettersTo, w = WHO[th];
    return `
    ${header(p, { back: 'games' })}
    <div class="page letters ${th}">
      <div class="lt-head">${whoAvatar(th, 'xl')}<div><h2>${w.title}</h2><p class="sub">${th === 'santa' ? 'マイクを おして、サンタさんに おはなし してね' : 'マイクを おして、パパに おはなし してね'}</p></div></div>
      <div class="lt-list" id="ltList"><p class="lt-empty">よみこみちゅう…</p></div>
      <div class="lt-rec" id="ltRec"></div>
      <div class="lt-stamps" id="ltStamps">${w.stamps.map(([e, t], i) => `<button class="lt-stamp" data-act="ltStamp" data-i="${i}">${e} ${t}</button>`).join('')}</div>
    </div>`;
  };
  let STREAK = 0;
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
      : `${canRec ? `<button class="lt-mic" data-act="ltRec"><span>🎤</span></button><div class="lt-rec-msg">おして はなす</div>` : ''}
         <button class="lt-pen" data-act="ltText">✏️<span>もじで かく</span></button>
         <div class="lt-left">あと <b>${left}</b>かい おくれるよ</div>`;
    if (state === 'text') setTimeout(() => document.getElementById('ltTxt')?.focus(), 50);
  };
  async function fillList() {
    const p = activeProfile(), th = S.lettersTo, el = document.getElementById('ltList');
    if (!el || !p) return;
    const list = await thread(p.id, th);
    const before = STREAK; STREAK = streakOf(list);
    const recNow = document.getElementById('ltRec');
    if (before !== STREAK && recNow && !rec && !recBlob && !recNow.querySelector('#ltTxt')) recArea('idle');
    if (!list.length) { el.innerHTML = `<p class="lt-empty">${th === 'santa' ? 'サンタさんに はじめての おてがみを おくってみよう！' : 'パパに メッセージを おくってみよう！'}</p>`; return; }
    el.innerHTML = list.map(m => {
      const mine = m.from === 'kid';
      return `<div class="bub-row ${mine ? 'mine' : 'them'}">
        ${mine ? '' : whoAvatar(th)}
        <button class="bub ${mine ? 'mine' : 'them'} ${!mine && !m.heard ? 'new' : ''}" data-act="ltPlay" data-id="${m.id}">
          <span class="bub-play">${m.hasAudio ? '🔊' : '💬'}</span>
          ${m.text ? `<span class="bub-text">${esc(m.text)}</span>` : `<span class="bub-text voice">${mine ? 'こえの おてがみ' : 'こえの おへんじ'}</span>`}
          ${!mine && !m.heard ? '<b class="bub-new">あたらしい！</b>' : ''}
          <small class="bub-time">${hhmm(m.ts)}${mine && online() && !m.synced ? '・まだ とどいていないよ' : ''}</small>
        </button>
      </div>`;
    }).join('');
    el.scrollTop = el.scrollHeight;
    LIST = list;
  }
  let LIST = [];
  AFTER.letters = () => {
    fillList().then(() => recArea('idle'));
    clearInterval(poll);
    poll = setInterval(() => sync().then(n => { if (n) { sfx.bonus?.(); fillList(); } }).catch(() => {}), 15000);
    sync().then(n => n && fillList()).catch(() => {});
    if (S.lettersTo === 'santa') setTimeout(() => speakAs('メリークリスマス！ サンタさんだよ。おはなし きかせてね。', 'santa'), 400);
  };
  LEAVE.letters = () => { clearInterval(poll); rec?.cancel(); rec = null; recBlob = null; player?.pause(); speechSynthesis.cancel(); };

  async function playMsg(m) {
    player?.pause(); speechSynthesis.cancel();
    if (m.from !== 'kid' && !m.heard) { m.heard = true; markHeard(m.id).then(fillList); }
    if (m.hasAudio) {
      const url = await audioURL(m).catch(() => null);
      if (url) { player = new Audio(url); await player.play().catch(() => {}); }
      else toast('こえを よみこめなかったよ');
    } else if (m.text) {
      speakAs(m.text, m.from === 'santa' ? 'santa' : m.from === 'papa' ? 'papa' : 'kid');
    }
  }
  async function deliver({ text = '', audio = null }) {
    const p = activeProfile(), th = S.lettersTo;
    if (streakOf(await thread(p.id, th)) >= LIMIT) { recArea('wait'); toast(`${WHO[th].name}の おへんじを まってね`); return; }
    recArea('sending');
    await send({ kidId: p.id, kidName: p.name, thread: th, from: 'kid', text, audio });
    await sync().catch(() => {});
    recBlob = null; await fillList(); recArea('idle');
    sfx.bonus?.();
    if (th === 'santa') { toast('🎅 サンタさんに とどけたよ！', 2600); speakAs(WHO.santa.thanks, 'santa'); }
    else toast('📮 パパに おくったよ！', 2600);
    setTimeout(fillList, 4000);
  }

  Object.assign(ACTIONS, {
    openLetters: d => { sfx.tap(); go('letters', { lettersTo: d.th }); },
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
    ltSendText: () => { const t = document.getElementById('ltTxt')?.value.trim(); if (!t) { toast('なにか かいてね'); return; } deliver({ text: t.slice(0, 100) }); },
    ltSend: () => { if (recBlob) deliver({ audio: recBlob }); },
    ltStamp: d => { const [e, t] = WHO[S.lettersTo].stamps[Number(d.i)]; deliver({ text: `${e} ${t}` }); },
    ltPlay: d => { const m = LIST.find(x => x.id === d.id); if (m) playMsg(m); },
  });

  // ---------- おうちのひと メニュー（💌 おてがみ） ----------
  return {
    parentHTML: () => {
      const c = getCfg(), ph = papaPhoto();
      return `
      <div class="card"><h3>👨 パパの しゃしん</h3>
        <p class="hint">「パパと はなす」ボタンと、おへんじに でる しゃしんです（この iPad の なかだけに ほぞん）。</p>
        <div class="row wrap">${ph ? `<img class="avatar-img lg" src="${ph}" alt="">` : '<span class="avatar lg">👨</span>'}
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
        <p class="hint">へんじページで、こどもの こえを きいて、パパ または サンタさん として おへんじを かけます。サンタさんの おへんじは、ひくい サンタさんの こえで よみあげられます。</p>
        <a class="btn" href="papa.html" target="_blank" rel="noopener">✉️ へんじページを ひらく</a>
        <p class="hint">パパの スマホでは <b>${esc(location.origin + location.pathname.replace(/[^/]*$/, ''))}papa.html</b> を ひらいて、おなじ アドレスと かぎを いれてください。</p>
      </div>`;
    },
    bindParent: () => {
      const f = document.getElementById('papaPhotoInput');
      f?.addEventListener('change', async () => {
        const file = f.files?.[0]; if (!file) return;
        try { localStorage.setItem(PAPA_PHOTO, await squarePhoto(file)); toast('しゃしんを ほぞんしました'); render(); } catch (e) { alert('しゃしんを よみこめませんでした'); }
      });
    },
    actions: {
      ltPapaPhotoOff: () => { localStorage.removeItem(PAPA_PHOTO); render(); },
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
