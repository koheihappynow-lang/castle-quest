// さんすうの もんだい（4〜8さい）
// 学習指導要領（2017年版）の 小1〜小3 と、ようちえんの「かず・かたち」を もとに 5だんかいに わけた
//  M1（4さい）：かぞえる・どっちが おおい・かたち・つぎの かず・とけい（なんじ）
//  M2（5さい）：20まで かぞえる・えで たしざん／ひきざん（10まで）・とけい（なんじはん）
//  M3（6さい／小1）：たしざん ひきざん（くりあがり・くりさがり 20まで）・100までの かず・とけい（5ふん）・おかね
//  M4（7さい／小2）：2けたの たしざん ひきざん・かけざん（九九）・とけい（1ぷん・なんぷんご）・ぶんすう（1/2 1/3 1/4）・ながさ／かさ
//  M5（8さい／小3）：わりざん（あまり なし／あり）・2けた×1けた・ぶんすうの たしざん ひきざん・じかんの けいさん・おもさ
// もんだいは その場で つくるので、なんかい あそんでも ちがう もんだいに なる

export const MATH_LEVELS = {
  1: { name: '🔢 4さい', sub: 'かぞえる・かたち・とけい（なんじ）' },
  2: { name: '🔢 5さい', sub: '10までの たしざん ひきざん・とけい（はん）' },
  3: { name: '🔢 6さい（1ねんせい）', sub: 'くりあがり・100までの かず・おかね' },
  4: { name: '🔢 7さい（2ねんせい）', sub: 'かけざん・2けたの けいさん・ぶんすう' },
  5: { name: '🔢 8さい（3ねんせい）', sub: 'わりざん・ぶんすうの けいさん・じかん' },
};
export const mathLevelForAge = age => Math.max(1, Math.min(5, age - 3));

const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- 英語の かず（こたえの あとに 英語で いう） ----------
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
export function numEn(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + numEn(n % 100) : '');
  return String(n);
}
const timeEn = (h, m) => m === 0 ? `${numEn(h)} o'clock` : m === 30 ? `half past ${numEn(h)}` : `${numEn(h)} ${m < 10 ? 'oh ' + numEn(m) : numEn(m)}`;

