// ダイナソークエスト：画面と 操作
// クイズ・おばけ（ふくしゅう）・りょうがえ・時間の きまりは キャッスルクエストと 共通。おさいふは 別
import {
  DINOS, DINO_BY_ID, NORMAL_DINOS, FOODS, FOOD_PRICE_YEN, HOME_PARTS_PER_DINO, HOME_PART_PRICE, HOME_STAGES,
  ACCESSORIES, MAX_GROWTH, stageOf,
} from './dinos.js';
import { CURRENCIES } from './castles.js';

// 3Dが できている 恐竜（ほかは「じゅんびちゅう」）
const READY = new Set(['trex']);
// その恐竜の 国の おかね（すみかを 買うときに つかう）
const DINO_CUR = { iguanodon: 'euro', fukuiraptor: 'yen' };
const curOf = id => DINO_CUR[id] || 'dollar';
// 図鑑の 絵（できているものだけ）
const ART = { trex: 'cards/dino-trex.jpg' };
const BABY_ART = { trex: 'cards/dino-trex-baby.jpg' };
const ICON = { trex: '🦖', triceratops: '🦏', stegosaurus: '🦕', brachiosaurus: '🦕', velociraptor: '🦖', spinosaurus: '🐊', ankylosaurus: '🐢', iguanodon: '🦕', parasaurolophus: '🦆', pteranodon: '🦅', fukuiraptor: '🦖' };
// フクイラプトル（超レア）：おばけを 20ぴき ともだちに すると たまごが あらわれる
const RARE_GHOSTS = 20;

