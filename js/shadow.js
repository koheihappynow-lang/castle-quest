// 🌑 かげ あて：くろい かげを みて、どれかを あてる。あたると 色が ついて うごきだす
// ・もじは なくても あそべる（ぜんぶ こえ）・まちがえても「おしい！」で もういちど
// ・むずかしさ 4だんかい（やさしい モード／ねんれい で きまる）
//   1：3つから（ちがう なかま） 2：4つから（おなじ なかま） 3：かげが はんたい むき 4：かげの 一部だけ
// ・おかね：1かいめで あたり＝むずかしさに おうじて、2かいめ＝すこし
import { SHADOW_ITEMS, SHADOW_IMAGES } from './shadowItems.js';
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const CHEER = ['すごい！', 'あたり！', 'やったね！', 'みつけた！', 'せいかい！'];
const LV = {
  1: { opts: 3, same: false, rounds: 6, yen: 300, name: 'やさしい' },
  2: { opts: 4, same: true, rounds: 6, yen: 400, name: 'ふつう' },
  3: { opts: 4, same: true, rounds: 8, yen: 500, flip: true, name: 'むずかしい' },
  4: { opts: 4, same: true, rounds: 8, yen: 600, part: true, name: 'ちょうむずかしい' },
};
const RETRY_YEN = 100;
const pic = (x, cls = '') => SHADOW_IMAGES.has(x.id) ? `<img class="sh-img ${cls}" src="cards/shadow/${x.id}.png" alt="">` : `<span class="${cls}">${x.e}</span>`;