// ---------- 絵（SVG） ----------
const ITEMS = ['🍎', '🍓', '⭐', '🐶', '🐟', '🎈', '🚗', '🦖', '🍪', '🐥'];
function itemsHTML(n, emoji, cls = '') {
  return `<div class="m-items ${cls}">${Array.from({ length: n }, () => `<span>${emoji}</span>`).join('')}</div>`;
}
// 10を ひとまとまりにした ならべ方（11〜20 を かぞえやすく）
function tenFrameHTML(n, emoji) {
  const rows = [];
  for (let i = 0; i < n; i += 5) rows.push(`<div class="m-row">${Array.from({ length: Math.min(5, n - i) }, () => `<span>${emoji}</span>`).join('')}</div>`);
  const groups = [];
  for (let i = 0; i < rows.length; i += 2) groups.push(`<div class="m-ten">${rows.slice(i, i + 2).join('')}</div>`);
  return `<div class="m-tens">${groups.join('')}</div>`;
}
export function clockSVG(h, m, size = 200) {
  const hourA = ((h % 12) + m / 60) * 30, minA = m * 6;
  const hand = (a, len, w, col) => { const r = (a - 90) * Math.PI / 180; return `<line x1="100" y1="100" x2="${100 + Math.cos(r) * len}" y2="${100 + Math.sin(r) * len}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`; };
  let ticks = '', nums = '';
  for (let i = 0; i < 60; i++) { const r = (i * 6 - 90) * Math.PI / 180, big = i % 5 === 0; ticks += `<line x1="${100 + Math.cos(r) * (big ? 80 : 85)}" y1="${100 + Math.sin(r) * (big ? 80 : 85)}" x2="${100 + Math.cos(r) * 90}" y2="${100 + Math.sin(r) * 90}" stroke="#5b4a3a" stroke-width="${big ? 3 : 1.2}"/>`; }
  for (let i = 1; i <= 12; i++) { const r = (i * 30 - 90) * Math.PI / 180; nums += `<text x="${100 + Math.cos(r) * 66}" y="${100 + Math.sin(r) * 66 + 7}" text-anchor="middle" font-size="20" font-weight="800" fill="#3a2a1a">${i}</text>`; }
  return `<svg class="m-clock" viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="とけい">
    <circle cx="100" cy="100" r="96" fill="#ffd36a"/><circle cx="100" cy="100" r="90" fill="#fffaf0" stroke="#e0a526" stroke-width="4"/>
    ${ticks}${nums}${hand(hourA, 44, 9, '#d9343a')}${hand(minA, 70, 6, '#2f6fd8')}<circle cx="100" cy="100" r="7" fill="#3a2a1a"/></svg>`;
}
// ぶんすう：円を n こに わけて k こ ぬる
function fractionSVG(k, n, size = 170, col = '#ff8a3a') {
  let parts = '';
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
    const x0 = 100 + Math.cos(a0) * 88, y0 = 100 + Math.sin(a0) * 88, x1 = 100 + Math.cos(a1) * 88, y1 = 100 + Math.sin(a1) * 88;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    parts += n === 1 ? `<circle cx="100" cy="100" r="88" fill="${i < k ? col : '#fff'}" stroke="#5b4a3a" stroke-width="3"/>`
      : `<path d="M100 100 L${x0} ${y0} A88 88 0 ${large} 1 ${x1} ${y1} Z" fill="${i < k ? col : '#fff'}" stroke="#5b4a3a" stroke-width="3"/>`;
  }
  return `<svg class="m-frac" viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="ぶんすうの え">${parts}</svg>`;
}
function shapeSVG(kind, col) {
  const s = { circle: '<circle cx="60" cy="60" r="48"/>', triangle: '<polygon points="60,10 112,104 8,104"/>', square: '<rect x="14" y="14" width="92" height="92"/>', rect: '<rect x="4" y="30" width="112" height="60"/>', star: '<polygon points="60,6 74,44 114,44 82,68 94,108 60,84 26,108 38,68 6,44 46,44"/>', heart: '<path d="M60 104 C10 70 4 40 26 24 C42 12 56 22 60 34 C64 22 78 12 94 24 C116 40 110 70 60 104 Z"/>' }[kind];
  return `<svg class="m-shape" viewBox="0 0 120 120" width="150" height="150" role="img" aria-label="かたち"><g fill="${col}" stroke="#3a2a1a" stroke-width="4" stroke-linejoin="round">${s}</g></svg>`;
}
const COINS = { 1: ['#d8dde3', '#9aa3ad', ''], 5: ['#e8c25a', '#b8902a', 'hole'], 10: ['#c98a5a', '#8a5a34', ''], 50: ['#e3e6ea', '#9aa3ad', 'hole'], 100: ['#e3e6ea', '#8a939d', ''], 500: ['#f0d27a', '#b8962e', ''] };
function coinSVG(v) {
  const [f, s, hole] = COINS[v], r = { 1: 20, 5: 22, 10: 23, 50: 21, 100: 23, 500: 26 }[v];
  return `<svg class="m-coin" viewBox="0 0 60 60" width="${r * 2.4}" height="${r * 2.4}" role="img" aria-label="${v}えん"><circle cx="30" cy="30" r="${r}" fill="${f}" stroke="${s}" stroke-width="3"/>${hole ? `<circle cx="30" cy="30" r="5" fill="#fff" stroke="${s}" stroke-width="2"/>` : ''}<text x="30" y="${hole ? 23 : 36}" text-anchor="middle" font-size="${v >= 100 ? 13 : 15}" font-weight="900" fill="#3a2a1a">${v}</text></svg>`;
}

