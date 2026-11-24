// 🌈 やさしい モード：もじが よめなくても あそべる（こえで きいて、えを タッチ）
// level 1：3つから えらぶ・かずは 1〜5 ／ level 2：4つから えらぶ・かずは 3〜9
// 絵は かげ あて と おなじ 絵（cards/shadow/<id>.png）。かたちは その場で かく（絵文字は つかわない）
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const NUM = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう', 'じゅう'];
const img = (id, cls = '', style = '') => `<img class="ez-img ${cls}" src="cards/shadow/${id}.png" alt="" draggable="false"${style ? ` style="${style}"` : ''}>`;

const CATS = {
  くだもの: ['apple', 'banana', 'grapes', 'strawberry', 'pear', 'pineapple', 'cherries', 'watermelon'],
  どうぶつ: ['dog', 'cat', 'rabbit', 'bear', 'panda', 'lion', 'elephant', 'monkey'],
  のりもの: ['car', 'bus', 'firetruck', 'police', 'ambulance', 'bicycle', 'train', 'airplane'],
  おやさい: ['carrot', 'broccoli', 'corn', 'eggplant', 'mushroom'],
};
const COLORS = {
  あかい: ['apple', 'strawberry', 'firetruck', 'cherries', 'ladybug', 'crab'],
  きいろい: ['banana', 'sunflower', 'chick', 'star', 'corn', 'taxi'],
  みどりの: ['broccoli', 'frog', 'crocodile', 'caterpillar', 'cactus', 'lizard'],
  あおい: ['whale', 'dolphin', 'bird', 'shark'],
};
// かたち（SVG で かく）
const SHAPE_SVG = {
  まる: '<circle cx="50" cy="50" r="40" fill="#ff5a5f"/>',
  さんかく: '<polygon points="50,10 92,88 8,88" fill="#3b8bff"/>',
  しかく: '<rect x="14" y="14" width="72" height="72" rx="6" fill="#2fbf71"/>',
  ほし: '<polygon points="50,6 61,38 95,38 67,58 78,92 50,72 22,92 33,58 5,38 39,38" fill="#ffc21a"/>',
  ハート: '<path d="M50 88 C10 60 4 38 18 24 C30 12 46 18 50 32 C54 18 70 12 82 24 C96 38 90 60 50 88 Z" fill="#ff6fa8"/>',
};
const shapeHTML = n => `<svg class="ez-shape" viewBox="0 0 100 100" aria-hidden="true">${SHAPE_SVG[n]}</svg>`;
const BIG = ['elephant', 'dog', 'apple', 'car', 'bear', 'tree', 'fish', 'sunflower'];
const PRAISE = ['すごい！', 'やったね！', 'せいかい！', 'よく みてたね！', 'さすが！'];
export const praise = () => pick(PRAISE);
export const EASY_NAMES = { count: 'いくつ ある？', same: 'おなじ え', odd: 'なかまはずれ', color: 'いろ', shape: 'かたち', size: 'おおきい・ちいさい', next: 'つぎは どれ？' };

// こたえ（1つ）と ほか（n-1つ）を まぜて もんだいに する。opt：えらぶ ボタンの なかみ（ふつうは 絵）
function Q(kind, level, { show, say, explain, right, wrongs, opt = x => img(x) }) {
  const opts = shuffle([right, ...wrongs]);
  return {
    type: 'math', math: true, easy: true, mtype: 'ez-' + kind, wid: null, mlevel: level,
    prompt: { html: show ? `<div class="ez-show">${show}</div>` : '', listen: true },
    options: opts.map((_, k) => 'txt:' + k), easyOpts: opts.map(opt),
    answer: 'txt:' + opts.indexOf(right),
    say: [{ t: say, l: 'ja' }], explain: [{ t: explain, l: 'ja' }],
  };
}

