// キャッスルクエスト 本体
import {
  getDB, save, replaceDB, today, addDays, createProfile, activeProfile, setActive, deleteProfile,
  hashPin, playedSec, limitSec, requestPersist, levelForAge,
} from './store.js';
import { BY_ID, CATS } from './words.js';
import { PHOTOS } from './photos.js';
import { buildSession, retryOf, TYPE_NAMES, SESSION_LEN } from './quiz.js';
import { markWrong, markCorrect, dueIds, ghostIds, friendIds } from './review.js';
import { say, en as sayEn, ja as sayJa, stop as stopSpeech, unlock as unlockSpeech, setPrefs as setVoicePrefs, voiceList, currentVoiceName, onVoicesChanged } from './speech.js';
import { sfx } from './sfx.js';
import {
  CASTLES, CASTLE_BY_ID, NORMAL_CASTLES, PARTS_PER_CASTLE, CURRENCIES, PART_PRICE, YEN_PER_LEVEL,
  GHOSTS_PER_TSURUGA_PART, DEFAULT_RATES, RATES_DATE,
} from './castles.js';
import { installDino } from './dinoGame.js';
import { installLetters } from './lettersGame.js';
import { APP_VERSION } from './version.js';
import { buildMathSession, mathRetry, MATH_LEVELS, MATH_TYPE_NAMES, mathLevelForAge } from './math.js';
import { buildPuzzleSession, mountRobot } from './puzzle.js';
import { buildEasySession, praise as easyPraise } from './easy.js';
// ひらめき パズル：2026-11-17 から こども みんなに ひらいた
const puzzleOpen = () => true;

const app = document.getElementById('app');
const AVATARS = ['🦁', '🐰', '🐻', '🐱', '🐶', '🐼', '🦊', '🐸', '🦄', '🐧', '🐯', '🐨'];
const LEVEL_NAMES = { 1: '⭐ かんたん', 2: '⭐⭐ ふつう', 3: '⭐⭐⭐ むずかしい' };
const PLAY_SCREENS = new Set(['home', 'quiz', 'result', 'castles', 'castle', 'exchange', 'collection', 'ghosts', 'dhome', 'deggs', 'hatch', 'dcare', 'dshop', 'dzukan']);
const HISTORY_MAX = 4000;
const FOREIGN = ['dollar', 'euro', 'pound', 'yuan'];

const S = {
  screen: 'boot',
  game: 'castle',   // いま あそんでいる ゲーム（castle / dino）
  quiz: null,
  newProfile: { name: '', age: 5, avatar: AVATARS[0], photo: null },
  pin: { buf: '', mode: 'enter', first: '', next: null, msg: '' },
  parentTab: 'home',
  statsId: null,
  castleId: null,
  castleTime: 'day',
  previewing: false,
  pendingLimit: false,
  castleMsg: '',
  animatePart: null,
};

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('ja-JP');
const db = () => getDB();
// おさいふは ゲームごとに 別（キャッスルクエスト / ダイナソークエスト）
const wallet = p => (S.game === 'dino' ? p.dino.wallet : p.wallet);
const homeScreen = () => (S.game === 'dino' ? 'dhome' : 'home');
const rate = cur => (cur === 'yen' ? 1 : db().settings.rates[cur]);
const money = (cur, n) => cur === 'yen' ? `${fmt(n)}えん` : `${fmt(n)}${CURRENCIES[cur].name}`;

setVoicePrefs(db().settings.voice);

// ---------- 画面の切り替え ----------
const LEAVE = {};   // 画面を はなれるときの あとかたづけ
function go(screen, opts = {}) {
  if (S.screen === 'castle' && screen !== 'castle') detachCastle();
  if (S.screen !== screen) LEAVE[S.screen]?.();
  if (screen !== 'quiz') stopSpeech();
  if (!['parent', 'pin', 'setupPin'].includes(screen)) S.pinOK = false;
  if (screen !== 'castle') S.previewOK = false;
  S.screen = screen;
  Object.assign(S, opts);
  render();
}
// 画面ごとの背景画像（bg/ フォルダ）
const BG = {
  boot: 'hero', profiles: 'hero', games: 'hero', newProfile: 'workshop', setupPin: 'workshop', pin: 'workshop', parent: 'workshop',
  home: 'hub', quiz: 'study', result: 'title', castles: 'select', collection: 'select', castle: 'castle',
  exchange: 'exchange', ghosts: 'ghosts', limit: 'build-night', rest: 'build-sunset',
};
function render() {
  const fn = SCREENS[S.screen] || SCREENS.profiles;
  document.body.dataset.bg = BG[S.screen] || 'hub';
  app.innerHTML = fn();
  window.scrollTo(0, 0);
  AFTER[S.screen]?.();
}
function toast(msg, ms = 2200) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.innerHTML = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), ms);
}
function avatarHTML(p, cls = '') {
  return p.photo ? `<img class="avatar-img ${cls}" src="${p.photo}" alt="">` : `<span class="avatar ${cls}">${p.avatar}</span>`;
}
function header(p, { back = homeScreen() } = {}) {
  const due = dueIds(p).length;
  return `
  <header class="bar">
    <button class="icon-btn" data-act="go" data-to="${back}" aria-label="もどる">🏠</button>
    <div class="who">${avatarHTML(p, 'sm')}<span class="name">${esc(p.name)}</span></div>
    <div class="stats">
      ${due ? `<span class="chip ghost-chip" data-act="go" data-to="ghosts">👻 ${due}</span>` : ''}
      <span class="chip coin-chip" id="yenChip" data-act="go" data-to="exchange">💴 <b>${fmt(wallet(p).yen)}</b><small>えん</small></span>
    </div>
  </header>`;
}
function picHTML(w, cls = '') {
  if (w.photo) return `<img class="pic photo ${cls}" src="${w.photo}" alt="" draggable="false">`;
  if (!w.pic) return `<span class="pic ${cls}">🔤</span>`;
  return w.isNum ? `<span class="pic num ${cls}">${w.pic}</span>` : `<span class="pic ${cls}">${w.pic}</span>`;
}

// ---------- お城の計算 ----------
const built = (p, id) => p.castles[id] || 0;
function tsurugaParts(p) { return Math.floor((p.ghostsGraduated || 0) / GHOSTS_PER_TSURUGA_PART) + (p.tsurugaBonus || 0); }
function tsurugaFound(p) { return tsurugaParts(p) > 0 || built(p, 'tsuruga') > 0; }