// ---------- 選択肢 ----------
// こたえ ＋ まちがいやすい ちかい かず で 4つ
function numOptions(ans, { min = 0, max = 999, near = [1, 2, 10, -1, -2, -10], extra = [] } = {}) {
  const set = new Set([ans]);
  for (const e of shuffle([...extra])) if (set.size < 4 && e !== ans && e >= min && e <= max) set.add(e);
  for (const d of shuffle([...near])) if (set.size < 4 && ans + d >= min && ans + d <= max) set.add(ans + d);
  let g = 0; while (set.size < 4 && g++ < 50) { const v = ans + R(-5, 5); if (v >= min && v <= max) set.add(v); }
  return shuffle([...set]).map(v => `txt:${v}`);
}
function textOptions(ans, others) {
  const set = new Set([ans]);
  for (const o of shuffle([...others])) if (set.size < 4 && o !== ans) set.add(o);
  return shuffle([...set]).map(v => `txt:${v}`);
}
function Q(mtype, { html, text, ja, options, answer, after, explain }) {
  return { type: 'math', math: true, mtype, wid: null, prompt: { html, text }, options, answer: `txt:${answer}`, say: [{ t: ja || text, l: 'ja' }], after, explain };
}

// ---------- もんだいの つくりかた ----------
const GEN = {
  // かぞえる（絵）
  count: (max = 10) => {
    const n = R(max > 10 ? 8 : 1, max), e = pick(ITEMS);
    return Q('count', { html: n > 10 ? tenFrameHTML(n, e) : itemsHTML(n, e), text: `${e} は いくつ？`, ja: 'いくつ あるかな？', options: numOptions(n, { min: 1, max: 20, near: [1, -1, 2, -2] }), answer: n, after: `${numEn(n)}!`, explain: `${n}こ` });
  },
  // どっちが おおい
  compare: () => {
    let a = R(1, 9), b = R(1, 9); while (a === b) b = R(1, 9);
    const e1 = pick(ITEMS), e2 = pick(ITEMS.filter(x => x !== e1));
    const ans = a > b ? 'うえ' : 'した';
    return Q('compare', { html: `<div class="m-cmp"><div class="m-cmp-row"><b>うえ</b>${itemsHTML(a, e1, 'sm')}</div><div class="m-cmp-row"><b>した</b>${itemsHTML(b, e2, 'sm')}</div></div>`, text: 'おおいのは どっち？', options: textOptions(ans, ['うえ', 'した', 'おなじ']).slice(0, 3), answer: ans, after: `${numEn(Math.max(a, b))} is more than ${numEn(Math.min(a, b))}.`, explain: `うえは ${a}こ、したは ${b}こ` });
  },
  // かたち
  shape: () => {
    const S = [['circle', 'まる', 'circle'], ['triangle', 'さんかく', 'triangle'], ['square', 'しかく', 'square'], ['star', 'ほし', 'star'], ['heart', 'ハート', 'heart']];
    const [k, ja, en] = pick(S);
    return Q('shape', { html: shapeSVG(k, pick(['#ff8a3a', '#4da3ff', '#3ddc84', '#ff5d8f', '#ffd23f'])), text: 'この かたちは なに？', options: textOptions(ja, S.map(x => x[1])), answer: ja, after: `It's a ${en}.`, explain: ja });
  },
  // つぎの かず／まえの かず
  next: (max = 10) => {
    const before = max > 20 && Math.random() < 0.4, n = R(1, max - 1);
    const ans = before ? n - 1 : n + 1;
    if (ans < 0) return GEN.next(max);
    return Q('next', { html: `<div class="m-big">${before ? `？ ・ ${n}` : `${n} ・ ？`}</div>`, text: before ? `${n} の まえの かずは？` : `${n} の つぎの かずは？`, options: numOptions(ans, { min: 0, max: max + 1, near: [1, -1, 2, -2] }), answer: ans, after: `${numEn(ans)}!`, explain: `${before ? ans + ' → ' + n : n + ' → ' + ans}` });
  },
  // えで たしざん
  addPic: (max = 10) => {
    const a = R(1, max - 1), b = R(1, max - a), e = pick(ITEMS);
    return Q('addPic', { html: `<div class="m-eq">${itemsHTML(a, e, 'sm')}<span class="m-op">＋</span>${itemsHTML(b, e, 'sm')}</div>`, text: 'あわせて いくつ？', options: numOptions(a + b, { min: 1, max: 20, near: [1, -1, 2] }), answer: a + b, after: `${numEn(a)} plus ${numEn(b)} is ${numEn(a + b)}.`, explain: `${a} ＋ ${b} ＝ ${a + b}` });
  },
  // えで ひきざん（たべると のこりは？）
  subPic: (max = 10) => {
    const a = R(2, max), b = R(1, a - 1), e = pick(['🍎', '🍓', '🍪', '🍩', '🍬']);
    const icons = Array.from({ length: a }, (_, i) => `<span class="${i >= a - b ? 'gone' : ''}">${e}</span>`).join('');
    return Q('subPic', { html: `<div class="m-items">${icons}</div>`, text: `${e} が ${a}こ。${b}こ たべると のこりは？`, options: numOptions(a - b, { min: 0, max: 20, near: [1, -1, 2] }), answer: a - b, after: `${numEn(a)} minus ${numEn(b)} is ${numEn(a - b)}.`, explain: `${a} − ${b} ＝ ${a - b}` });
  },
  // しきの たしざん
  add: (lo, hi, carry = null) => {
    let a, b, g = 0;
    do { a = R(lo, hi); b = R(lo, hi); g++; } while (g < 100 && carry !== null && ((a % 10) + (b % 10) >= 10) !== carry);
    return Q('add', { html: `<div class="m-big">${a} ＋ ${b} ＝ ？</div>`, text: 'けいさん しよう', ja: `${a}たす${b}は？`, options: numOptions(a + b, { min: 0, max: 999, extra: [a + b + 10, a + b - 10, Math.abs(a - b)] }), answer: a + b, after: `${numEn(a)} plus ${numEn(b)} is ${numEn(a + b)}.`, explain: `${a} ＋ ${b} ＝ ${a + b}` });
  },
  sub: (lo, hi, borrow = null) => {
    let a, b, g = 0;
    do { a = R(lo, hi); b = R(lo, hi); if (b > a) [a, b] = [b, a]; g++; } while (g < 100 && (a === b || (borrow !== null && ((a % 10) < (b % 10)) !== borrow)));
    return Q('sub', { html: `<div class="m-big">${a} − ${b} ＝ ？</div>`, text: 'けいさん しよう', ja: `${a}ひく${b}は？`, options: numOptions(a - b, { min: 0, max: 999, extra: [a + b, a - b + 10, a - b - 10] }), answer: a - b, after: `${numEn(a)} minus ${numEn(b)} is ${numEn(a - b)}.`, explain: `${a} − ${b} ＝ ${a - b}` });
  },
  // なんじゅう ＋ なん
  tens: () => {
    const t = R(1, 9) * 10, o = R(1, 9);
    return Q('tens', { html: `<div class="m-big">${t} ＋ ${o} ＝ ？</div>`, text: 'けいさん しよう', ja: `${t}たす${o}は？`, options: numOptions(t + o, { extra: [t * 10 + o, o * 10 + t / 10, t + o + 10] }), answer: t + o, after: `${numEn(t)} plus ${numEn(o)} is ${numEn(t + o)}.`, explain: `${t} ＋ ${o} ＝ ${t + o}` });
  },
  // 100までの かずの ならび
  seq: () => {
    const step = pick([1, 2, 5, 10]), start = step === 10 ? R(0, 5) * 10 : R(1, 80);
    const arr = [0, 1, 2, 3].map(i => start + i * step), hole = R(1, 3), ans = arr[hole];
    return Q('seq', { html: `<div class="m-big">${arr.map((v, i) => i === hole ? '？' : v).join(' ・ ')}</div>`, text: '？に はいる かずは？', options: numOptions(ans, { near: [step, -step, 1, -1] }), answer: ans, after: `${numEn(ans)}!`, explain: `${step}ずつ ふえているよ` });
  },
  // とけい
  clock: (mode) => {
    const h = R(1, 12);
    const m = mode === 'hour' ? 0 : mode === 'half' ? pick([0, 30]) : mode === 'five' ? R(0, 11) * 5 : R(0, 59);
    const label = (hh, mm) => mm === 0 ? `${hh}じ` : (mode === 'half' && mm === 30) ? `${hh}じはん` : `${hh}じ${mm}ふん`;
    const ans = label(h, m);
    const wrongs = new Set();
    const hp = h === 12 ? 1 : h + 1, hm = h === 1 ? 12 : h - 1;
    wrongs.add(label(hp, m)); wrongs.add(label(hm, m));
    if (mode === 'hour') { wrongs.add(label(R(1, 12), 0)); wrongs.add(label(m === 0 ? (h + 5) % 12 + 1 : h, 0)); }
    else if (mode === 'half') wrongs.add(label(h, m === 0 ? 30 : 0));
    else { wrongs.add(label(h, (m + 30) % 60)); wrongs.add(label(Math.round(m / 5) % 12 || 12, (h * 5) % 60)); wrongs.add(label(h, (m + (mode === 'five' ? 5 : 1)) % 60)); }
    wrongs.delete(ans);
    return Q('clock', { html: clockSVG(h, m), text: 'なんじ かな？', ja: 'とけいは なんじ かな？', options: textOptions(ans, [...wrongs]), answer: ans, after: `It's ${timeEn(h, m)}.`, explain: `みじかい はり（あか）が じ、ながい はり（あお）が ふんを さすよ → ${ans}` });
  },
  // なんぷんご
  later: () => {
    const h = R(1, 11), m = R(0, 10) * 5, add = pick([10, 15, 20, 30, 40]);
    let mm = m + add, hh = h; if (mm >= 60) { mm -= 60; hh += 1; }
    const fmt = (a, b) => b === 0 ? `${a}じ` : `${a}じ${b}ふん`;
    const ans = fmt(hh, mm);
    return Q('later', { html: clockSVG(h, m), text: `この とけいの ${add}ぷんごは？`, ja: `${add}分後は 何時かな？`, options: textOptions(ans, [fmt(h, (m + add) % 60), fmt(hh, (mm + 10) % 60), fmt(hh + 1 > 12 ? 1 : hh + 1, mm), fmt(hh, Math.max(0, mm - 5))]), answer: ans, after: `It's ${timeEn(hh, mm)}.`, explain: `${fmt(h, m)} から ${add}ぷん たつと ${ans}` });
  },
  // おかね
  money: (coins) => {
    const n = R(2, 4), list = Array.from({ length: n }, () => pick(coins)).sort((a, b) => b - a), sum = list.reduce((s, v) => s + v, 0);
    return Q('money', { html: `<div class="m-coins">${list.map(coinSVG).join('')}</div>`, text: 'ぜんぶで なんえん？', ja: 'ぜんぶで なんえん かな？', options: numOptions(sum, { near: [1, 5, 10, -5, -10, 50], extra: [sum + 10, sum - 10, sum + 5] }).map(o => o + 'えん'), answer: sum + 'えん', after: `${numEn(sum)} yen.`, explain: list.join(' ＋ ') + ` ＝ ${sum}えん` });
  },
  // かけざん（九九）
  mul: (pic = false) => {
    const a = R(2, 9), b = R(1, 9), e = pick(ITEMS);
    const html = pic && a * b <= 30
      ? `<div class="m-groups">${Array.from({ length: a }, () => `<div class="m-grp">${Array.from({ length: b }, () => `<span>${e}</span>`).join('')}</div>`).join('')}</div><div class="m-big sm">${b} × ${a} ＝ ？</div>`
      : `<div class="m-big">${a} × ${b} ＝ ？</div>`;
    const ans = a * b, [x, y] = pic && a * b <= 30 ? [b, a] : [a, b];
    return Q('mul', { html, text: pic && a * b <= 30 ? `${b}こずつ ${a}さら。ぜんぶで？` : 'かけざん しよう', ja: `${x}かける${y}は？`, options: numOptions(ans, { extra: [a * (b + 1), a * (b - 1), (a + 1) * b, a + b] }), answer: ans, after: `${numEn(x)} times ${numEn(y)} is ${numEn(ans)}.`, explain: `${x} × ${y} ＝ ${ans}` });
  },
  mul2: () => {
    const a = R(11, 40), b = R(2, 9), ans = a * b;
    return Q('mul2', { html: `<div class="m-big">${a} × ${b} ＝ ？</div>`, text: 'かけざん しよう', ja: `${a}かける${b}は？`, options: numOptions(ans, { extra: [ans + 10, ans - 10, ans + b, a * (b + 1)] }), answer: ans, after: `${numEn(a)} times ${numEn(b)} is ${numEn(ans)}.`, explain: `${a} × ${b} ＝ ${ans}` });
  },
  // わりざん
  div: (rem = false) => {
    const b = R(2, 9), q = R(1, 9), r = rem ? R(1, b - 1) : 0, a = b * q + r;
    const ans = rem ? `${q} あまり ${r}` : String(q);
    const opts = rem ? textOptions(ans, [`${q} あまり ${r + 1 < b ? r + 1 : r - 1}`, `${q + 1} あまり ${r}`, `${Math.max(1, q - 1)} あまり ${r + b < 10 ? r : r}`, `${q}`]) : numOptions(q, { min: 1, max: 81, extra: [q + 1, q - 1, b] });
    return Q('div', { html: `<div class="m-big">${a} ÷ ${b} ＝ ？</div>`, text: rem ? 'わりざん（あまりも こたえよう）' : 'わりざん しよう', ja: `${a}わる${b}は？`, options: opts, answer: ans, after: `${numEn(a)} divided by ${numEn(b)} is ${numEn(q)}${rem ? `, remainder ${numEn(r)}` : ''}.`, explain: rem ? `${b} × ${q} ＝ ${b * q}、のこり ${r}` : `${b} × ${q} ＝ ${a} だから ${q}` });
  },
  // ぶんすう（え）
  frac: (dens = [2, 3, 4]) => {
    const n = pick(dens), k = R(1, n - 1 || 1);
    const ans = `${k}/${n}`;
    const others = []; for (const d of [2, 3, 4, 5, 6, 8]) for (let j = 1; j < d; j++) others.push(`${j}/${d}`);
    return Q('frac', { html: fractionSVG(k, n), text: 'いろを ぬった ところは ぜんたいの どれだけ？', ja: '色をぬったところは、全体のどれだけかな？', options: textOptions(ans, [`${n - k || 1}/${n}`, `${k}/${n + 1}`, `${n}/${k}`.replace(/^(\d+)\/1$/, `1/${n}`), ...others.filter(o => o !== ans).slice(0, 6)]), answer: ans, after: n === 2 ? 'One half.' : `${numEn(k)} over ${numEn(n)}.`, explain: `${n}つに わけた ${k}こ ぶん ＝ ${n}ぶんの${k}` });
  },
  fracAdd: () => {
    const n = pick([3, 4, 5, 6, 7, 8]), sub = Math.random() < 0.4;
    let a = R(1, n - 1), b = R(1, n - 1);
    if (!sub) { while (a + b > n) b = R(1, n - a); } else { if (b > a) [a, b] = [b, a]; if (a === b) a = Math.min(n - 1, a + 1); }
    const k = sub ? a - b : a + b, ans = k === n ? '1' : `${k}/${n}`;
    return Q('fracAdd', { html: `<div class="m-big">${a}/${n} ${sub ? '−' : '＋'} ${b}/${n} ＝ ？</div>`, text: 'ぶんすうの けいさん', ja: `${n}ぶんの${a} ${sub ? 'ひく' : 'たす'} ${n}ぶんの${b}は？`, options: textOptions(ans, [`${k}/${n * 2}`, `${sub ? a + b : Math.abs(a - b)}/${n}`, `${k + 1}/${n}`, `${k}/${n + 1}`]), answer: ans, after: `The answer is ${ans === '1' ? 'one' : `${numEn(k)} over ${numEn(n)}`}.`, explain: `ぶんぼは そのまま、ぶんしだけ ${sub ? 'ひく' : 'たす'}よ` });
  },
  // たんい
  unit: (lv) => {
    const U = lv >= 5
      ? [['1kg は なん g？', '1000g', ['100g', '10g', '10000g']], ['1km は なん m？', '1000m', ['100m', '10m', '10000m']], ['1ふんは なんびょう？', '60びょう', ['100びょう', '10びょう', '30びょう']], ['1じかんは なんぷん？', '60ぷん', ['100ぷん', '30ぷん', '24ぷん']]]
      : [['1cm は なん mm？', '10mm', ['100mm', '1mm', '5mm']], ['1m は なん cm？', '100cm', ['10cm', '1000cm', '50cm']], ['1L は なん dL？', '10dL', ['100dL', '1dL', '5dL']], ['1じかんは なんぷん？', '60ぷん', ['100ぷん', '30ぷん', '24ぷん']], ['1にちは なんじかん？', '24じかん', ['12じかん', '60じかん', '10じかん']]];
    const [q, ans, wr] = pick(U);
    return Q('unit', { html: `<div class="m-big sm">${q}</div>`, text: 'たんいの もんだい', ja: q.replace('？', 'かな？'), options: textOptions(ans, wr), answer: ans, after: 'Great!', explain: q.replace('？', ` ${ans}`) });
  },
  // おはなしの もんだい（たしざん・ひきざん）
  story: (max = 10) => {
    const e = pick([['🐟', 'さかな', 'ひき'], ['🍓', 'いちご', 'こ'], ['🐥', 'ひよこ', 'わ'], ['🎈', 'ふうせん', 'こ']]);
    const add = Math.random() < 0.5;
    const a = R(2, max - 2), b = add ? R(1, max - a) : R(1, a - 1), ans = add ? a + b : a - b;
    const text = add ? `${e[1]}が ${a}${e[2]} いました。${b}${e[2]} きました。ぜんぶで なん${e[2]}？` : `${e[1]}が ${a}${e[2]} いました。${b}${e[2]} いなくなりました。のこりは なん${e[2]}？`;
    return Q('story', { html: `<div class="m-story">${e[0]}</div>`, text, options: numOptions(ans, { min: 0, max: max + 5, extra: [add ? a - b : a + b] }), answer: ans, after: `${numEn(a)} ${add ? 'plus' : 'minus'} ${numEn(b)} is ${numEn(ans)}.`, explain: `${a} ${add ? '＋' : '−'} ${b} ＝ ${ans}` });
  },
};