const GEN = {
  // いくつ ある？
  count(level) {
    const [a, b] = level <= 1 ? [1, 5] : [3, 9];
    const n = R(a, b), item = pick([...CATS.くだもの, ...CATS.どうぶつ]);
    const wrongs = shuffle([n - 2, n - 1, n + 1, n + 2].filter(x => x >= 1 && x <= 10)).slice(0, level <= 1 ? 2 : 3);
    const dots = k => `<b class="ez-num">${k}</b><span class="ez-dots">${'●'.repeat(k)}</span>`;
    return Q('count', level, {
      show: `<span class="ez-many">${Array.from({ length: n }, () => img(item, 'ez-small')).join('')}</span>`, say: 'いくつ あるかな？ かぞえてみよう。',
      explain: `${n}こ だよ。${NUM.slice(1, n + 1).join('、')}。`, right: n, wrongs, opt: dots,
    });
  },
  // おなじ えは どれ？
  same(level) {
    const cat = pick(Object.values(CATS)), [t, ...rest] = shuffle(cat);
    return Q('same', level, { show: img(t, 'ez-one'), say: 'これと おなじ えは どれかな？', explain: 'おなじ えは これだよ。', right: t, wrongs: rest.slice(0, level <= 1 ? 2 : 3) });
  },
  // なかまはずれ
  odd(level) {
    const names = shuffle(Object.keys(CATS)), [main, other] = names;
    const many = shuffle(CATS[main]).slice(0, level <= 1 ? 2 : 3), one = pick(CATS[other]);
    return Q('odd', level, { say: 'ひとつだけ なかまじゃ ないのは どれかな？', explain: `これだけ ${other} だね。ほかは ${main} だよ。`, right: one, wrongs: many });
  },
  // いろ
  color(level) {
    const names = shuffle(Object.keys(COLORS)), want = names[0];
    const right = pick(COLORS[want]);
    const wrongs = names.slice(1, level <= 1 ? 3 : 4).map(c => pick(COLORS[c].filter(x => !COLORS[want].includes(x))));
    return Q('color', level, { say: `${want} ものは どれかな？`, explain: `${want} のは これだよ。`, right, wrongs });
  },
  // かたち
  shape(level) {
    const names = shuffle(Object.keys(SHAPE_SVG)), want = names[0];
    return Q('shape', level, { say: `${want}は どれかな？`, explain: `${want}は これだよ。`, right: want, wrongs: names.slice(1, level <= 1 ? 3 : 4), opt: shapeHTML });
  },
  // おおきい・ちいさい
  size(level) {
    const item = pick(BIG), big = Math.random() < 0.5, n = level <= 1 ? 3 : 4;
    const sizes = (n === 3 ? [1.6, 3.6, 6] : [1.4, 2.9, 4.4, 6]).slice(0, n), right = big ? sizes[n - 1] : sizes[0];
    return Q('size', level, {
      say: big ? 'いちばん おおきいのは どれかな？' : 'いちばん ちいさいのは どれかな？',
      explain: big ? 'いちばん おおきいのは これだよ。' : 'いちばん ちいさいのは これだよ。',
      right, wrongs: sizes.filter(s => s !== right), opt: s => img(item, 'ez-sized', `width:${s}rem;height:${s}rem`),
    });
  },
  // つぎは どれ？（りんご・バナナ・りんご・バナナ…）
  next(level) {
    // ちがう なかまから 1つずつ（りんご と くるま みたいに、ひとめで ちがう ものに する）
    const [a, b, c, d] = shuffle(Object.keys(CATS)).map(k => pick(CATS[k]));
    const unit = level <= 1 ? [a, b] : pick([[a, b], [a, a, b], [a, b, c]]);
    const len = unit.length * 2 + 1, row = Array.from({ length: len }, (_, i) => unit[i % unit.length]);
    const right = unit[len % unit.length];
    const wrongs = [...new Set([...unit, d, c].filter(x => x && x !== right))].slice(0, level <= 1 ? 2 : 3);
    return Q('next', level, { show: `<span class="ez-row">${row.map(x => img(x, 'ez-small')).join('')}<span class="ez-q">？</span></span>`, say: 'じゅんばんに ならんでるよ。つぎに くるのは どれかな？', explain: 'つぎは これだよ。', right, wrongs });
  },
};

export function buildEasySession(level = 1, n = 8) {
  const kinds = Object.keys(GEN), qs = [];
  let bag = [];
  while (qs.length < n) {
    if (!bag.length) bag = shuffle(kinds);
    const k = bag.pop();
    if (qs.length && qs[qs.length - 1].mtype === 'ez-' + k) continue;
    qs.push(GEN[k](level));
  }
  return qs;
}