export function installShadow(api) {
  const { S, SCREENS, ACTIONS, AFTER, BG, LEAVE, go, render, activeProfile, sayJa, sfx, header, homeScreen, easyLevelOf, save, wallet, fmt, today } = api;
  let busy = false, timers = [];
  const later = (f, ms) => timers.push(setTimeout(f, ms));
  // むずかしさ：やさしい モードの こは そのまま、ほかは ねんれいで（5さい＝2、6さい＝3、7さい いじょう＝4）
  const levelOf = p => { const e = easyLevelOf(p); if (e) return e; const a = p.age || 6; return a <= 4 ? 1 : a === 5 ? 2 : a === 6 ? 3 : 4; };
  function makeRound(L, used) {
    const pool = SHADOW_ITEMS.filter(x => !used.has(x.id));
    const ans = pool[R(0, pool.length - 1)];
    const n = L.opts;
    let wrongs;
    if (L.same) {
      // おなじ なかま（にている）から。たりない ときは ほかから
      wrongs = [...shuffle(SHADOW_ITEMS.filter(x => x.id !== ans.id && x.cat === ans.cat)), ...shuffle(SHADOW_ITEMS.filter(x => x.cat !== ans.cat))].slice(0, n - 1);
    } else {
      // ちがう なかまから 1つずつ（かたちが ぜんぜん ちがう）
      const cats = shuffle([...new Set(SHADOW_ITEMS.map(x => x.cat))].filter(c => c !== ans.cat));
      wrongs = cats.slice(0, n - 1).map(c => shuffle(SHADOW_ITEMS.filter(x => x.cat === c))[0]);
    }
    // 一部だけ みせる ときの ずらし
    const part = L.part ? { x: R(-16, 16) || 12, y: R(-14, 14) } : null;
    return { ans, opts: shuffle([ans, ...wrongs]), tries: 0, done: false, part };
  }
  function start() {
    const p = activeProfile(), lv = levelOf(p), L = LV[lv], used = new Set(), rounds = [];
    for (let i = 0; i < L.rounds; i++) { const r = makeRound(L, used); used.add(r.ans.id); rounds.push(r); }
    S.shadow = { lv, rounds, i: 0, found: [], yen: 0 };
    busy = false;
    go('shadow');
  }
  SCREENS.shadow = () => {
    const p = activeProfile(), G = S.shadow;
    if (!G) return '';
    const L = LV[G.lv];
    if (G.i >= G.rounds.length) return `
      ${header(p)}
      <div class="page narrow center-text sh-end">
        <div class="sh-endtitle">🌟</div>
        <div class="sh-found">${G.found.map((x, k) => `<span style="animation-delay:${k * 0.12}s">${pic(x)}</span>`).join('')}</div>
        ${G.yen ? `<div class="coin-total sh-yen"><span>💴</span><b>${fmt(G.yen)}</b><span>えん ゲット！</span></div>` : ''}
        <div class="row center">
          <button class="btn primary big" data-act="shadowStart">🔁 もういちど</button>
          <button class="btn big" data-act="go" data-to="${homeScreen()}">🏠</button>
        </div>
      </div>`;
    const r = G.rounds[G.i];
    const tf = r.done ? '' : r.part ? `style="--px:${r.part.x}%;--py:${r.part.y}%"` : '';
    return `
      ${header(p)}
      <div class="page sh-page">
        <div class="sh-top"><span class="sh-lv">🌑 ${L.name}</span><div class="sh-dots">${G.rounds.map((_, k) => `<i class="${k < G.i ? 'on' : k === G.i ? 'now' : ''}"></i>`).join('')}</div></div>
        <div class="sh-stage">
          <span class="sh-big ${r.done ? 'lit ' + r.ans.m : `${L.flip ? 'flip' : ''} ${r.part ? 'part' : ''}`}" id="shBig" ${tf}>${pic(r.ans)}</span>
          <span class="sh-name" id="shName">${r.done ? r.ans.n : ''}</span>
          <button class="sh-say" data-act="shadowSay" aria-label="もういちど きく">🔊</button>
        </div>
        <div class="sh-opts n${r.opts.length}">${r.opts.map((x, k) => `<button class="sh-opt" data-act="shadowPick" data-k="${k}" ${r.done ? 'disabled' : ''}>${pic(x)}</button>`).join('')}</div>
      </div>`;
  };
  BG.shadow = 'rest';
  const ask = () => { const G = S.shadow, L = LV[G.lv]; return L.part ? 'かげの 一部だけ みえるよ。だれかな？' : L.flip ? 'かげが はんたい むきだよ。だれかな？' : 'この かげは だれかな？'; };
  AFTER.shadow = () => {
    const G = S.shadow; if (!G) return;
    if (G.i >= G.rounds.length) { sfx.fanfare(); sayJa(G.yen ? `ぜんぶ みつけたね！ ${G.yen}円 ゲット！` : 'ぜんぶ みつけたね！ すごい！'); return; }
    if (!G.rounds[G.i].done) later(() => sayJa(G.i === 0 ? `かげ あて だよ。${ask()}` : ask()), 300);
  };
  LEAVE.shadow = () => { timers.forEach(clearTimeout); timers = []; busy = false; };
  ACTIONS.shadowStart = () => { sfx.tap(); start(); };
  ACTIONS.shadowSay = () => sayJa(ask());
  ACTIONS.shadowPick = (d, el) => {
    const G = S.shadow, r = G?.rounds[G.i];
    if (!r || r.done || busy) return;
    const x = r.opts[Number(d.k)];
    r.tries++;
    if (x.id !== r.ans.id) {
      // まちがい：その えだけ ゆらして、もういちど
      sfx.tap(); el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope'); el.disabled = true;
      sayJa(r.tries >= 2 ? `おしい！ ${r.ans.n}は どれかな？` : 'おしい！ もういちど よく みてね');
      return;
    }
    // あたり：かげに 色が ついて うごきだす
    busy = true; r.done = true; G.found.push(r.ans);
    const p = activeProfile();
    const yen = r.tries === 1 ? LV[G.lv].yen : r.tries === 2 ? RETRY_YEN : 0;
    if (yen) { const W = wallet(p); W.yen += yen; if (S.game === 'dino') p.dino.totalYen = (p.dino.totalYen || 0) + yen; else p.totalYen = (p.totalYen || 0) + yen; G.yen += yen; const chip = document.querySelector('#yenChip b'); if (chip) chip.textContent = fmt(W.yen); sfx.coin(); }
    p.shadowFound = (p.shadowFound || 0) + 1;
    p.history.push({ d: today(), ts: Date.now(), w: 'shadow:' + r.ans.cat, ty: 'shadow', c: x.id, ok: r.tries === 1, m: 'shadow', r: 0, ch: 0 });
    save();
    sfx.correct();
    el.classList.add('yes');
    document.querySelectorAll('.sh-opt').forEach(b => { b.disabled = true; });
    const big = document.getElementById('shBig'); big.classList.remove('flip', 'part'); big.removeAttribute('style'); big.classList.add('lit', r.ans.m);
    const nm = document.getElementById('shName'); if (nm) nm.textContent = r.ans.n;
    sayJa(`${CHEER[R(0, CHEER.length - 1)]} ${r.ans.n}！`);
    later(() => { G.i++; busy = false; render(); }, 2700);
  };
  return { start, levelOf };
}