// レベルごとの もんだいの まぜかた（[作り方, おもさ]）
const PLAN = {
  1: [[() => GEN.count(10), 4], [() => GEN.compare(), 2], [() => GEN.shape(), 2], [() => GEN.next(10), 2], [() => GEN.clock('hour'), 2], [() => GEN.addPic(5), 1]],
  2: [[() => GEN.count(20), 2], [() => GEN.addPic(10), 3], [() => GEN.subPic(10), 3], [() => GEN.next(20), 1], [() => GEN.clock('half'), 2], [() => GEN.story(10), 2], [() => GEN.compare(), 1], [() => GEN.add(1, 5), 2]],
  3: [[() => GEN.add(1, 9), 2], [() => GEN.add(2, 9, true), 3], [() => GEN.sub(1, 10), 2], [() => GEN.sub(11, 18, true), 2], [() => GEN.tens(), 1], [() => GEN.seq(), 2], [() => GEN.clock('five'), 2], [() => GEN.money([1, 5, 10, 50, 100]), 2], [() => GEN.story(20), 2]],
  4: [[() => GEN.add(10, 99), 2], [() => GEN.sub(10, 99), 2], [() => GEN.mul(true), 2], [() => GEN.mul(false), 4], [() => GEN.clock('min'), 2], [() => GEN.later(), 1], [() => GEN.frac([2, 3, 4]), 2], [() => GEN.unit(4), 1], [() => GEN.money([10, 50, 100, 500]), 1]],
  5: [[() => GEN.div(false), 3], [() => GEN.div(true), 2], [() => GEN.mul2(), 2], [() => GEN.mul(false), 1], [() => GEN.fracAdd(), 2], [() => GEN.frac([2, 3, 4, 5, 6, 8]), 1], [() => GEN.later(), 2], [() => GEN.unit(5), 1], [() => GEN.add(100, 999), 1], [() => GEN.sub(100, 999), 1]],
};
function pickPlan(level) {
  const plan = PLAN[level] || PLAN[1], total = plan.reduce((s, x) => s + x[1], 0);
  let r = Math.random() * total;
  for (const [fn, w] of plan) { r -= w; if (r <= 0) return fn; }
  return plan[0][0];
}
export function makeMathQuestion(level) {
  for (let i = 0; i < 20; i++) {
    const q = pickPlan(level)();
    if (q.options.length >= 3 && q.options.includes(q.answer) && new Set(q.options).size === q.options.length) { q.mlevel = level; return q; }
  }
  return GEN.count(10);
}
// 1回の さんすう（10もん）。ときどき ひとつ うえの レベルを まぜる（ちょっと むずかしい）
export function buildMathSession(level, n = 10) {
  const qs = [];
  const seen = new Set();
  let g = 0;
  while (qs.length < n && g++ < 200) {
    const challenge = level < 5 && Math.random() < 0.12;
    const q = makeMathQuestion(challenge ? level + 1 : level);
    const key = q.mtype + '|' + q.prompt.html;
    if (seen.has(key)) continue;
    seen.add(key);
    if (challenge) q.challenge = true;
    qs.push(q);
  }
  return qs;
}
// まちがえたら、おなじ しゅるいの べつの もんだい
export function mathRetry(q) {
  if (q.retryFn) return q.retryFn();   // パズルなど
  for (let i = 0; i < 30; i++) { const r = makeMathQuestion(q.mlevel || 1); if (r.mtype === q.mtype) { r.retry = true; return r; } }
  const r = makeMathQuestion(q.mlevel || 1); r.retry = true; return r;
}
export const MATH_TYPE_NAMES = {
  count: 'かぞえよう', compare: 'どっちが おおい？', shape: 'かたち', next: 'かずの じゅんばん', addPic: 'たしざん', subPic: 'ひきざん',
  add: 'たしざん', sub: 'ひきざん', tens: 'たしざん', seq: 'かずの ならび', clock: 'とけい', later: 'じかん', money: 'おかね',
  mul: 'かけざん', mul2: 'かけざん', div: 'わりざん', frac: 'ぶんすう', fracAdd: 'ぶんすうの けいさん', unit: 'たんい', story: 'おはなし もんだい',
};
