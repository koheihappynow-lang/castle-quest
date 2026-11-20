// 🌑 かげ あて（りく用）：くろい かげを みて、どれかを あてる。あたると 色が ついて うごきだす
// ・もじは つかわない（ぜんぶ こえ）・まちがえても「おしい！」で もういちど・おかねは もらえない（たのしいから あそぶ）
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
// e：え、n：よびかた、m：うごきかた（hop＝はねる、drive＝はしっていく、fly＝とんでいく、swim＝およぐ、stomp＝のしのし）
const ITEMS = {
  どうぶつ: [
    { e: '🐘', n: 'ぞうさん', m: 'stomp' }, { e: '🦒', n: 'きりんさん', m: 'stomp' }, { e: '🐰', n: 'うさぎさん', m: 'hop' },
    { e: '🐢', n: 'かめさん', m: 'stomp' }, { e: '🐧', n: 'ペンギンさん', m: 'hop' }, { e: '🦁', n: 'ライオンさん', m: 'stomp' },
    { e: '🐓', n: 'にわとりさん', m: 'hop' }, { e: '🐌', n: 'かたつむりさん', m: 'stomp' }, { e: '🦀', n: 'かにさん', m: 'hop' },
    { e: '🐿️', n: 'りすさん', m: 'hop' }, { e: '🦩', n: 'フラミンゴさん', m: 'hop' }, { e: '🐪', n: 'らくださん', m: 'stomp' },
  ],
  うみ: [{ e: '🐳', n: 'くじらさん', m: 'swim' }, { e: '🐙', n: 'たこさん', m: 'swim' }, { e: '🐬', n: 'いるかさん', m: 'swim' }, { e: '🦈', n: 'さめさん', m: 'swim' }, { e: '🐠', n: 'おさかなさん', m: 'swim' }],
  のりもの: [
    { e: '🚗', n: 'くるま', m: 'drive' }, { e: '🚒', n: 'しょうぼうしゃ', m: 'drive' }, { e: '🚑', n: 'きゅうきゅうしゃ', m: 'drive' },
    { e: '🚂', n: 'きしゃ', m: 'drive' }, { e: '🚲', n: 'じてんしゃ', m: 'drive' }, { e: '🚜', n: 'トラクター', m: 'drive' }, { e: '🚌', n: 'バス', m: 'drive' },
    { e: '✈️', n: 'ひこうき', m: 'fly' }, { e: '🚁', n: 'ヘリコプター', m: 'fly' }, { e: '🚀', n: 'ロケット', m: 'fly' }, { e: '⛵', n: 'ヨット', m: 'swim' },
  ],
  きょうりゅう: [{ e: '🦖', n: 'ティラノサウルス', m: 'stomp' }, { e: '🦕', n: 'くびながりゅう', m: 'stomp' }],
};
const ALL = Object.entries(ITEMS).flatMap(([cat, xs]) => xs.map(x => ({ ...x, cat })));
const ROUNDS = 6;
const CHEER = ['すごい！', 'あたり！', 'やったね！', 'みつけた！', 'せいかい！'];