// ---------- 画面 ----------
const SCREENS = {
  boot: () => `<div class="boot-center"></div>`,

  setupPin: () => pinPad({
    title: db().settings.pinHash ? 'あたらしい ばんごう' : 'あんしょうばんごうを きめる',
    sub: S.pin.mode === 'setup1' ? 'おうちのかたへ：遊ぶ時間などの「せってい」を まもる 4けたの あんしょうばんごうを きめてください' : 'かくにんのため、もういちど いれてください',
  }),

  profiles: () => {
    const ps = db().profiles;
    const sparks = Array.from({ length: 18 }, (_, i) => `<i style="left:${(i * 53) % 100}%;animation-delay:${(i * 0.37) % 4}s;animation-duration:${4 + (i % 5)}s"></i>`).join('');
    return `
    <div class="top">
      <div class="top-sparks">${sparks}</div>
      <div class="top-logo">
        <div class="logo-badge">まなびが、ぼうけんになる。</div>
        <h1 class="logo-main"><span class="l1">Endo</span><span class="l2">Game</span></h1>
        <div class="logo-en">えんどう ゲーム</div>
      </div>
      <div class="top-bottom">
        <p class="top-call">${ps.length ? '⭐ だれが あそぶ？ ⭐' : '⭐ あそぶ ひとを つくろう ⭐'}</p>
        <div class="top-profiles">
          ${ps.map(p => `
            <button class="top-card" data-act="pick" data-id="${p.id}">
              ${avatarHTML(p)}
              <span class="pname">${esc(p.name)}</span>
              <span class="plevel">${LEVEL_NAMES[p.level]}</span>
            </button>`).join('')}
          <button class="top-card add ${ps.length ? '' : 'big'}" data-act="go" data-to="newProfile">
            <span class="avatar">＋</span><span class="pname">${ps.length ? 'あたらしく つくる' : 'ぼうけんしゃを つくる'}</span>
          </button>
        </div>
        <button class="parent-link" data-act="parent">⚙️ おうちのひと</button>
        <div class="app-ver">${APP_VERSION}</div>
      </div>
    </div>`;
  },

  games: () => {
    const p = activeProfile();
    if (!p) return SCREENS.profiles();
    const doneN = p.completed.length;
    return `
    <div class="games">
      <header class="games-head">
        <button class="icon-btn" data-act="go" data-to="profiles" aria-label="もどる">⬅️</button>
        <div class="who">${avatarHTML(p, 'sm')}<span class="name">${esc(p.name)}</span></div>
      </header>
      <h2 class="games-title">どの ゲームで あそぶ？</h2>
      <div class="game-cards">
        <button class="game-card castle" data-act="playGame" data-g="castle">
          <span class="gc-art" style="background-image:url(cards/himeji.jpg)"></span>
          <span class="gc-name">キャッスルクエスト</span>
          <span class="gc-sub">えいごで せかいの おしろを たてよう</span>
          <span class="gc-badge">🏰 かんせい ${doneN}</span>
        </button>
        <button class="game-card dino" data-act="playGame" data-g="dino">
          <span class="gc-art dino-art" role="img" aria-label="子どもたちが赤ちゃん恐竜をお世話している"></span>
          <span class="gc-name">ダイナソークエスト</span>
          <span class="gc-sub">えいごで きょうりゅうを そだてよう</span>
          <span class="gc-badge soon">🥚 おためし ちゅう</span>
        </button>
        <button class="game-card rally" data-act="playGame" data-g="rally">
          <span class="gc-art rally-art"><img src="cards/rally-card.jpg" alt="" onload="this.nextElementSibling.remove()" onerror="this.remove()"><span>🚗</span></span>
          <span class="gc-name">ぶーぶーラリー</span>
          <span class="gc-sub">コインを あつめて くるまを ふやそう</span>
          <span class="gc-badge">🏁 コース 10・くるま 15</span>
        </button>
      </div>
    </div>`;
  },

  newProfile: () => {
    const n = S.newProfile;
    return `
    <div class="page narrow">
      <h2>ぼうけんしゃを つくろう</h2>
      <label class="field"><span>なまえ</span>
        <input id="pname" maxlength="10" placeholder="なまえ" value="${esc(n.name)}" autocomplete="off">
      </label>
      <div class="field"><span>なんさい？</span>
        <div class="row">${[4, 5, 6, 7].map(a => `<button class="pill ${n.age === a ? 'on' : ''}" data-act="age" data-v="${a}">${a}さい</button>`).join('')}</div>
        <small class="hint">むずかしさ：${LEVEL_NAMES[levelForAge(n.age)]}（あとで おうちのひとが かえられます）</small>
      </div>
      <div class="field"><span>アイコン</span>
        <div class="photo-row">
          ${n.photo ? `<img class="avatar-img lg" src="${n.photo}" alt="">` : ''}
          <label class="btn photo-btn">📷 しゃしんを つかう<input type="file" accept="image/*" id="photoInput" hidden></label>
          ${n.photo ? '<button class="btn ghost sm" data-act="clearPhoto">しゃしんを やめる</button>' : ''}
        </div>
        ${n.photo ? '' : `<div class="avatar-grid">${AVATARS.map(a => `<button class="avatar-pick ${n.avatar === a ? 'on' : ''}" data-act="avatar" data-v="${a}">${a}</button>`).join('')}</div>`}
      </div>
      <div class="row end">
        <button class="btn ghost" data-act="go" data-to="profiles">もどる</button>
        <button class="btn primary" data-act="createProfile">つくる！</button>
      </div>
    </div>`;
  },

  home: () => {
    const p = activeProfile();
    const due = dueIds(p).length;
    const doneN = p.completed.length;
    const total = NORMAL_CASTLES.length + (tsurugaFound(p) ? 1 : 0);
    return `
    ${header(p, { back: 'games' })}
    <div class="page">
      <div class="home-grid">
        ${easyLevelOf(p) ? `<button class="big-btn easy" data-act="startQuiz" data-mode="easy">
          <span class="bi">🌈</span><span class="bt">かんがえて あそぼう</span><span class="bs">みて・きいて・タッチ</span>
        </button>` : ''}
        <button class="big-btn quiz" data-act="startQuiz" data-mode="normal">
          <span class="bi">🔤</span><span class="bt">えいごに ちょうせん</span><span class="bs">${LEVEL_NAMES[p.level]}・${SESSION_LEN}もん・1もん ${fmt(YEN_PER_LEVEL[p.level])}えん</span>
        </button>
        <button class="big-btn math" data-act="startQuiz" data-mode="math">
          <span class="bi">🔢</span><span class="bt">さんすうに ちょうせん</span><span class="bs">${MATH_LEVELS[mathLevelOf(p)].name}・10もん・1もん ${fmt(YEN_PER_LEVEL[p.level])}えん</span>
        </button>
        <button class="big-btn puzzle ${puzzleOpen() ? '' : 'wip'}" data-act="puzzleTry">
          <span class="bi">🧩</span><span class="bt">ひらめき パズル</span><span class="bs">${puzzleOpen() ? 'かんがえる ちから・10もん' : '🚧 さくせいちゅう'}</span>
        </button>
        <button class="big-btn review ${due ? 'alert' : ''}" data-act="startQuiz" data-mode="review">
          <span class="bi">👻</span><span class="bt">きょうの ふくしゅう</span>
          <span class="bs">${due ? `おばけが ${due}ひき まってるよ！ おかね 2ばい` : 'いまは おばけ いないよ'}</span>
        </button>
        <button class="big-btn castle" data-act="go" data-to="castles">
          <span class="bi">🏰</span><span class="bt">おしろを つくる</span><span class="bs">かんせい ${doneN}/${total}</span>
        </button>
        <button class="big-btn exchange" data-act="go" data-to="exchange">
          <span class="bi">💱</span><span class="bt">りょうがえじょ</span><span class="bs">💴 ${fmt(p.wallet.yen)}えん</span>
        </button>
        <button class="big-btn ghosts" data-act="go" data-to="ghosts">
          <span class="bi">📕</span><span class="bt">おばけずかん</span><span class="bs">ともだち ${friendIds(p).length}</span>
        </button>
      </div>
    </div>`;
  },

  quiz: () => {
    const p = activeProfile();
    const Q = S.quiz;
    const q = Q.qs[Q.i];
    const total = Q.qs.length;
    const P = q.prompt || {};
    const sentenceHTML = s => esc(s).replace('___', '<span class="blank">？</span>');
    const promptHTML = [
      q.easy ? '<div class="q-type">🌈 かんがえて あそぼう</div>' : `<div class="q-type">${q.math ? (q.puzzle ? '🧩 ' : '🔢 ') + MATH_TYPE_NAMES[q.mtype] : TYPE_NAMES[q.type]}</div>`,
      P.html ? `<div class="q-math">${P.html}</div>` : '',
      P.pic ? `<div class="q-pic">${picHTML(BY_ID[P.pic], 'xl')}</div>` : '',
      P.emojiRow ? `<div class="q-emoji">${esc(P.emojiRow)}</div>` : '',
      P.big ? `<div class="q-letter">${esc(P.big)}</div>` : '',
      P.listen ? '<button class="listen-btn" data-act="replay">🔊</button>' : '',
      P.word ? `<div class="q-word ${P.ja ? 'ja' : ''}">${esc(P.word)}</div>${P.sub ? `<div class="q-sub">（${esc(P.sub)}）</div>` : ''}` : '',
      P.sentence ? `<div class="q-sentence">${P.listenSentence || q.type === 10 || q.type === 13 ? `<button class="say-mini" data-act="replay">🔊</button>` : ''}${sentenceHTML(P.sentence)}</div>` : '',
      P.hintJa && !P.pic ? `<div class="q-sub">ヒント：${esc(P.hintJa)}</div>` : '',
      `<p class="q-text">${esc(P.text || '')}</p>`,
    ].join('');
    const letters = ['A', 'B', 'C', 'D'];
    const opts = q.options.map((id, k) => {
      let inner;
      if (q.easy) inner = `<span class="ez-opt">${q.easyOpts[k]}</span>`;
      else if (id.startsWith('txt:')) inner = `<span class="opt-text">${esc(id.slice(4))}</span>`;
      else {
        const o = BY_ID[id];
        if (q.optMode === 'pic') inner = picHTML(o, 'opt-pic');
        else if (q.optMode === 'letter') inner = `<span class="opt-letterbig">${esc(o.en)}</span><span class="opt-say" data-act="sayOpt" data-id="${id}">🔊</span>`;
        else if (q.optMode === 'ja') inner = `<span class="opt-text ja">${esc(o.ja)}</span>`;
        else inner = `<span class="opt-text">${esc(o.en)}</span><span class="opt-say" data-act="sayOpt" data-id="${id}">🔊</span>`;
      }
      return `<button class="opt ${q.easy ? 'ez' : ''}" data-act="answer" data-id="${id}">${q.easy ? '' : `<span class="opt-letter">${letters[k]}</span>`}${inner}</button>`;
    }).join('');
    const tags = [
      q.review ? '<span class="tag review">👻 ふくしゅう</span>' : '',
      q.retry ? '<span class="tag retry">🔁 もういちど</span>' : '',
      q.challenge ? '<span class="tag challenge">⭐ ちょっと むずかしい</span>' : '',
    ].join('');
    return `
    ${header(p)}
    <div class="page quiz-page">
      <div class="progress"><div class="progress-bar" style="width:${(Q.i / total) * 100}%"></div></div>
      <div class="quiz-top">
        ${q.easy ? '<span class="tags"></span>' : `<span class="qcount">${Q.i + 1} / ${total}</span>
        <span class="tags">${tags}</span>
        <span class="streak ${Q.streak >= 3 ? 'hot' : ''}">🔥 ${Q.streak}</span>`}
        <button class="icon-btn sm" data-act="quitQuiz" aria-label="やめる">✕</button>
      </div>
      <div class="prompt">${promptHTML}</div>
      ${q.play ? '<div class="robot-play" id="robotPlay"></div>' : `<div class="options ${q.puzzle ? 'pz-opts' : ''} ${q.easy ? 'ez-opts n' + q.options.length : ''}">${opts}</div>`}
      <div id="feedback"></div>
    </div>`;
  },

  result: () => {
    const p = activeProfile();
    const Q = S.quiz;
    const c = Q.yen;
    const firstTotal = Q.qs.filter(q => !q.retry).length;
    const stars = Q.correct === firstTotal ? '🌟🌟🌟' : Q.correct >= firstTotal * 0.7 ? '🌟🌟' : '🌟';
    if (Q.mode === 'easy') return `
    ${header(p)}
    <div class="page narrow result">
      <div class="stars">🌈</div>
      <h2>よく がんばったね！</h2>
      <div class="coin-total"><span>💴</span><b id="coinCount">0</b><span>えん ゲット！</span></div>
      <div class="row center">
        <button class="btn" data-act="startQuiz" data-mode="easy">🔁 もういちど</button>
        ${S.game === 'dino' ? '<button class="btn primary" data-act="go" data-to="dhome">🦖 もどる</button>' : '<button class="btn primary" data-act="go" data-to="home">🏠 もどる</button>'}
      </div>
    </div>`;
    return `
    ${header(p)}
    <div class="page narrow result">
      <div class="stars">${stars}</div>
      <h2>${Q.correct} / ${firstTotal} もん せいかい！</h2>
      <div class="coin-total"><span>💴</span><b id="coinCount">0</b><span>えん ゲット！</span></div>
      <ul class="breakdown">
        <li><span>せいかい${Q.mode === 'review' ? '（ふくしゅうで 2ばい）' : ''}</span><b>+${fmt(c.base)}</b></li>
        ${c.retry ? `<li><span>もういちどで せいかい</span><b>+${fmt(c.retry)}</b></li>` : ''}
        ${c.streak ? `<li><span>れんぞく ボーナス</span><b>+${fmt(c.streak)}</b></li>` : ''}
        ${c.challenge ? `<li><span>ちょっと むずかしい ボーナス</span><b>+${fmt(c.challenge)}</b></li>` : ''}
        ${c.perfect ? `<li><span>ぜんもん せいかい ボーナス</span><b>+${fmt(c.perfect)}</b></li>` : ''}
        ${Q.graduated ? `<li><span>おばけが ともだちに なった</span><b>${Q.graduated}ひき</b></li>` : ''}
        ${Q.tsuruga ? `<li><span>✨ ちょうげきレア つるがじょうの パーツ</span><b>+${Q.tsuruga}</b></li>` : ''}
      </ul>
      <div class="row center">
        <button class="btn" data-act="startQuiz" data-mode="${Q.mode}">もういちど</button>
        ${S.game === 'dino' ? '<button class="btn primary" data-act="go" data-to="dcare">🦖 きょうりゅうへ</button>' : '<button class="btn primary" data-act="go" data-to="castles">🏰 おしろへ</button>'}
      </div>
    </div>`;
  },

  castles: () => {
    const p = activeProfile();
    const list = [...NORMAL_CASTLES, ...(tsurugaFound(p) ? [CASTLE_BY_ID.tsuruga] : [])];
    return `
    ${header(p)}
    <div class="page">
      <h2>🏰 どの おしろを つくる？</h2>
      <p class="sub">どの おしろからでも たてられるよ。その くにの おかねで たてよう！</p>
      <div class="col-grid">
        ${list.map(c => {
          const n = built(p, c.id), done = p.completed.includes(c.id);
          const price = c.rare ? `👻 パーツ ${tsurugaParts(p) - n}こ` : `${CURRENCIES[c.currency].sign} ${money(c.currency, PART_PRICE[c.currency])}`;
          return `<button class="col-card ${done ? 'got' : ''} ${c.rare ? 'rare' : ''}" data-act="openCastle" data-id="${c.id}">
            ${done ? `<img class="col-card-img" src="cards/${c.id}.jpg" alt="" onerror="this.remove()">` : ''}
            <div class="col-flag">${c.flag}</div>
            <div class="col-name">${c.name}</div>
            <div class="mini-bar"><i style="width:${(n / PARTS_PER_CASTLE) * 100}%"></i></div><div class="mini-count">${n} / ${PARTS_PER_CASTLE}</div>
            <div class="col-sub">${done ? '✨ かんせい！' : price}</div>
          </button>`;
        }).join('')}
        ${tsurugaFound(p) ? '' : `<div class="col-card rare locked"><div class="col-flag">❓</div><div class="col-name">？？？</div><div class="col-sub">✨ ちょうげきレア ✨<br>おばけを ともだちに すると…</div></div>`}
      </div>
    </div>`;
  },

  castle: () => {
    const p = activeProfile();
    const c = CASTLE_BY_ID[S.castleId];
    const n = built(p, c.id);
    const done = n >= PARTS_PER_CASTLE;
    const due = dueIds(p).length;
    const gate = due >= db().settings.reviewGate;
    let action = '';
    if (done) {
      action = `<p class="cp-msg">✨ かんせい！ ゆびで まわして みてね</p>
        <button class="btn primary" data-act="readDesc" data-id="${c.id}">📖 おしろの おはなし</button>`;
    } else if (gate) {
      action = `<p class="cp-msg warn">👻 おばけが ${due}ひき たまってるよ！ ふくしゅうして おばけを たいじしたら また たてられるよ</p>
        <button class="btn primary" data-act="startQuiz" data-mode="review">👻 ふくしゅうする</button>`;
    } else if (c.rare) {
      const have = tsurugaParts(p) - n;
      action = `<p class="cp-msg">つぎは「<b>${c.parts[n]}</b>」</p>
        <button class="btn primary build" data-act="build" ${have > 0 ? '' : 'disabled'}>🔨 パーツを つかう（のこり ${have}こ）</button>
        <small class="hint">おばけを ${GHOSTS_PER_TSURUGA_PART}ひき ともだちに すると パーツが 1こ もらえるよ。10れんぞく せいかいでも もらえることが あるよ</small>`;
    } else {
      const cur = c.currency, price = PART_PRICE[cur], have = p.wallet[cur];
      const shortage = Math.max(0, price - have);
      const yenNeed = shortage * rate(cur);
      action = `<p class="cp-msg">つぎは「<b>${c.parts[n]}</b>」 ねだん：<b>${money(cur, price)}</b></p>
        <div class="wallet-line">${CURRENCIES[cur].sign} もっている ${CURRENCIES[cur].name}：<b>${money(cur, have)}</b>${cur !== 'yen' ? `　💴 ${fmt(p.wallet.yen)}えん` : ''}</div>
        ${shortage === 0
          ? `<button class="btn primary build" data-act="build">🔨 たてる（${money(cur, price)}）</button>`
          : (cur !== 'yen' && p.wallet.yen >= yenNeed)
            ? `<button class="btn primary build" data-act="exchangeBuild">💱 りょうがえして たてる <span class="price">${fmt(yenNeed)}えん → ${money(cur, shortage)}</span></button>`
            : `<button class="btn build" data-act="build" data-short="1">🔨 たてる（${money(cur, price)}）</button>`}
        ${cur !== 'yen' ? `<small class="hint">1${CURRENCIES[cur].name} ＝ ${fmt(rate(cur))}えん（${CURRENCIES[cur].en}）</small>` : ''}`;
    }
    return `
    ${header(p, { back: 'castles' })}
    <div class="castle-page">
      <div class="stage-sky">${['day', 'sunset', 'night'].map(k => `<div class="sky-${k} ${({ day: 'day', sunset: 'evening', night: 'night' })[k] === S.castleTime ? 'on' : ''}"></div>`).join('')}</div>
      <div id="stage" class="stage"><div class="stage-loading">🏗️ じゅんびちゅう…</div></div>
      <div class="time-switch">
        ${[['day', '☀️'], ['evening', '🌇'], ['night', '🌙']].map(([k, i]) => `<button class="pill ${S.castleTime === k ? 'on' : ''}" data-act="time" data-v="${k}">${i}</button>`).join('')}
      </div>
      ${done ? '' : `<button class="preview-btn ${S.previewing ? 'on' : ''}" data-act="preview">${S.previewing ? '🔙 もどる' : '🖼️ かんせいず 🔒'}</button>`}
      ${S.previewing ? '<div class="preview-banner">✨ かんせいずだよ！ ここまで たてよう ✨</div>' : ''}
      <div class="castle-panel">
        <div class="cp-title">${c.flag} <b>${c.name}</b> <small>${c.en}</small></div>
        <div class="build-bar"><div class="bb-fill" style="width:${(n / PARTS_PER_CASTLE) * 100}%"></div>${Array.from({ length: 9 }, (_, i) => `<i style="left:${((i + 1) / 10) * 100}%"></i>`).join('')}</div>
        <div class="bb-count">🧱 ${n} / ${PARTS_PER_CASTLE} パーツ</div>
        ${action}
        ${S.castleMsg ? `<p class="cp-msg">${S.castleMsg}</p>` : ''}
      </div>
    </div>`;
  },

  exchange: () => {
    const p = activeProfile();
    const s = db().settings;
    return `
    ${header(p)}
    <div class="page narrow">
      <h2>💱 りょうがえじょ</h2>
      <p class="sub">にほんの えんを、せかいの おかねに かえよう！</p>
      <div class="wallet-card yen"><span class="wc-sign">💴</span><div><div class="wc-name">えん（yen）</div><div class="wc-amt">${fmt(wallet(p).yen)}えん</div></div></div>
      ${FOREIGN.map(cur => {
        const C = CURRENCIES[cur], r = s.rates[cur], part = PART_PRICE[cur];
        const W = wallet(p), can = Math.floor(W.yen / r);
        const btn = (n, label) => `<button class="pill ${W.yen >= n * r ? '' : 'dis'}" data-act="exchange" data-cur="${cur}" data-n="${n}">${label}<small>${fmt(n * r)}えん</small></button>`;
        return `<div class="wallet-card">
          <span class="wc-sign">${C.sign}</span>
          <div class="wc-main">
            <div class="wc-name">${C.name}（${C.en}） <small>1${C.name} ＝ ${fmt(r)}えん</small></div>
            <div class="wc-amt">${money(cur, W[cur])}</div>
            <div class="wc-note">${C.note}</div>
            <div class="row wrap">
              ${btn(10, `+10${C.name}`)}
              ${S.game === 'dino' ? btn(part / 2, `+すみか1こぶん（${part / 2}${C.name}）`) : btn(part, `+パーツ1こぶん（${part}${C.name}）`)}
              ${can > 0 ? btn(can, `ぜんぶ（${fmt(can)}${C.name}）`) : ''}
            </div>
          </div>
        </div>`;
      }).join('')}
      <small class="hint">レートは ${s.ratesDate} ごろの だいたいの ねだんだよ（5えん たんい）</small>
    </div>`;
  },

  collection: () => SCREENS.castles(),

  ghosts: () => {
    const p = activeProfile();
    const t = today();
    const gs = ghostIds(p).map(id => [id, p.review[id]]).filter(([id]) => BY_ID[id]).sort((a, b) => a[1].due.localeCompare(b[1].due));
    const fs = friendIds(p).filter(id => BY_ID[id]);
    const due = gs.filter(([, r]) => r.due <= t).length;
    const toNext = GHOSTS_PER_TSURUGA_PART - ((p.ghostsGraduated || 0) % GHOSTS_PER_TSURUGA_PART);
    return `
    ${header(p)}
    <div class="page">
      <h2>📕 おばけずかん</h2>
      <p class="sub">まちがえた ことばは おばけに なるよ。4かい つづけて せいかいすると ともだちに なるよ！<br>✨ あと ${toNext}ひき ともだちに すると、ちょうげきレアの パーツが もらえるよ</p>
      ${due ? `<button class="btn primary" data-act="startQuiz" data-mode="review">👻 いま ${due}ひき たいじできる！</button>` : ''}
      <h3>👻 おばけ（${gs.length}）</h3>
      <div class="ghost-grid">
        ${gs.length ? gs.map(([id, r]) => {
          const w = BY_ID[id];
          return `<button class="ghost-card ${r.due <= t ? 'due' : ''}" data-act="sayWord" data-id="${id}">
            <span class="g-icon">👻</span>${picHTML(w, 'g-pic')}<span class="g-en">${esc(w.en)}</span>
            <span class="g-hearts">${'❤️'.repeat(r.box)}${'🤍'.repeat(4 - r.box)}</span></button>`;
        }).join('') : '<p class="empty">おばけは いないよ！ すごい！</p>'}
      </div>
      <h3>😊 ともだち（${fs.length}）</h3>
      <div class="ghost-grid">
        ${fs.length ? fs.map(id => { const w = BY_ID[id]; return `<button class="ghost-card friend" data-act="sayWord" data-id="${id}"><span class="g-icon">🌟</span>${picHTML(w, 'g-pic')}<span class="g-en">${esc(w.en)}</span></button>`; }).join('') : '<p class="empty">まだ いないよ。ふくしゅうで ともだちを ふやそう！</p>'}
      </div>
    </div>`;
  },

  limit: () => `
    <div class="page narrow center-text limit">
      <div class="logo">🌙</div>
      <h2>きょうは ここまで！</h2>
      <p>たくさん がんばったね。また あした あそぼうね。</p>
      <div class="row center">
        <button class="btn ghost" data-act="go" data-to="profiles">おわる</button>
        <button class="btn" data-act="parent" data-next="extend">⚙️ おうちのひと</button>
      </div>
    </div>`,

  rest: () => `
    <div class="page narrow center-text limit rest">
      <div class="logo">☕</div>
      <h2>ちょっと ひとやすみ しよう！</h2>
      <p>たくさん がんばったね。めを やすめて、からだを うごかそう。</p>
      <div class="rest-timer" id="restTimer">--:--</div>
      <p class="rest-hint">🙆 のびを しよう　💧 おみずを のもう　👀 とおくを みよう</p>
      <div class="row center" id="restBtns">
        <button class="btn ghost" data-act="go" data-to="profiles">おわる</button>
        <button class="btn" data-act="parent" data-next="endBreak">⚙️ おうちのひと</button>
      </div>
    </div>`,

  pin: () => pinPad({ title: 'おうちのひと メニュー', sub: S.pin.msg || '4けたの あんしょうばんごうを いれてください' }),
  parent: () => parentScreen(),
};