export function installDino(api) {
  const { S, SCREENS, ACTIONS, AFTER, BG, LEAVE, go, render, db, save, activeProfile, esc, fmt, toast, sfx, say, sayJa, sayEn, stopSpeech, header, dueIds, startQuiz, rate, money, wallet, exchange, today } = api;

  Object.assign(BG, { dhome: 'dino', deggs: 'dino', hatch: 'dino', dshop: 'dino', dzukan: 'dino', dcare: 'dino' });
  S.shopTab = 'food';

  const D = () => activeProfile().dino;
  const mine = (p = activeProfile()) => p.dino.owned[p.dino.active];
  const rareOpen = p => (p.ghostsGraduated || 0) >= RARE_GHOSTS;
  const gateOn = p => dueIds(p).length >= db().settings.reviewGate;
  const gateHTML = p => `<p class="cp-msg warn">👻 おばけが ${dueIds(p).length}ひき たまってるよ！ ふくしゅうして おばけを たいじしたら また かえるよ</p>
    <button class="btn primary" data-act="startQuiz" data-mode="review">👻 ふくしゅうする</button>`;
  const growBar = g => `<div class="d-grow"><i style="width:${(g / MAX_GROWTH) * 100}%"></i>${[25, 55, 85].map(x => `<b style="left:${x}%"></b>`).join('')}</div>`;

  // ---------- ホーム ----------
  SCREENS.dhome = () => {
    const p = activeProfile(), d = p.dino;
    if (!d.active) return SCREENS.deggs();
    const m = mine(p), info = DINO_BY_ID[d.active];
    const due = dueIds(p).length;
    return `
    ${header(p, { back: 'games' })}
    <div class="page">
      <div class="home-grid dino-grid">
        <button class="big-btn quiz" data-act="startQuiz" data-mode="normal">
          <span class="bi">📝</span><span class="bt">もんだいに ちょうせん</span><span class="bs">こたえて おかねを ためよう</span>
        </button>
        <button class="big-btn review ${due ? 'alert' : ''}" data-act="startQuiz" data-mode="review">
          <span class="bi">👻</span><span class="bt">きょうの ふくしゅう</span><span class="bs">${due ? `おばけが ${due}ひき まってるよ！ おかね 2ばい` : 'いまは おばけ いないよ'}</span>
        </button>
        <button class="big-btn d-care" data-act="go" data-to="dcare">
          <span class="bi">${ICON[d.active]}</span><span class="bt">${info.name}の おせわ</span><span class="bs">${stageOf(m.growth).name}・${hungry(m) ? '🍖 おなか ぺこぺこ' : '😊 げんき'}</span>
        </button>
        <button class="big-btn d-shop" data-act="go" data-to="dshop">
          <span class="bi">🛒</span><span class="bt">おみせ</span><span class="bs">えさ・すみか・かざり</span>
        </button>
        <button class="big-btn exchange" data-act="go" data-to="exchange">
          <span class="bi">💱</span><span class="bt">りょうがえじょ</span><span class="bs">💴 ${fmt(d.wallet.yen)}えん</span>
        </button>
        <button class="big-btn ghosts" data-act="go" data-to="dzukan">
          <span class="bi">📕</span><span class="bt">きょうりゅう ずかん</span><span class="bs">あえた なかま ${d.order.length}</span>
        </button>
        ${d.eggs > 0 ? `<button class="big-btn d-egg" data-act="go" data-to="deggs"><span class="bi">🥚</span><span class="bt">たまごが あるよ！</span><span class="bs">あたらしい なかまを えらぼう</span></button>` : ''}
      </div>
    </div>`;
  };
  const hungry = m => m.fedOn !== today();

  // ---------- たまごを えらぶ ----------
  SCREENS.deggs = () => {
    const p = activeProfile(), d = p.dino;
    const list = [...NORMAL_DINOS, ...(rareOpen(p) ? [DINO_BY_ID.fukuiraptor] : [])];
    return `
    ${d.order.length ? header(p) : header(p, { back: 'games' })}
    <div class="page">
      <h2>🥚 どの たまごに する？</h2>
      <p class="sub">${d.eggs > 0 ? 'たまごを えらんで、あたためよう！ おおきく そだてると、つぎの たまごが もらえるよ' : 'いまは たまごが ないよ。いまの なかまを おとなに すると もらえるよ'}</p>
      <div class="col-grid egg-grid">
        ${list.map(x => {
          const have = !!d.owned[x.id], ready = READY.has(x.id);
          const art = ART[x.id];
          return `<button class="col-card egg-card ${have ? 'got' : ''} ${ready ? '' : 'wip'} ${x.rare ? 'rare' : ''}" data-act="pickEgg" data-id="${x.id}" ${have || !ready || d.eggs <= 0 ? 'disabled' : ''}>
            ${art ? `<img class="egg-art" src="${art}" alt="">` : `<span class="egg-icon">🥚</span>`}
            <div class="col-flag">${x.flag}</div>
            <div class="col-name">${x.name}</div>
            <div class="col-sub">${have ? '✨ なかま' : ready ? `${x.country}` : '🔧 じゅんびちゅう'}</div>
          </button>`;
        }).join('')}
        ${rareOpen(p) ? '' : `<div class="col-card rare locked"><div class="col-flag">❓</div><div class="col-name">？？？</div><div class="col-sub">✨ ちょうげきレア ✨<br>おばけを ${RARE_GHOSTS}ぴき ともだちに すると…（いま ${p.ghostsGraduated || 0}ぴき）</div></div>`}
      </div>
    </div>`;
  };

  // ---------- ふ化 ----------
  SCREENS.hatch = () => {
    const x = DINO_BY_ID[S.hatchId];
    return `
    <div class="page narrow center-text hatch-page">
      <h2>${x.name}の たまご</h2>
      <p class="sub" id="hatchMsg">たまごを タップして あたためよう！</p>
      <button class="egg-big crack${S.hatchTaps || 0}" data-act="tapEgg" aria-label="たまご"><span class="egg-shell"></span><span class="egg-crack"></span></button>
    </div>`;
  };

  // ---------- おせわ（3D） ----------
  SCREENS.dcare = () => {
    const p = activeProfile(), d = p.dino;
    if (!d.active) return SCREENS.deggs();
    return `
    ${header(p)}
    <div class="castle-page dino-page">
      <div id="dstage" class="stage"><div class="stage-loading">🦖 じゅんびちゅう…</div></div>
      ${d.order.length > 1 ? `<div class="d-switch">${d.order.map(id => `<button class="pill ${id === d.active ? 'on' : ''}" data-act="switchDino" data-id="${id}">${ICON[id]} ${DINO_BY_ID[id].name}</button>`).join('')}</div>` : ''}
      <div class="castle-panel d-panel" id="dpanel">${panelHTML(p)}</div>
    </div>`;
  };
  function panelHTML(p) {
    const d = p.dino, m = mine(p), info = DINO_BY_ID[d.active], st = stageOf(m.growth);
    const foods = [info.food, 'feast'];
    const ownedAcc = ACCESSORIES.filter(a => d.accessories.includes(a.id));
    return `
      <div class="cp-title">${info.flag} <b>${info.name}</b> <small>${info.en}</small> <span class="d-stage">${st.name}</span></div>
      ${growBar(m.growth)}
      <div class="bb-count">🌱 そだち ${Math.round(m.growth)} / ${MAX_GROWTH}　${hungry(m) ? '🍖 おなか ぺこぺこ' : m.fedToday >= 3 ? '😋 まんぷく！' : '😊 げんき'}</div>
      <div class="d-row">
        ${foods.map(k => { const f = FOODS[k], n = d.pantry[k] || 0; return `<button class="btn d-food ${n ? 'primary' : ''}" data-act="feedDino" data-k="${k}">${f.icon} ${f.name} <span class="d-n">×${n}</span></button>`; }).join('')}
      </div>
      <div class="d-row">
        <button class="btn" data-act="petDino">🖐 なでる</button>
        <button class="btn" data-act="walkDino">🚶 さんぽ</button>
        <button class="btn" data-act="roarDino">🦖 ほえる</button>
        <button class="btn" data-act="go" data-to="dshop">🛒 おみせ</button>
      </div>
      ${ownedAcc.length ? `<div class="d-row d-acc">${ownedAcc.map(a => `<button class="pill ${m.wearing.includes(a.id) ? 'on' : ''}" data-act="wear" data-id="${a.id}">${a.icon} ${a.name}</button>`).join('')}</div>` : ''}`;
  }
  const refreshPanel = () => { const el = document.getElementById('dpanel'); if (el) el.innerHTML = panelHTML(activeProfile()); const chip = document.querySelector('#yenChip b'); if (chip) chip.textContent = fmt(wallet(activeProfile()).yen); };

  // ---------- おみせ ----------
  SCREENS.dshop = () => {
    const p = activeProfile(), d = p.dino, m = mine(p), info = DINO_BY_ID[d.active];
    const tabs = [['food', '🍖 えさ'], ['home', '🏡 すみか'], ['acc', '🎀 かざり']];
    let body = '';
    if (gateOn(p)) body = gateHTML(p);
    else if (S.shopTab === 'food') {
      body = [info.food, 'feast'].map(k => {
        const f = FOODS[k], price = FOOD_PRICE_YEN * (f.priceMul || 1);
        return `<div class="shop-item">
          <span class="si-icon">${f.icon}</span>
          <div class="si-main"><b>${f.name}</b> <small>${f.en}</small><div class="si-sub">そだち +${f.grow}　もっている ×${d.pantry[k] || 0}</div></div>
          <div class="si-buy">
            <button class="btn primary" data-act="buyFood" data-k="${k}" data-n="1">${fmt(price)}えん</button>
            <button class="btn" data-act="buyFood" data-k="${k}" data-n="5">5こ ${fmt(price * 5)}えん</button>
          </div>
        </div>`;
      }).join('') + `<small class="hint">${info.name}は「${FOODS[info.food].name}」が だいすき！</small>`;
    } else if (S.shopTab === 'home') {
      const n = m.home || 0, cur = curOf(d.active), C = CURRENCIES[cur], price = HOME_PART_PRICE[cur], W = d.wallet;
      if (n >= HOME_PARTS_PER_DINO) body = '<p class="cp-msg">✨ すみかが かんせいしたよ！</p>';
      else {
        const stName = HOME_STAGES[Math.floor(n / 3)], step = (n % 3) + 1;
        const short = Math.max(0, price - W[cur]), yenNeed = short * rate(cur);
        body = `<div class="shop-item home-item">
          <span class="si-icon">🏡</span>
          <div class="si-main"><b>「${stName}」</b>（${step}/3）<div class="si-sub">すみか ${n} / ${HOME_PARTS_PER_DINO}　ねだん：<b>${money(cur, price)}</b></div>
            <div class="mini-bar"><i style="width:${(n / HOME_PARTS_PER_DINO) * 100}%"></i></div>
            <div class="si-sub">${C.sign} もっている ${C.name}：${money(cur, W[cur])}${cur !== 'yen' ? `　💴 ${fmt(W.yen)}えん` : ''}</div></div>
          <div class="si-buy">
            ${short === 0 ? `<button class="btn primary" data-act="buyHome">🔨 つくる</button>`
              : (cur !== 'yen' && W.yen >= yenNeed) ? `<button class="btn primary" data-act="buyHome" data-ex="1">💱 りょうがえして つくる<small>${fmt(yenNeed)}えん → ${money(cur, short)}</small></button>`
              : `<button class="btn" data-act="buyHome">🔨 つくる</button>`}
          </div>
        </div>
        ${cur !== 'yen' ? `<small class="hint">${info.name}の くに（${info.country}）の おかねで つくるよ。1${C.name} ＝ ${fmt(rate(cur))}えん（${C.en}）</small>` : ''}`;
      }
    } else {
      body = ACCESSORIES.map(a => {
        const have = d.accessories.includes(a.id);
        return `<div class="shop-item">
          <span class="si-icon">${a.icon}</span>
          <div class="si-main"><b>${a.name}</b> <small>${a.en}</small></div>
          <div class="si-buy">${have ? '<span class="tag">✨ もってる</span>' : `<button class="btn primary" data-act="buyAcc" data-id="${a.id}">${fmt(a.price)}えん</button>`}</div>
        </div>`;
      }).join('') + '<small class="hint">かざりは おせわの がめんで つけたり はずしたり できるよ</small>';
    }
    return `
    ${header(p)}
    <div class="page narrow">
      <h2>🛒 おみせ</h2>
      <div class="row center tabs">${tabs.map(([k, l]) => `<button class="pill ${S.shopTab === k ? 'on' : ''}" data-act="shopTab" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="wallet-line">💴 もっている おかね：<b>${fmt(d.wallet.yen)}えん</b></div>
      ${body}
    </div>`;
  };

  // ---------- ずかん ----------
  SCREENS.dzukan = () => {
    const p = activeProfile(), d = p.dino;
    const list = [...NORMAL_DINOS, ...(rareOpen(p) || d.owned.fukuiraptor ? [DINO_BY_ID.fukuiraptor] : [])];
    return `
    ${header(p)}
    <div class="page">
      <h2>📕 きょうりゅう ずかん</h2>
      <p class="sub">タップすると おはなしが きけるよ</p>
      <div class="col-grid">
        ${list.map(x => {
          const m = d.owned[x.id], art = ART[x.id];
          return `<button class="col-card ${m ? 'got' : ''}" data-act="dinoDesc" data-id="${x.id}">
            ${art ? `<img class="col-card-img ${m ? '' : 'shadow'}" src="${art}" alt="">` : ''}
            <div class="col-flag">${x.flag}</div>
            <div class="col-name">${x.name}</div>
            <div class="col-sub">${m ? `${stageOf(m.growth).name}（${Math.round(m.growth)}）` : 'まだ あえていないよ'}</div>
          </button>`;
        }).join('')}
      </div>
    </div>`;
  };
  function showDinoDesc(id, first = false) {
    const x = DINO_BY_ID[id], art = ART[id];
    const size = `${x.sizeNote || 'からだの ながさ'}：やく ${x.size}メートル`;
    const era = `いきていた じだい：やく ${fmtEra(x.era[0])}${x.era[1] !== x.era[0] ? `〜${fmtEra(x.era[1])}` : ''}まえ`;
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = `
      <div class="modal-card">
        ${first ? '<div class="stars">🎉 おとなに なった！ ずかんカードを ゲット！ 🎉</div>' : ''}
        ${art ? `<img class="card-art dino-card-art ${first ? 'reveal' : ''}" src="${art}" alt="">` : `<div class="egg-icon big">${ICON[id]}</div>`}
        <h2>${x.flag} ${x.name}</h2>
        <p class="d-facts">📏 ${size}　⏳ ${era}　🍽️ ${FOODS[x.food].name}</p>
        <p class="desc">${esc(x.desc)}</p>
        <p class="line">🔤 <b>${esc(x.line)}</b> <button class="icon-btn sm" data-act="sayLine">🔊</button></p>
        <div class="row center"><button class="btn" data-act="sayDesc">🔊 よみあげ</button><button class="btn primary" data-act="closeModal">とじる</button></div>
      </div>`;
    document.body.appendChild(m);
    m.addEventListener('click', e => {
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'closeModal' || e.target === m) { stopSpeech(); m.remove(); }
      if (a === 'sayLine') sayEn(x.line);
      if (a === 'sayDesc') say([{ t: x.say, l: 'ja' }, { t: x.line, l: 'en' }]);
    });
    say([{ t: x.say, l: 'ja' }, { t: x.line, l: 'en' }]);
  }
  const fmtEra = n => n >= 10000 ? `${Math.floor(n / 10000)}おく${n % 10000 ? `${n % 10000}まん` : ''}ねん` : `${n}まんねん`;

  // ---------- 3D の つけはずし ----------
  let view = null, viewP = null, viewDinoId = null;
  async function attachView() {
    const el = document.getElementById('dstage');
    if (!el) return;
    const p = activeProfile(), d = p.dino, m = mine(p);
    try {
      viewP ||= import('./dino/view.js');
      const mod = await viewP;
      if (!document.getElementById('dstage')) return;
      if (!view) {
        view = new mod.DinoView();
        window.__dinoView = view;   // 開発用（テストで 時間を すすめる）
        view.onTapDino = () => ACTIONS.petDino();
        view.onStageUp = st => { toast(`🎉 ${DINO_BY_ID[activeProfile().dino.active].name}が「${st.name}」に なった！`, 3000); setTimeout(() => sayEn(`I am ${st.en === 'adult' ? 'an' : 'a'} ${st.en} now!`), 600); };
      }
      if (viewDinoId !== d.active) { view.setDino(d.active, { growth: m.growth, accessories: m.wearing, name: DINO_BY_ID[d.active].name }); viewDinoId = d.active; }
      else { view.setGrowth(m.growth); view.setAccessories(m.wearing); }
      view.setHome(m.home || 0, S.homeAnim === (m.home || 0));
      if (!view.framed) { view.frame(); view.framed = true; }
      S.homeAnim = null;
      view.attach(el);
      el.querySelector('.stage-loading')?.remove();
      if (S.justHatched) { S.justHatched = false; setTimeout(() => view.hatchEffect(), 300); }
    } catch (e) {
      console.error(e);
      el.innerHTML = '<div class="stage-loading">3Dを よみこめませんでした。インターネットに つないで もういちど ひらいてね。</div>';
    }
  }
  AFTER.dcare = () => attachView();
  LEAVE.dcare = () => view?.detach();
  AFTER.hatch = () => sayJa('たまごをタップして、あたためよう！');

  // ---------- 操作 ----------
  Object.assign(ACTIONS, {
    pickEgg: d => {
      const p = activeProfile();
      if (p.dino.eggs <= 0) { toast('たまごが ないよ'); return; }
      sfx.tap(); S.hatchId = d.id; S.hatchTaps = 0; go('hatch');
    },
    tapEgg: () => {
      S.hatchTaps = (S.hatchTaps || 0) + 1;
      const egg = document.querySelector('.egg-big');
      sfx.tap();
      if (S.hatchTaps < 4) {
        egg.className = `egg-big crack${S.hatchTaps}`;
        document.getElementById('hatchMsg').textContent = ['', 'ぴくっ！ うごいた！', 'ひびが はいったよ！', 'もうすこし！'][S.hatchTaps];
        return;
      }
      // うまれた！
      const p = activeProfile(), dd = p.dino, id = S.hatchId;
      dd.owned[id] = { growth: 0, home: 0, wearing: [], hatched: today(), fedOn: '', fedToday: 0 };
      dd.order.push(id); dd.active = id; dd.eggs = Math.max(0, dd.eggs - 1);
      if (!dd.pantry[DINO_BY_ID[id].food]) dd.pantry[DINO_BY_ID[id].food] = 3;   // さいしょの えさを 3こ プレゼント
      save();
      sfx.fanfare();
      S.justHatched = true;
      go('dcare');
      sayJa(`うまれたよ！ ${DINO_BY_ID[id].name}のあかちゃんだ！ えさを3こ、プレゼントするね。`);
      setTimeout(() => sayEn(`Hello! I am a baby ${DINO_BY_ID[id].en}!`), 3800);
    },
    switchDino: d => { const p = activeProfile(); p.dino.active = d.id; save(); render(); },
    feedDino: d => {
      const p = activeProfile(), dd = p.dino, m = mine(p), k = d.k;
      if (!view) return;
      if ((dd.pantry[k] || 0) <= 0) { sfx.wrong(); toast(`${FOODS[k].icon} ${FOODS[k].name}が ないよ。おみせで かおう！`); sayJa('おみせで買おう！'); return; }
      if (m.growth >= MAX_GROWTH && k !== 'feast') { /* おとなでも たべられる */ }
      dd.pantry[k]--;
      save(); refreshPanel();
      view.feed(k).then(ok => {
        if (!ok) { dd.pantry[k]++; save(); refreshPanel(); return; }
        const before = m.growth;
        m.growth = Math.min(MAX_GROWTH, m.growth + FOODS[k].grow);
        m.fedToday = m.fedOn === today() ? (m.fedToday || 0) + 1 : 1;
        m.fedOn = today();
        save();
        view.setGrowth(m.growth);
        refreshPanel();
        sayEn(k === 'feast' ? 'Wow! Delicious!' : 'Yummy!');
        if (before < MAX_GROWTH && m.growth >= MAX_GROWTH) {
          dd.eggs++; m.adultOn = today(); save();
          setTimeout(() => { sfx.fanfare(); view.celebrate(); showDinoDesc(dd.active, true); toast('🥚 あたらしい たまごを もらった！', 3500); }, 2200);
        }
      });
    },
    petDino: () => { if (view?.pet()) { sfx.tap(); setTimeout(() => sayEn('Thank you!'), 300); } },
    walkDino: () => { if (!view) return; const on = view.toggleWalk(); const b = document.querySelector('[data-act=walkDino]'); if (b) b.textContent = on ? '✋ とまる' : '🚶 さんぽ'; },
    roarDino: () => { view?.roar(); },
    wear: d => {
      const m = mine(); const i = m.wearing.indexOf(d.id);
      if (i >= 0) m.wearing.splice(i, 1); else m.wearing.push(d.id);
      save(); view?.setAccessories(m.wearing); refreshPanel(); sfx.tap();
    },
    shopTab: d => { S.shopTab = d.v; sfx.tap(); render(); },
    buyFood: d => {
      const p = activeProfile(), dd = p.dino, f = FOODS[d.k], n = Number(d.n), cost = FOOD_PRICE_YEN * (f.priceMul || 1) * n;
      if (gateOn(p)) { render(); return; }
      if (dd.wallet.yen < cost) { sfx.wrong(); toast(`おかねが たりないよ。あと ${fmt(cost - dd.wallet.yen)}えん！<br>もんだいに ちょうせんしよう 📝`); sayJa(`お金があと${cost - dd.wallet.yen}円必要だよ`); return; }
      dd.wallet.yen -= cost; dd.pantry[d.k] = (dd.pantry[d.k] || 0) + n; save();
      sfx.coin(); toast(`${f.icon} ${f.name}を ${n}こ かったよ！`); sayEn(`${n === 1 ? 'One' : 'Five'} ${f.en}${n > 1 && !f.en.endsWith('s') && f.en !== 'fish' ? 's' : ''}, please!`);
      render();
    },
    buyHome: d => {
      const p = activeProfile(), dd = p.dino, m = mine(p), cur = curOf(dd.active), price = HOME_PART_PRICE[cur];
      if (gateOn(p) || (m.home || 0) >= HOME_PARTS_PER_DINO) { render(); return; }
      if (d.ex && dd.wallet[cur] < price) {
        const short = price - dd.wallet[cur];
        if (!exchange(cur, short)) return;
        toast(`💱 ${fmt(short * rate(cur))}えん → ${money(cur, short)}に りょうがえ！`);
      }
      if (dd.wallet[cur] < price) {
        sfx.wrong();
        const lack = (price - dd.wallet[cur]) * rate(cur) - dd.wallet.yen;
        toast(`おかねが たりないよ。あと ${fmt(Math.max(lack, 0))}えん！<br>もんだいに ちょうせんしよう 📝`);
        return;
      }
      dd.wallet[cur] -= price;
      m.home = (m.home || 0) + 1;
      save(); sfx.build();
      const n = m.home, stName = HOME_STAGES[Math.floor((n - 1) / 3)], step = ((n - 1) % 3) + 1;
      toast(step === 3 ? `🎉「${stName}」が できた！` : `🔨「${stName}」を つくっているよ（${step}/3）`);
      sayJa(step === 3 ? `${stName.replace(/ /g, '')}が、できたよ！` : `${stName.replace(/ /g, '')}を、つくっているよ。`);
      S.homeAnim = n;
      go('dcare');
    },
    buyAcc: d => {
      const p = activeProfile(), dd = p.dino, a = ACCESSORIES.find(x => x.id === d.id);
      if (gateOn(p)) { render(); return; }
      if (dd.wallet.yen < a.price) { sfx.wrong(); toast(`おかねが たりないよ。あと ${fmt(a.price - dd.wallet.yen)}えん！`); return; }
      dd.wallet.yen -= a.price; dd.accessories.push(a.id);
      const m = mine(p); if (!m.wearing.includes(a.id)) m.wearing.push(a.id);
      save(); sfx.fanfare(); toast(`${a.icon} ${a.name}を かったよ！ つけてみよう`); sayEn(`A ${a.en}! So cute!`);
      go('dcare');
    },
    dinoDesc: d => { sfx.tap(); showDinoDesc(d.id); },
  });
}