export function installShadow(api) {
  const { S, SCREENS, ACTIONS, AFTER, BG, LEAVE, go, render, activeProfile, sayJa, sfx, header, homeScreen, easyLevelOf, save } = api;
  let busy = false, timers = [];
  const later = (f, ms) => timers.push(setTimeout(f, ms));
  // 1かい ぶんの もんだい：レベル1は ちがう なかまから（かたちが ちがう）、レベル2は おなじ なかまから（にている）
  function makeRound(level, used) {
    const pool = ALL.filter(x => !used.has(x.e));
    const ans = pool[R(0, pool.length - 1)];
    const n = level >= 2 ? 4 : 3;
    const same = shuffle(ALL.filter(x => x.e !== ans.e && x.cat === ans.cat));
    const other = shuffle(ALL.filter(x => x.e !== ans.e && x.cat !== ans.cat));
    // レベル1：ちがう なかまから 1つずつ（かたちが ぜんぜん ちがう）
    const byCat = shuffle(Object.keys(ITEMS).filter(c => c !== ans.cat)).map(c => shuffle(ITEMS[c])[0]);
    const wrongs = level >= 2 ? [...same, ...other].slice(0, n - 1) : byCat.slice(0, n - 1);
    return { ans, opts: shuffle([ans, ...wrongs]), tries: 0, done: false };
  }
  function start() {
    const p = activeProfile(), level = Math.max(1, easyLevelOf(p) || 1), used = new Set(), rounds = [];
    for (let i = 0; i < ROUNDS; i++) { const r = makeRound(level, used); used.add(r.ans.e); rounds.push(r); }
    S.shadow = { level, rounds, i: 0, found: [] };
    busy = false;
    go('shadow');
  }
  SCREENS.shadow = () => {
    const p = activeProfile(), G = S.shadow;
    if (!G) return '';
    if (G.i >= G.rounds.length) return `
      ${header(p)}
      <div class="page narrow center-text sh-end">
        <div class="sh-endtitle">🌟</div>
        <div class="sh-found">${G.found.map((x, k) => `<span style="animation-delay:${k * 0.15}s">${x}</span>`).join('')}</div>
        <div class="row center">
          <button class="btn primary big" data-act="shadowStart">🔁 もういちど</button>
          <button class="btn big" data-act="go" data-to="${homeScreen()}">🏠</button>
        </div>
      </div>`;
    const r = G.rounds[G.i];
    return `
      ${header(p)}
      <div class="page sh-page">
        <div class="sh-dots">${G.rounds.map((_, k) => `<i class="${k < G.i ? 'on' : k === G.i ? 'now' : ''}"></i>`).join('')}</div>
        <div class="sh-stage"><span class="sh-big ${r.done ? 'lit ' + r.ans.m : ''}" id="shBig">${r.ans.e}</span><button class="sh-say" data-act="shadowSay" aria-label="もういちど きく">🔊</button></div>
        <div class="sh-opts n${r.opts.length}">${r.opts.map((x, k) => `<button class="sh-opt" data-act="shadowPick" data-k="${k}" ${r.done ? 'disabled' : ''}>${x.e}</button>`).join('')}</div>
      </div>`;
  };
  BG.shadow = 'rest';
  AFTER.shadow = () => {
    const G = S.shadow; if (!G) return;
    if (G.i >= G.rounds.length) { sfx.fanfare(); sayJa('ぜんぶ みつけたね！ すごい！'); return; }
    if (!G.rounds[G.i].done) later(() => sayJa(G.i === 0 ? 'かげ あて だよ。この かげは だれかな？' : 'つぎの かげは だれかな？'), 300);
  };
  LEAVE.shadow = () => { timers.forEach(clearTimeout); timers = []; busy = false; };
  ACTIONS.shadowStart = () => { sfx.tap(); start(); };
  ACTIONS.shadowSay = () => sayJa('この かげは だれかな？');
  ACTIONS.shadowPick = (d, el) => {
    const G = S.shadow, r = G?.rounds[G.i];
    if (!r || r.done || busy) return;
    const x = r.opts[Number(d.k)];
    r.tries++;
    if (x.e !== r.ans.e) {
      // まちがい：その えだけ ゆらして、もういちど
      sfx.tap(); el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope'); el.disabled = true;
      sayJa(r.tries >= 2 ? `おしい！ ${r.ans.n}は どれかな？` : 'おしい！ もういちど よく みてね');
      return;
    }
    // あたり：かげに 色が ついて うごきだす
    busy = true; r.done = true; G.found.push(r.ans.e);
    const p = activeProfile(); p.shadowFound = (p.shadowFound || 0) + 1; save();
    sfx.correct();
    el.classList.add('yes');
    document.querySelectorAll('.sh-opt').forEach(b => { b.disabled = true; });
    const big = document.getElementById('shBig'); big.classList.add('lit', r.ans.m);
    sayJa(`${CHEER[R(0, CHEER.length - 1)]} ${r.ans.n}！`);
    later(() => { G.i++; busy = false; render(); }, 2600);
  };
  return { start };
}