const AFTER = {
  boot: () => {
    requestPersist();
    // ほかの ゲームから もどってきたときは、ゲームを えらぶ画面へ
    const p = activeProfile();
    if (location.hash === '#games' && p && !overLimit(p) && !onBreak(p)) { history.replaceState(null, '', location.pathname); go('games'); return; }
    go('profiles');
  },
  newProfile: () => {
    const i = document.getElementById('pname');
    i?.addEventListener('input', () => { S.newProfile.name = i.value; });
    bindPhoto('photoInput', url => { S.newProfile.name = document.getElementById('pname')?.value || S.newProfile.name; S.newProfile.photo = url; render(); });
  },
  quiz: () => {
    speakQuestion();
    const q = S.quiz.qs[S.quiz.i], el = document.getElementById('robotPlay');
    if (q?.play && el) mountRobot(el, q, { sfx, onSuccess: () => answer(q.answer, el), onGiveUp: () => answer('txt:__giveup', el) });
  },
  result: () => {
    const el = document.getElementById('coinCount');
    const Q = S.quiz;
    const target = Object.values(Q.yen).reduce((a, b) => a + b, 0);
    let n = 0;
    const step = Math.max(100, Math.round(target / 30 / 100) * 100);
    const h = setInterval(() => {
      n = Math.min(target, n + step);
      if (el) el.textContent = fmt(n);
      sfx.coin();
      if (n >= target) { clearInterval(h); sfx.bonus(); }
    }, 60);
    sayJa(Q.mode === 'easy' ? `よく がんばったね！ ${target}円 ゲット！` : `${Q.correct}問正解！ ${target}円ゲット！`);
  },
  castle: () => attachCastle(),
  parent: () => { bindParent(); LETTERS.bindParent(); },
  rest: () => { updateRest(); sayJa('ちょっとひと休みしよう。'); },
};

// ---------- 写真 ----------
function bindPhoto(inputId, done) {
  const f = document.getElementById(inputId);
  f?.addEventListener('change', async () => {
    const file = f.files?.[0];
    if (!file) return;
    try { done(await squarePhoto(file)); } catch (e) { alert('しゃしんを よみこめませんでした'); }
  });
}
// 写真を正方形・小さめ(256px)にして保存する（iPadの中だけに保存）
function squarePhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = 256, c = document.createElement('canvas');
      c.width = c.height = s;
      const k = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width - k) / 2, (img.height - k) / 2, k, k, 0, 0, s, s);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ---------- 暗証番号（遊ぶ時間などの「せってい」のときだけ） ----------
function pinPassed() {
  if (S.pin.next === 'endBreak') { const p = activeProfile(); if (p) { p.breakUntil = 0; p.contSec = 0; save(); } toast('きゅうけいを おわりに しました'); go(homeScreen()); return; }
  if (S.pin.next === 'preview') { go('castle', { previewing: true }); S.previewOK = true; return; }
  S.pinOK = true; S.parentTab = S.pin.next === 'letters' ? 'letters' : 'settings'; go('parent');
}
function askPin(next) {
  const has = !!db().settings.pinHash;
  S.pin = { buf: '', mode: has ? 'enter' : 'setup1', first: '', next, msg: '' };
  go(has ? 'pin' : 'setupPin');
}
function pinPad({ title, sub }) {
  const dots = [0, 1, 2, 3].map(i => `<span class="dot ${i < S.pin.buf.length ? 'on' : ''}"></span>`).join('');
  return `
  <div class="page narrow center-text">
    <h2>${title}</h2>
    <p class="sub">${sub}</p>
    <div class="dots">${dots}</div>
    <div class="keypad">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="key" data-act="pinKey" data-v="${n}">${n}</button>`).join('')}
      <button class="key ghost" data-act="pinCancel">もどる</button>
      <button class="key" data-act="pinKey" data-v="0">0</button>
      <button class="key ghost" data-act="pinDel">⌫</button>
    </div>
  </div>`;
}
async function pinKey(v) {
  if (S.pin.buf.length >= 4) return;
  S.pin.buf += v;
  sfx.tap();
  render();
  if (S.pin.buf.length < 4) return;
  const entered = S.pin.buf;
  S.pin.buf = '';
  if (S.pin.mode === 'setup1') { S.pin.first = entered; S.pin.mode = 'setup2'; render(); return; }
  if (S.pin.mode === 'setup2') {
    if (entered !== S.pin.first) { S.pin.mode = 'setup1'; S.pin.first = ''; toast('ばんごうが ちがいました。もういちど きめてください'); render(); return; }
    db().settings.pinHash = await hashPin(entered); save();
    toast('あんしょうばんごうを きめました');
    pinPassed();
    return;
  }
  if (await hashPin(entered) === db().settings.pinHash) {
    pinPassed();
  } else { S.pin.msg = 'ばんごうが ちがいます'; sfx.wrong(); render(); }
}

// ---------- クイズ ----------
function startQuiz(mode) {
  const p = activeProfile();
  if (overLimit(p)) { go('limit'); return; }
  if (onBreak(p)) { go('rest'); return; }
  const qs = mode === 'easy' ? buildEasySession(easyLevelOf(p)) : mode === 'puzzle' ? buildPuzzleSession(mathLevelOf(p)) : mode === 'math' ? buildMathSession(mathLevelOf(p)) : buildSession(p, mode, { boost: S.game === 'dino' ? 'dino' : null });
  if (!qs.length) { toast('きょうの ふくしゅうは おわり！ 👻 は いないよ'); return; }
  S.quiz = { mode, qs, i: 0, correct: 0, streak: 0, answered: false, graduated: 0, tsuruga: 0, yen: { base: 0, streak: 0, challenge: 0, perfect: 0, retry: 0 }, retried: new Set() };
  go('quiz');
}
// さんすうの レベル（おうちのひとが かえられる。きめていなければ ねんれいから）
function mathLevelOf(p) { return p.mathLevel || mathLevelForAge(p.age); }
// やさしい モード：0＝つかわない・1・2。きめていなければ 4さい いかは 1
function easyLevelOf(p) { return p ? (p.easy ?? (p.age <= 4 ? 1 : 0)) : 0; }
// 「2/3」を よみやすく（3ぶんの2）
const mathYomi = t => String(t).replace(/(\d+)\/(\d+)/g, (_, a, b) => `${b}分の${a}`).replace(/×/g, 'かける').replace(/÷/g, 'わる').replace(/−/g, 'ひく').replace(/＋/g, 'たす').replace(/＝/g, 'は');
function speakQuestion() {
  const q = S.quiz.qs[S.quiz.i];
  setTimeout(() => say(q.say || []), 250);
}
function addYen(n, kind) {
  const p = activeProfile();
  S.quiz.yen[kind] += n;
  wallet(p).yen += n;
  if (S.game === 'dino') p.dino.totalYen = (p.dino.totalYen || 0) + n; else p.totalYen = (p.totalYen || 0) + n;
  const chip = document.querySelector('#yenChip b');
  if (chip) { chip.textContent = fmt(wallet(p).yen); chip.parentElement.classList.remove('pop'); void chip.offsetWidth; chip.parentElement.classList.add('pop'); }
}
function answerEasy(id, btn) {
  const Q = S.quiz, p = activeProfile(), q = Q.qs[Q.i];
  const ok = id === q.answer;
  q.tries = (q.tries || 0) + 1;
  if (q.tries === 1) { p.history.push({ d: today(), ts: Date.now(), w: 'easy:' + q.mtype, ty: 'easy', c: id, ok, m: 'easy', r: 0, ch: 0, el: q.mlevel }); if (p.history.length > HISTORY_MAX) p.history.splice(0, p.history.length - HISTORY_MAX); }
  if (ok) {
    Q.answered = true;
    document.querySelectorAll('.opt').forEach(b => { b.disabled = true; });
    btn.classList.add('right', 'bounce'); sfx.correct();
    if (q.tries === 1) { Q.correct++; addYen(YEN_PER_LEVEL[p.level], 'base'); }
    save(); burst(btn);
    setTimeout(() => sayJa(easyPraise()), 300);
    setTimeout(nextQuestion, 2000);
    return;
  }
  btn.classList.add('wrong', 'shake'); btn.disabled = true; sfx.tap(); save();
  if (q.tries >= 2) {
    Q.answered = true;
    document.querySelectorAll('.opt').forEach(b => { b.disabled = true; if (b.dataset.id === q.answer) b.classList.add('right', 'bounce'); });
    setTimeout(() => say(q.explain), 300);
    setTimeout(nextQuestion, 3600);
  } else setTimeout(() => sayJa('おしい！ もういちど みてみよう。'), 250);
}
function answer(id, btn) {
  const Q = S.quiz;
  if (Q.answered) return;
  if (Q.qs[Q.i]?.easy) return answerEasy(id, btn);
  Q.answered = true;
  const p = activeProfile();
  const q = Q.qs[Q.i];
  const w = BY_ID[q.wid];
  const ans = q.answer || q.wid;
  const ok = id === ans;
  const ansObj = ans.startsWith('txt:') ? w : BY_ID[ans];
  p.history.push({ d: today(), ts: Date.now(), w: q.math ? 'math:' + q.mtype : q.wid, ty: q.type, c: id, ok, m: Q.mode, r: q.retry ? 1 : 0, ch: q.challenge ? 1 : 0, ...(q.math ? { ml: q.mlevel } : {}) });
  if (p.history.length > HISTORY_MAX) p.history.splice(0, p.history.length - HISTORY_MAX);
  if (!q.retry && !q.math) p.recent = [...(p.recent || []).filter(x => x !== q.wid), q.wid].slice(-50);
  document.querySelectorAll('.opt').forEach(b => { b.disabled = true; if (b.dataset.id === ans) b.classList.add('right'); });

  if (ok) {
    btn.classList.add('right', 'bounce');
    sfx.correct();
    if (!q.retry) Q.correct++;
    Q.streak++;
    p.bestStreak = Math.max(p.bestStreak || 0, Q.streak);
    if (q.retry) addYen(500, 'retry');
    else addYen(YEN_PER_LEVEL[p.level] * (Q.mode === 'review' ? 2 : 1), 'base');
    if (q.challenge && !q.retry) addYen(500, 'challenge');
    const sb = Q.streak === 3 ? 500 : Q.streak === 5 ? 1000 : Q.streak === 10 ? 3000 : (Q.streak > 10 && Q.streak % 5 === 0) ? 1000 : 0;
    if (sb) { addYen(sb, 'streak'); setTimeout(() => { sfx.bonus(); toast(`🔥 ${Q.streak}れんぞく！ ボーナス +${fmt(sb)}えん`); }, 300); }
    if (S.game !== 'dino' && Q.streak === 10 && Math.random() < 0.1) { p.tsurugaBonus = (p.tsurugaBonus || 0) + 1; Q.tsuruga++; setTimeout(() => { sfx.fanfare(); toast('✨ ちょうげきレア！ なぞの おしろの パーツを みつけた！', 3200); }, 900); }
    const before = tsurugaParts(p);
    const res = q.math ? null : markCorrect(p, q.wid);
    if (res === 'graduated') {
      Q.graduated++;
      setTimeout(() => { sfx.ghost(); toast(`👻→🌟 おばけが ともだちに なった！<br>${w.pic} ${esc(w.en)}`, 2600); }, 600);
      if (tsurugaParts(p) > before) { Q.tsuruga++; setTimeout(() => { sfx.fanfare(); toast('✨ ちょうげきレア！ なぞの おしろの パーツを みつけた！', 3200); }, 2400); }
    }
    save();
    const after = q.after || w.en;
    setTimeout(() => sayEn(after), 350);
    burst(btn);
    setTimeout(nextQuestion, Math.min(3500, 1500 + after.length * 45));
  } else {
    btn.classList.add('wrong', 'shake');
    sfx.wrong();
    Q.streak = 0;
    if (q.math) {
      // さんすう：おなじ しゅるいの べつの もんだいで もういちど
      if (!q.retry && !Q.retried.has('m' + Q.i)) { Q.retried.add('m' + Q.i); Q.qs.push(mathRetry(q)); }
      save();
      const ansText = ans.slice(4);
      document.getElementById('feedback').innerHTML = `
        <div class="feedback-card">
          <p>せいかいは…</p>
          <div class="fb-answer"><div class="fb-math">${esc(ansText)}</div></div>
          ${q.explain ? `<p class="fb-sentence">${esc(q.explain)}</p>` : ''}
          <div class="row center">
            <button class="btn" data-act="sayAfter">🔊 もういちど きく</button>
            <button class="btn primary" data-act="said">👍 わかった！</button>
          </div>
        </div>`;
      setTimeout(() => say([{ t: '正解は、' + mathYomi(ansText) + '。', l: 'ja' }, ...(q.explain ? [{ t: mathYomi(q.explain), l: 'ja' }] : [])]), 400);
      return;
    }
    markWrong(p, q.wid);
    if (!q.retry && !Q.retried.has(q.wid)) { Q.retried.add(q.wid); Q.qs.push(retryOf(q, p.level)); }
    save();
    document.getElementById('feedback').innerHTML = `
      <div class="feedback-card">
        <p>せいかいは…</p>
        <div class="fb-answer">${picHTML(ansObj, 'fb-pic')}<div><div class="fb-en">${esc(ansObj.en)}</div><div class="fb-ja">${esc(ansObj.ja)}</div></div></div>
        ${q.after && q.after !== ansObj.en ? `<p class="fb-sentence">${esc(q.after)}</p>` : ''}
        <p class="fb-say">いっしょに いってみよう！</p>
        <div class="row center">
          <button class="btn" data-act="sayAfter">🔊 もういちど きく</button>
          <button class="btn primary" data-act="said">🗣️ いえた！</button>
        </div>
      </div>`;
    const line = q.after || ansObj.en;
    setTimeout(() => say([{ t: '正解は、', l: 'ja' }, { t: ansObj.en, l: 'en' }, { t: '一緒に言ってみよう。', l: 'ja' }, { t: line, l: 'en' }]), 400);
  }
}
function nextQuestion() {
  const Q = S.quiz;
  if (!Q || S.screen !== 'quiz') return;
  Q.i++;
  Q.answered = false;
  const p = activeProfile();
  if (Q.i >= Q.qs.length) {
    const firstTotal = Q.qs.filter(q => !q.retry).length;
    if (Q.correct === firstTotal && firstTotal >= 5) addYen(2000, 'perfect');
    save();
    go('result');
    return;
  }
  if (S.pendingLimit || overLimit(p)) { S.pendingLimit = false; save(); go('limit'); return; }
  if (S.pendingBreak || onBreak(p)) { S.pendingBreak = false; save(); go('rest'); return; }
  render();
}
function burst(el) {
  const r = el.getBoundingClientRect();
  for (let i = 0; i < 10; i++) {
    const s = document.createElement('span');
    s.className = 'spark';
    s.textContent = i % 2 ? '✨' : '💴';
    s.style.left = (r.left + r.width / 2) + 'px';
    s.style.top = (r.top + r.height / 2) + 'px';
    const a = (Math.PI * 2 * i) / 10;
    s.style.setProperty('--dx', Math.cos(a) * 90 + 'px');
    s.style.setProperty('--dy', Math.sin(a) * 90 + 'px');
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 800);
  }
}

// ---------- 両替 ----------
function exchange(cur, n) {
  const p = activeProfile();
  const cost = n * rate(cur);
  const W = wallet(p);
  if (n <= 0 || W.yen < cost) { sfx.wrong(); toast('えんが たりないよ'); return false; }
  W.yen -= cost;
  W[cur] += n;
  save();
  sfx.coin();
  return true;
}

// ---------- お城 ----------
let castleView = null;
let engineP = null;
async function attachCastle() {
  const el = document.getElementById('stage');
  if (!el) return;
  const p = activeProfile();
  const c = CASTLE_BY_ID[S.castleId];
  try {
    engineP ||= import('./diorama/engine.js');
    const mod = await engineP;
    if (!document.getElementById('stage')) return;
    if (!castleView) castleView = new mod.CastleView();
    await castleView.load(c.id, { ja: c.name, en: c.en });
    if (!document.getElementById('stage')) return;
    castleView.attach(el);
    castleView.setTime(S.castleTime);
    const n = built(p, c.id);
    castleView.setParts(n, S.animatePart === n);
    if (S.previewing) castleView.preview(true);
    S.animatePart = null;
    el.querySelector('.stage-loading')?.remove();
  } catch (e) {
    console.error(e);
    el.innerHTML = '<div class="stage-loading">3Dを よみこめませんでした。インターネットに つないで もういちど ひらいてね。</div>';
  }
}
function detachCastle() { castleView?.detach(); }

function build(viaExchange = false) {
  const p = activeProfile();
  const c = CASTLE_BY_ID[S.castleId];
  const n0 = built(p, c.id);
  if (n0 >= PARTS_PER_CASTLE) return;
  if (dueIds(p).length >= db().settings.reviewGate) { render(); return; }
  if (c.rare) {
    if (tsurugaParts(p) - n0 <= 0) { sfx.wrong(); toast('パーツが ないよ。おばけを ともだちに しよう！'); return; }
  } else {
    const cur = c.currency, price = PART_PRICE[cur];
    if (viaExchange && p.wallet[cur] < price) {
      const short = price - p.wallet[cur];
      if (!exchange(cur, short)) return;
      toast(`💱 ${fmt(short * rate(cur))}えん → ${money(cur, short)}に りょうがえ！`);
    }
    if (p.wallet[cur] < price) {
      sfx.wrong();
      const lack = (price - p.wallet[cur]) * rate(cur) - p.wallet.yen;
      toast(`おかねが たりないよ。あと ${fmt(Math.max(lack, 0))}えん！<br>もんだいに ちょうせんしよう 📝`);
      sayJa(`お金があと${Math.max(lack, 0)}円必要だよ`);
      return;
    }
    p.wallet[cur] -= price;
  }
  p.castles[c.id] = n0 + 1;
  const n = n0 + 1;
  const partName = c.parts[n - 1];
  const finished = n >= PARTS_PER_CASTLE && !p.completed.includes(c.id);
  if (finished) p.completed.push(c.id);
  save();
  sfx.build();
  const stageName = c.stageNames[Math.floor((n - 1) / 3)];
  const step = ((n - 1) % 3) + 1;
  S.castleMsg = step === 3 ? `🎉「${stageName}」が かんせい！` : `🔨「${stageName}」を たてているよ（${step}/3）`;
  S.animatePart = n;
  S.previewing = false;
  render();
  sayJa(step === 3 ? `${stageName.replace(/ /g, '')}が、できたよ！` : `${stageName.replace(/ /g, '')}を、たてているよ。`);
  void partName;
  if (finished) setTimeout(() => { sfx.fanfare(); castleView?.celebrate(); showDesc(c.id, true); }, 1800);
  S.castleMsg = '';
}

function showDesc(id, first = false) {
  const c = CASTLE_BY_ID[id];
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `
    <div class="modal-card">
      ${first ? '<div class="stars">🎉 かんせい！ きねんカードを ゲット！ 🎉</div>' : ''}
      <img class="card-art ${first ? 'reveal' : ''}" src="cards/${c.id}.jpg" alt="" onerror="this.remove()">
      <h2>${c.flag} ${c.name}</h2>
      <p class="desc">${esc(c.desc)}</p>
      <p class="line">🔤 <b>${esc(c.line)}</b> <button class="icon-btn sm" data-act="sayLine">🔊</button></p>
      <div class="row center"><button class="btn" data-act="sayDesc">🔊 よみあげ</button><button class="btn primary" data-act="closeModal">とじる</button></div>
    </div>`;
  document.body.appendChild(m);
  m.addEventListener('click', e => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'closeModal' || e.target === m) { stopSpeech(); m.remove(); }
    if (a === 'sayLine') sayEn(c.line);
    if (a === 'sayDesc') say([{ t: c.say, l: 'ja' }, { t: c.line, l: 'en' }]);
  });
  say([{ t: c.say, l: 'ja' }, { t: c.line, l: 'en' }]);
}

// ---------- 遊ぶ時間 ----------
function overLimit(p) { return p && playedSec(p) >= limitSec(p); }
// 連続で遊べる時間と休憩
function onBreak(p) { return !!(p && p.breakUntil && Date.now() < p.breakUntil); }
function updateRest() {
  const p = activeProfile();
  const el = document.getElementById('restTimer');
  if (!el || !p) return;
  const left = Math.max(0, Math.ceil(((p.breakUntil || 0) - Date.now()) / 1000));
  el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  if (left === 0 && !el.dataset.done) {
    el.dataset.done = '1';
    el.classList.add('done');
    el.textContent = 'おわり！';
    document.getElementById('restBtns').insertAdjacentHTML('afterbegin', `<button class="btn primary" data-act="go" data-to="${homeScreen()}">▶ また あそぶ</button>`);
    sfx.bonus();
    sayJa('休憩おわり！また遊ぼう！');
  }
}
let tickCount = 0;
setInterval(() => {
  const p = activeProfile();
  if (S.screen === 'rest') { updateRest(); return; }
  if (!p || !PLAY_SCREENS.has(S.screen) || document.visibilityState !== 'visible') return;
  const d = today();
  p.play[d] = (p.play[d] || 0) + 1;
  if (++tickCount % 15 === 0) save();
  // 休憩の時間（breakMin）以上 はなれていたら、連続の時間をリセット
  const now = Date.now();
  const brk = (db().settings.breakMin || 15) * 60000;
  if (!p.lastPlay || now - p.lastPlay > brk) p.contSec = 0;
  p.lastPlay = now;
  p.contSec = (p.contSec || 0) + 1;
  const contLim = (db().settings.contMin || 0) * 60;
  if (contLim) {
    const cl = contLim - p.contSec;
    if (cl === 300) { toast('☕ あと 5ふんで きゅうけいだよ', 3500); sayJa('あと5分で休憩だよ'); }
    if (cl <= 0) {
      p.breakUntil = now + brk;
      p.contSec = 0;
      save();
      if (S.screen === 'quiz') S.pendingBreak = true;
      else go('rest');
      return;
    }
  }
  const left = limitSec(p) - playedSec(p);
  if (left === 300) { toast('⏰ あと 5ふんだよ', 3500); sayJa('あと5分だよ'); }
  if (left <= 0) {
    save();
    if (S.screen === 'quiz') S.pendingLimit = true;
    else go('limit');
  }
}, 1000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });

// ---------- おうちのひとメニュー ----------
function parentScreen() {
  const d = db();
  const tab = S.parentTab;
  const tabs = [['home', '👪 こども'], ['stats', '📊 しゅうけい'], ['settings', `⏰ せってい${S.pinOK ? '' : ' 🔒'}`], ['letters', `💌 おてがみ${S.pinOK ? '' : ' 🔒'}`], ['voice', '🔊 こえ'], ['backup', '💾 バックアップ'], ['credits', '📷 しゃしんの クレジット']];
  let body = '';
  if (tab === 'home') {
    body = d.profiles.length ? d.profiles.map(p => `
      <div class="card">
        <div class="row between"><div class="row">${avatarHTML(p, 'sm')} <b>${esc(p.name)}</b>（${p.age}さい）</div>
          <button class="btn sm" data-act="statsFor" data-id="${p.id}">📊 しゅうけい</button></div>
        <div class="field"><span>むずかしさ</span><div class="row wrap">
          ${[1, 2, 3].map(l => `<button class="pill ${p.level === l ? 'on' : ''}" data-act="setLevel" data-id="${p.id}" data-v="${l}">${LEVEL_NAMES[l]}</button>`).join('')}
        </div></div>
        <div class="field"><span>さんすうの むずかしさ</span><div class="row wrap">
          ${[1, 2, 3, 4, 5].map(l => `<button class="pill ${mathLevelOf(p) === l ? 'on' : ''}" data-act="setMathLevel" data-id="${p.id}" data-v="${l}">${MATH_LEVELS[l].name}</button>`).join('')}
        </div><small class="hint">${MATH_LEVELS[mathLevelOf(p)].sub}</small></div>
        <div class="field"><span>🌈 やさしい モード（もじが よめなくても あそべる）</span><div class="row wrap">
          ${[[0, 'つかわない'], [1, 'やさしい'], [2, 'すこし むずかしい']].map(([l, t]) => `<button class="pill ${easyLevelOf(p) === l ? 'on' : ''}" data-act="setEasy" data-id="${p.id}" data-v="${l}">${t}</button>`).join('')}
        </div><small class="hint">ホームの いちばん うえに「🌈 かんがえて あそぼう」が でます。こえで きいて、えを タッチするだけ。まちがえても もう1かい えらべます</small></div>
        <div class="field"><span>アイコン</span><div class="row wrap">
          <label class="btn sm">📷 しゃしんを えらぶ<input type="file" accept="image/*" class="photoFor" data-id="${p.id}" hidden></label>
          ${p.photo ? `<button class="btn sm ghost" data-act="removePhoto" data-id="${p.id}">しゃしんを はずす</button>` : ''}
        </div></div>
        <div class="row between"><small>💴 ${fmt(p.wallet.yen)}えん ／ かんせい ${p.completed.length}じょう ／ きょう ${Math.floor(playedSec(p) / 60)}ふん</small></div>
      </div>`).join('') : '<p>まだ こどもが いません。</p>';
  } else if (tab === 'stats') {
    body = statsHTML();
  } else if (tab === 'settings') {
    const lm = d.settings.limitMin;
    body = `
      <div class="card"><h3>⏰ 1日に あそべる じかん</h3>
        <div class="row wrap">${[0, 15, 20, 30, 45, 60, 90].map(m => `<button class="pill ${lm === m ? 'on' : ''}" data-act="setLimit" data-v="${m}">${m ? m + 'ふん' : 'せいげん なし'}</button>`).join('')}</div>
        <small class="hint">のこり5ふんで おしらせし、じかんに なったら「また あした」がめんに なります。</small>
        ${lm ? `<div class="sub-list">${d.profiles.map(p => `<div class="row between"><span>${esc(p.name)}：きょう ${Math.floor(playedSec(p) / 60)} / ${Math.round(limitSec(p) / 60)}ふん</span>
          <button class="btn sm" data-act="extend" data-id="${p.id}">＋15ふん（きょうだけ）</button></div>`).join('')}</div>` : ''}
      </div>
      <div class="card"><h3>☕ れんぞくで あそべる じかん と きゅうけい</h3>
        <div class="field"><span>れんぞくで あそべる じかん</span><div class="row wrap">${[[0, 'せいげん なし'], [30, '30ぷん'], [60, '1じかん'], [90, '1じかん30ぷん'], [120, '2じかん']].map(([m, l]) => `<button class="pill ${(d.settings.contMin || 0) === m ? 'on' : ''}" data-act="setCont" data-v="${m}">${l}</button>`).join('')}</div></div>
        <div class="field"><span>きゅうけい（さいてい）</span><div class="row wrap">${[15, 20, 30, 45, 60].map(m => `<button class="pill ${(d.settings.breakMin || 15) === m ? 'on' : ''}" data-act="setBreak" data-v="${m}">${m}ふん</button>`).join('')}</div></div>
        <small class="hint">つづけて あそんだ じかんが きまった じかんに なると「ひとやすみ」がめんに なり、きゅうけいが おわるまで あそべません（のこり5ふんで おしらせ）。とちゅうで きゅうけいの じかん いじょう はなれていた ときは、0から かぞえなおします。</small>
        ${d.profiles.some(onBreak) ? `<div class="sub-list">${d.profiles.filter(onBreak).map(p => `<div class="row between"><span>${esc(p.name)}：きゅうけいちゅう（あと ${Math.ceil((p.breakUntil - Date.now()) / 60000)}ふん）</span><button class="btn sm" data-act="clearBreak" data-id="${p.id}">きゅうけいを おわらせる</button></div>`).join('')}</div>` : ''}
      </div>
      <div class="card"><h3>👻 ふくしゅうの きびしさ（しっかりモード）</h3>
        <p class="hint">ふくしゅう待ちの おばけが この数を こえると、ふくしゅうするまで おしろの パーツを かえません。</p>
        <div class="row wrap">${[10, 20, 30, 50].map(n => `<button class="pill ${d.settings.reviewGate === n ? 'on' : ''}" data-act="setGate" data-v="${n}">${n}ひき</button>`).join('')}</div>
      </div>
      <div class="card"><h3>💱 かわせレート（1単位が何円か）</h3>
        <div class="rates">${FOREIGN.map(cur => `<label class="rate-in"><span>1${CURRENCIES[cur].name}</span><input type="number" min="5" step="5" inputmode="numeric" data-cur="${cur}" value="${d.settings.rates[cur]}"><span>えん</span></label>`).join('')}</div>
        <div class="row wrap"><button class="btn sm primary" data-act="saveRates">ほぞん</button><button class="btn sm ghost" data-act="resetRates">しょきち（${RATES_DATE}）に もどす</button></div>
        <small class="hint">いまのレート：${d.settings.ratesDate} 更新。5円単位で入れてください。</small>
      </div>
      <div class="card"><h3>🗑️ こどもの データを けす</h3>
        <div class="sub-list">${d.profiles.map(p => `<div class="row between"><span>${esc(p.name)}</span><button class="btn sm danger" data-act="delProfile" data-id="${p.id}">けす</button></div>`).join('') || '<p class="hint">まだ いません</p>'}</div></div>
      <div class="card"><h3>🔒 あんしょうばんごう</h3><p class="hint">この「せってい」を ひらくときだけ ひつようです。</p><button class="btn" data-act="changePin">ばんごうを かえる</button></div>`;
  } else if (tab === 'voice') {
    const v = d.settings.voice;
    const opt = (lang, key) => `<select data-voice="${key}"><option value="">じどう（${esc(currentVoiceName(lang))}）</option>${voiceList(lang).map(x => `<option ${v[key] === x.name ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>`;
    const noEn = voiceList('en-US').length === 0;
    body = `
      ${noEn ? `<div class="card warn-card"><h3>⚠️ この端末には 英語の声が 入っていません</h3>
        <p>このままだと、英語を日本語の声で読むため「カタコト」に聞こえます。次のどれかで直せます。</p>
        <ul class="howto">
          <li><b>PC：</b>Microsoft Edge でこのゲームを開く（英語の自然な声「Natural」が使えます）</li>
          <li><b>PC：</b>Windowsの「設定」→「時刻と言語」→「音声認識（または 読み上げ）」→「音声を追加」→「English (United States)」を入れる</li>
          <li><b>iPad：</b>英語の声は最初から入っています。下の方法で「プレミアム」の声にすると、さらに自然になります</li>
        </ul></div>` : ''}
      ${(() => {
        const n = currentVoiceName('en-US');
        const good = /Natural|Premium|Enhanced|拡張|プレミアム|Neural|Google/i.test(n);
        return `<div class="card ${good ? '' : 'warn-card'}"><h3>${good ? '✅ いまの英語の声は しぜんな声です' : '💡 いまの英語の声は ふつうの声です'}</h3><p>いま使っている声：<b>${esc(n)}</b></p>
          ${good ? '' : '<p>iPadなら、下の「📱 iPadで もっと しぜんな こえに する方法」で「プレミアム」の声をダウンロードすると、Edgeと同じくらい自然になります（無料・1回だけ）。</p>'}</div>`;
      })()}
      <div class="card"><h3>🔊 よみあげの こえ</h3>
        <div class="field"><span>えいご（アメリカ）</span>${opt('en-US', 'en')} <button class="btn sm" data-act="testVoice" data-l="en">▶ きく</button></div>
        <div class="field"><span>にほんご</span>${opt('ja-JP', 'ja')} <button class="btn sm" data-act="testVoice" data-l="ja">▶ きく</button></div>
        <div class="field"><span>はやさ</span><div class="row wrap">${[[0.85, 'ゆっくり'], [1, 'ふつう'], [1.1, 'すこし はやい']].map(([r, l]) => `<button class="pill ${v.rate === r ? 'on' : ''}" data-act="setRate" data-v="${r}">${l}</button>`).join('')}</div></div>
      </div>
      <div class="card"><h3>📱 iPadで もっと しぜんな こえに する方法</h3>
        <ol class="howto">
          <li>iPadの「設定」→「アクセシビリティ」→「読み上げコンテンツ」→「声」を開く</li>
          <li>「英語」→ アメリカ英語の「Ava（プレミアム）」や「Samantha（拡張）」などをダウンロード</li>
          <li>「日本語」→「Kyoko（拡張）」または「Otoya（拡張）」をダウンロード</li>
          <li>このゲームを開き直すと、自然な声が自動で選ばれます（上の一覧からも選べます）</li>
        </ol>
        <small class="hint">PCでは Microsoft Edge で開くと「Natural」の自然な声が使えます。</small>
      </div>`;
  } else if (tab === 'letters') {
    body = LETTERS.parentHTML();
  } else if (tab === 'credits') {
    const list = Object.entries(PHOTOS).map(([id, p]) => ({ id, p, w: BY_ID[id] })).filter(x => x.w).sort((a, b) => a.w.en.localeCompare(b.w.en));
    body = `
      <div class="card"><h3>📷 しゃしんの クレジット（${list.length}まい）</h3>
        <p class="hint">クイズの写真は、Wikipedia（ウィキペディア）の記事に使われている、自由に使える写真です。作者とライセンスは次のとおりです。写真は正方形に切り取って小さくしています。</p>
        <ul class="credit-list">${list.map(({ w, p }) => `<li><b>${esc(w.en)}</b>（${esc(w.ja)}）：${esc(p.artist)}／${esc(p.license)}／<a href="${esc(p.url)}" target="_blank" rel="noopener">出典</a></li>`).join('')}</ul>
      </div>`;
  } else if (tab === 'backup') {
    body = `
      <div class="card"><h3>💾 バックアップ</h3>
        <p class="hint">データは この iPad の中だけに 保存されています（写真も外には送りません）。iPadの こわれや 入れかえに そなえて、ときどき 書き出してください（「ファイル」アプリに 保存されます）。</p>
        <div class="row wrap"><button class="btn primary" data-act="exportData">書き出す</button>
        <label class="btn">読み込む<input type="file" id="importFile" accept="application/json,.json" hidden></label></div>
      </div>`;
  }
  return `
  <header class="bar parent-bar"><button class="icon-btn" data-act="go" data-to="profiles">✕</button><div class="who"><b>おうちのひと メニュー</b></div><div></div></header>
  <div class="page">
    <div class="card row between wrap" style="padding:10px 14px"><span>🧩 ゲームの 版：<b>${APP_VERSION}</b></span><button class="btn sm" data-act="forceUpdate">🔄 さいしんに する</button></div>
    <div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-act="ptab" data-v="${k}">${l}</button>`).join('')}</div>
    ${body}
  </div>`;
}

function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }
function bar(label, ok, total) {
  const v = pct(ok, total);
  const cls = v >= 80 ? 'good' : v >= 60 ? 'mid' : 'low';
  return `<div class="sbar"><span class="sl">${label}</span><span class="track"><span class="fill ${cls}" style="width:${v}%"></span></span><span class="sv">${v}%<small>（${ok}/${total}）</small></span></div>`;
}
function statsHTML() {
  const ps = db().profiles;
  if (!ps.length) return '<p>まだ データが ありません。</p>';
  const p = ps.find(x => x.id === S.statsId) || ps[0];
  const h = p.history.filter(x => !x.r);
  const ok = h.filter(x => x.ok).length;
  const byType = {}, byCat = {}, byDay = {};
  for (const x of h) {
    (byType[x.ty] ||= [0, 0]); byType[x.ty][1]++; if (x.ok) byType[x.ty][0]++;
    const w = BY_ID[x.w]; if (w) { (byCat[w.cat] ||= [0, 0]); byCat[w.cat][1]++; if (x.ok) byCat[w.cat][0]++; }
    (byDay[x.d] ||= [0, 0]); byDay[x.d][1]++; if (x.ok) byDay[x.d][0]++;
  }
  const days = Array.from({ length: 14 }, (_, i) => addDays(today(), i - 13));
  const maxDay = Math.max(10, ...days.map(d => byDay[d]?.[1] || 0));
  const wrongs = p.history.filter(x => !x.ok).slice(-60).reverse();
  const hard = Object.entries(p.review).filter(([id]) => BY_ID[id]).sort((a, b) => b[1].wrong - a[1].wrong).slice(0, 10);
  const totalMin = Math.round(Object.values(p.play).reduce((s, v) => s + v, 0) / 60);
  const fmtTime = ts => { const d = new Date(ts); return `${today(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const optLabel = (id, ty) => { if (id.startsWith('txt:')) return id.slice(4); const w = BY_ID[id]; if (!w) return id; return ty === 5 ? w.ja : [2, 3, 8, 13].includes(ty) ? `${w.pic || ''}（${w.en}）` : w.en; };
  return `
    <div class="row wrap">${ps.map(x => `<button class="pill ${x.id === p.id ? 'on' : ''}" data-act="statsFor" data-id="${x.id}">${esc(x.name)}</button>`).join('')}</div>
    <div class="kpis">
      <div class="kpi"><span>こたえた数</span><b>${h.length}</b></div>
      <div class="kpi"><span>せいかい率</span><b>${pct(ok, h.length)}%</b></div>
      <div class="kpi"><span>ふくしゅう待ち</span><b>${dueIds(p).length}</b></div>
      <div class="kpi"><span>卒業した ことば</span><b>${friendIds(p).length}</b></div>
      <div class="kpi"><span>さいこう れんぞく</span><b>${p.bestStreak || 0}</b></div>
      <div class="kpi"><span>あそんだ じかん</span><b>${totalMin}ふん</b></div>
      <div class="kpi"><span>かせいだ おかね</span><b>${fmt(p.totalYen || 0)}えん</b></div>
      <div class="kpi"><span>かんせいした おしろ</span><b>${p.completed.length}</b></div>
    </div>
    <div class="card"><h3>📅 さいきん14日</h3>
      <div class="days">${days.map(d => { const v = byDay[d] || [0, 0]; return `<div class="day" title="${d}：${v[1]}問・${pct(v[0], v[1])}%"><span class="dbar" style="height:${(v[1] / maxDay) * 100}%"><span class="dok" style="height:${pct(v[0], v[1])}%"></span></span><small>${d.slice(8)}</small></div>`; }).join('')}</div>
      <small class="hint">棒の高さ＝こたえた数、こい色＝せいかいの わりあい</small>
    </div>
    <div class="card"><h3>🧩 もんだいの しゅるい べつ</h3>${Object.keys(TYPE_NAMES).map(t => byType[t] ? bar(TYPE_NAMES[t], ...byType[t]) : '').join('') || '<p class="hint">まだ ありません</p>'}</div>
    <div class="card"><h3>🗂️ カテゴリ べつ（にがてな順）</h3>${Object.entries(byCat).sort((a, b) => pct(...a[1]) - pct(...b[1])).map(([c, v]) => bar(CATS[c], ...v)).join('') || '<p class="hint">まだ ありません</p>'}</div>
    <div class="card"><h3>👻 なかなか 卒業できない ことば</h3>
      ${hard.length ? `<table class="tbl"><tr><th>ことば</th><th>まちがい</th><th>じょうたい</th><th>つぎの ふくしゅう</th></tr>${hard.map(([id, r]) => { const w = BY_ID[id]; return `<tr><td>${w.pic} ${esc(w.en)}（${esc(w.ja)}）</td><td>${r.wrong}回</td><td>${r.grad ? '🌟 卒業' : '❤️'.repeat(r.box) + '🤍'.repeat(4 - r.box)}</td><td>${r.grad ? '－' : r.due}</td></tr>`; }).join('')}</table>` : '<p class="hint">まだ ありません</p>'}
    </div>
    <div class="card"><h3>❌ まちがえた もんだい（さいきん60件）</h3>
      ${wrongs.length ? `<table class="tbl"><tr><th>日時</th><th>しゅるい</th><th>もんだい</th><th>えらんだ答え</th><th>せいかい</th></tr>${wrongs.map(x => { const w = BY_ID[x.w]; if (!w) return ''; const prompt = x.ty === 4 ? w.ja : x.ty === 1 ? w.pic : w.en; return `<tr><td>${fmtTime(x.ts)}</td><td>${TYPE_NAMES[x.ty]}</td><td>${esc(prompt)}</td><td class="ng">${esc(optLabel(x.c, x.ty))}</td><td class="okc">${esc(optLabel(x.w, x.ty))}</td></tr>`; }).join('')}</table>` : '<p class="hint">まだ ありません</p>'}
    </div>`;
}
function bindParent() {
  const f = document.getElementById('importFile');
  f?.addEventListener('change', async () => {
    const file = f.files?.[0]; if (!file) return;
    try {
      const d = JSON.parse(await file.text());
      if (!Array.isArray(d.profiles)) throw new Error('bad file');
      if (!confirm(`バックアップを読み込みます（こども ${d.profiles.length}人）。いまの データは 置きかわります。よろしいですか？`)) return;
      replaceDB(d); setVoicePrefs(db().settings.voice); toast('読み込みました'); render();
    } catch (e) { alert('このファイルは 読み込めませんでした'); }
  });
  document.querySelectorAll('.photoFor').forEach(inp => {
    inp.addEventListener('change', async () => {
      const file = inp.files?.[0]; if (!file) return;
      try { const p = db().profiles.find(x => x.id === inp.dataset.id); p.photo = await squarePhoto(file); save(); render(); } catch (e) { alert('しゃしんを よみこめませんでした'); }
    });
  });
  document.querySelectorAll('select[data-voice]').forEach(sel => {
    sel.addEventListener('change', () => { db().settings.voice[sel.dataset.voice] = sel.value; save(); setVoicePrefs(db().settings.voice); render(); });
  });
}
onVoicesChanged(() => { if (S.screen === 'parent' && S.parentTab === 'voice') render(); });
function exportData() {
  const blob = new Blob([JSON.stringify(db(), null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `castle-quest-backup-${today()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ---------- タップ操作 ----------
const ACTIONS = {
  go: d => { sfx.tap(); go(d.to, { previewing: false }); },
  pick: d => { sfx.tap(); setActive(d.id); const p = activeProfile(); if (overLimit(p)) go('limit'); else if (onBreak(p)) go('rest'); else { go('games'); sayJa(`${p.name}、なにで あそぶ？`); } },
  playGame: d => {
    sfx.tap();
    const p = activeProfile();
    if (d.g === 'rally') { window.__leaving = true; location.assign('rally.html'); return; }
    S.game = d.g;
    if (d.g === 'castle') { go('home'); sayJa(`${p.name}、一緒にがんばろう！`); }
    else { go(p.dino.order.length ? 'dhome' : 'deggs'); sayJa(p.dino.order.length ? `${p.name}、恐竜が待ってるよ！` : 'たまごを選んでね！'); }
  },
  age: d => { S.newProfile.name = document.getElementById('pname')?.value || S.newProfile.name; S.newProfile.age = Number(d.v); render(); },
  avatar: d => { S.newProfile.name = document.getElementById('pname')?.value || S.newProfile.name; S.newProfile.avatar = d.v; render(); },
  clearPhoto: () => { S.newProfile.photo = null; render(); },
  createProfile: () => {
    const n = S.newProfile;
    const name = (document.getElementById('pname')?.value || n.name).trim();
    if (!name) { toast('なまえを いれてね'); return; }
    const p = createProfile({ name, age: n.age, avatar: n.avatar, photo: n.photo });
    S.newProfile = { name: '', age: 5, avatar: AVATARS[0], photo: null };
    setActive(p.id);
    sfx.fanfare();
    go('home');
    sayJa(`ようこそ、${name}！ 英語でお城を建てよう！`);
  },
  startQuiz: d => { sfx.tap(); startQuiz(d.mode); },
  puzzleTry: () => { if (!puzzleOpen()) { sfx.tap(); toast('🧩 ひらめき パズルは いま つくっているよ。もうすこし まってね！', 2800); return; } sfx.tap(); startQuiz('puzzle'); },
  answer: (d, el) => answer(d.id, el),
  sayOpt: (d, el, e) => { e.stopPropagation(); sayEn(BY_ID[d.id].en); },
  sayWord: d => sayEn(BY_ID[d.id].en),
  replay: () => { const q = S.quiz.qs[S.quiz.i]; if (q.math) { say(q.say); return; } say(q.say && q.say.some(x => x.l === 'en') ? q.say.filter(x => x.l === 'en') : [{ t: BY_ID[q.wid].en, l: 'en' }]); },
  sayAfter: () => { const q = S.quiz.qs[S.quiz.i]; if (q.math) { say([{ t: '正解は、' + mathYomi(q.answer.slice(4)) + '。', l: 'ja' }, ...(q.explain ? [{ t: mathYomi(q.explain), l: 'ja' }] : [])]); return; } sayEn(q.after || BY_ID[q.wid].en); },
  said: () => { sfx.tap(); nextQuestion(); },
  quitQuiz: () => { if (confirm('やめる？（もらった おかねは そのままだよ）')) go(homeScreen()); },
  openCastle: d => { sfx.tap(); go('castle', { castleId: d.id, previewing: false }); },
  build: d => build(false),
  exchangeBuild: () => build(true),
  exchange: d => {
    const n = Number(d.n);
    if (exchange(d.cur, n)) { toast(`💱 ${fmt(n * rate(d.cur))}えん → ${money(d.cur, n)}`); sayJa(`${n}${CURRENCIES[d.cur].name}に両替したよ`); render(); }
  },
  preview: () => {
    if (!S.previewing && !S.previewOK) { askPin('preview'); return; }
    S.previewing = !S.previewing;
    castleView?.preview(S.previewing);
    document.querySelector('.preview-btn').outerHTML = `<button class="preview-btn ${S.previewing ? 'on' : ''}" data-act="preview">${S.previewing ? '🔙 もどる' : '🖼️ かんせいず 🔒'}</button>`;
    document.querySelector('.preview-banner')?.remove();
    if (S.previewing) document.querySelector('.castle-page').insertAdjacentHTML('beforeend', '<div class="preview-banner">✨ かんせいずだよ！ ここまで たてよう ✨</div>');
  },
  time: d => {
    S.castleTime = d.v; castleView?.setTime(d.v);
    document.querySelectorAll('.time-switch .pill').forEach(b => b.classList.toggle('on', b.dataset.v === d.v));
    const sky = { day: 'day', evening: 'sunset', night: 'night' }[d.v];
    document.querySelectorAll('.stage-sky > div').forEach(el => el.classList.toggle('on', el.classList.contains('sky-' + sky)));
  },
  readDesc: d => showDesc(d.id),
  parent: d => {
    if (d.next === 'extend' || d.next === 'endBreak') { askPin(d.next); return; }
    S.parentTab = 'home'; S.pinOK = false;
    go('parent');
  },
  pinKey: d => pinKey(d.v),
  pinDel: () => { S.pin.buf = S.pin.buf.slice(0, -1); render(); },
  pinCancel: () => { if (S.pin.next === 'extend') go('limit'); else if (S.pin.next === 'endBreak') go('rest'); else if (S.pin.next === 'preview') go('castle', { previewing: false }); else { S.parentTab = 'home'; go('parent'); } },
  ptab: d => { if ((d.v === 'settings' || d.v === 'letters') && !S.pinOK) { askPin(d.v); return; } S.parentTab = d.v; render(); },
  statsFor: d => { S.statsId = d.id; S.parentTab = 'stats'; render(); },
  setMathLevel: d => { const p = db().profiles.find(x => x.id === d.id); p.mathLevel = Number(d.v); save(); render(); },
  setEasy: d => { const p = db().profiles.find(x => x.id === d.id); p.easy = Number(d.v); save(); render(); },
  setLevel: d => { const p = db().profiles.find(x => x.id === d.id); p.level = Number(d.v); save(); render(); },
  // ふるい 版で とまった ときの ための ボタン：保存した プログラムと 画像を けして よみなおす（あそんだ きろくは けさない）
  forceUpdate: async () => {
    toast('さいしんに しています…', 4000);
    try { for (const r of await navigator.serviceWorker?.getRegistrations?.() || []) await r.unregister(); } catch (e) {}
    try { for (const k of await caches.keys()) await caches.delete(k); } catch (e) {}
    location.replace(location.pathname + '?u=' + Date.now());
  },
  removePhoto: d => { const p = db().profiles.find(x => x.id === d.id); p.photo = null; save(); render(); },
  delProfile: d => {
    const p = db().profiles.find(x => x.id === d.id);
    if (confirm(`${p.name} の データを けします。もとに もどせません。よろしいですか？`)) { deleteProfile(d.id); render(); }
  },
  setLimit: d => { db().settings.limitMin = Number(d.v); save(); render(); },
  setCont: d => { db().settings.contMin = Number(d.v); save(); render(); },
  setBreak: d => { db().settings.breakMin = Number(d.v); save(); render(); },
  clearBreak: d => { const p = db().profiles.find(x => x.id === d.id); p.breakUntil = 0; p.contSec = 0; save(); toast(`${p.name}：きゅうけいを おわりに しました`); render(); },
  extend: d => { const p = db().profiles.find(x => x.id === d.id); const t = today(); p.extra[t] = (p.extra[t] || 0) + 15; save(); toast(`${p.name}：きょうは あと15ふん ふえました`); render(); },
  setGate: d => { db().settings.reviewGate = Number(d.v); save(); render(); },
  saveRates: () => {
    const r = db().settings.rates;
    let bad = false;
    document.querySelectorAll('.rate-in input').forEach(i => { const v = Math.round(Number(i.value) / 5) * 5; if (!v || v < 5) bad = true; else r[i.dataset.cur] = v; });
    if (bad) { alert('5円以上の数字を入れてください'); return; }
    db().settings.ratesDate = today(); save(); toast('レートを ほぞんしました'); render();
  },
  resetRates: () => { db().settings.rates = { ...DEFAULT_RATES }; db().settings.ratesDate = RATES_DATE; save(); render(); },
  testVoice: d => d.l === 'en' ? sayEn('Hello! This is Himeji Castle. Let us build castles together!') : sayJa('こんにちは。いっしょに英語でお城を建てよう！'),
  setRate: d => { db().settings.voice.rate = Number(d.v); save(); setVoicePrefs(db().settings.voice); render(); },
  changePin: () => { S.pin = { buf: '', mode: 'setup1', first: '', next: 'parent', msg: '' }; go('setupPin'); },
  exportData: () => exportData(),
};

installDino({
  S, SCREENS, ACTIONS, AFTER, BG, LEAVE, go, render, db, save, activeProfile, esc, fmt, toast, sfx, say, sayJa, sayEn, stopSpeech,
  header, dueIds, startQuiz, easyLevelOf, overLimit, onBreak, rate, money, wallet, exchange, today, puzzleOpen,
});
// サンタさんへの おてがみ ／ パパと おはなし
const LETTERS = installLetters({ S, SCREENS, ACTIONS, AFTER, BG, LEAVE, go, render, activeProfile, esc, toast, sfx, header, squarePhoto });
Object.assign(ACTIONS, LETTERS.actions);

app.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) fn(el.dataset, el, e);
});
document.addEventListener('pointerdown', () => { unlockSpeech(); sfx.unlock(); }, { once: true });

// ホーム画面に置いたとき、オフラインでも動くようにする（本番のみ）
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(reg => {
    // アプリに戻ってきたときにも、新しい版がないか確かめる
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(e => console.warn('sw', e));
  // 新しい版が届いたら、トップ画面にいるときだけ1回読み直す（遊んでいる途中はじゃましない）
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded || window.__leaving) return;
    const tryReload = () => { if (window.__leaving) return; if (['profiles', 'boot', 'home', 'games', 'dhome'].includes(S.screen)) { reloaded = true; location.reload(); } else setTimeout(tryReload, 3000); };
    tryReload();
  });
  // ラリーから もどってきたら、また 読み直しを ゆるす
  window.addEventListener('pageshow', ev => { if (ev.persisted) window.__leaving = false; });
  // 写真もiPadに保存しておく（オフラインでも出るように）
  // ・ほぞんして いない 写真だけを、1日 1かい、すこしずつ（まえは 毎回 11MB を とりなおしていた）
  setTimeout(async () => {
    try {
      if (navigator.connection?.saveData) return;
      const day = new Date().toDateString();
      if (localStorage.getItem('cq.photosDay') === day) return;
      // SW が 指紋つきで 保存する（保存ずみなら ネットに いかない）
      for (const src of Object.values(PHOTOS).map(p => p.src)) {
        try { await fetch(src); } catch (e) { return; }
        await new Promise(r => setTimeout(r, 120));
      }
      localStorage.setItem('cq.photosDay', day);
    } catch (e) {}
  }, 15000);
}

// 開発用：?shot=お城のID で、3Dだけを全画面で表示する（データは保存しない）
const SHOT = new URLSearchParams(location.search);
if (SHOT.get('shot')) {
  (async () => {
    document.body.dataset.bg = 'castle';
    const sky = { day: 'day', evening: 'sunset', night: 'night' }[SHOT.get('t') || 'day'];
    app.innerHTML = `<div class="castle-page" style="height:100vh"><div class="stage-sky"><div class="sky-${sky} on"></div></div><div id="stage" class="stage" style="height:100vh"></div></div>`;
    const mod = await import('./diorama/engine.js');
    const v = new mod.CastleView();
    const c = CASTLE_BY_ID[SHOT.get('shot')];
    await v.load(c.id, { ja: c.name, en: c.en });
    v.attach(document.getElementById('stage'));
    v.controls.autoRotate = false;
    v.setTime(SHOT.get('t') || 'day');
    v.setParts(Number(SHOT.get('n') ?? 30), false);
    if (SHOT.get('cam')) { const [x, y, z, tx, ty, tz] = SHOT.get('cam').split(',').map(Number); v.camera.position.set(x, y, z); v.controls.target.set(tx, ty, tz); v.controls.update(); }
    document.title = 'ready';
  })();
} else {
  render();
}
