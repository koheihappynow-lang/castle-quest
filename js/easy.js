// 🌈 やさしい モード：もじが よめなくても あそべる（こえで きいて、えを タッチ）
// level 1：3つから えらぶ・かずは 1〜5 ／ level 2：4つから えらぶ・かずは 3〜9
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const NUM = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう', 'じゅう'];

const CATS = {
  くだもの: ['🍎', '🍌', '🍇', '🍓', '🍊', '🍑', '🍉', '🍒'],
  どうぶつ: ['🐶', '🐱', '🐰', '🐻', '🐼', '🦁', '🐘', '🐵'],
  のりもの: ['🚗', '🚌', '🚒', '🚓', '🚑', '🚲', '🚂', '✈️'],
  おやさい: ['🥕', '🥦', '🌽', '🍅', '🥒', '🍆', '🥔', '🧅'],
};
const COLORS = {
  あかい: ['🍎', '🍓', '🚒', '🍅', '🌹', '🍒'],
  きいろい: ['🍌', '🌻', '🐤', '🍋', '🌽', '⭐'],
  みどりの: ['🥦', '🐸', '🥒', '🍀', '🐢', '🌲'],
  あおい: ['🐳', '💧', '🧢', '👖', '🦋', '🐟'],
};
const SHAPES = { まる: '🔴', さんかく: '🔺', しかく: '🟦', ほし: '⭐', ハート: '❤️' };
const BIG = ['🐘', '🐶', '🍎', '🚗', '🐻', '🌳', '🐟', '🌻'];
const PRAISE = ['すごい！', 'やったね！', 'せいかい！', 'よく みてたね！', 'さすが！'];
export const praise = () => pick(PRAISE);
export const EASY_NAMES = { count: 'いくつ ある？', same: 'おなじ え', odd: 'なかまはずれ', color: 'いろ', shape: 'かたち', size: 'おおきい・ちいさい', next: 'つぎは どれ？' };

// こたえ（1つ）と ほか（n-1つ）を まぜて もんだいに する
function Q(kind, level, { show, say, explain, right, wrongs, opt = x => x }) {
  const opts = shuffle([right, ...wrongs]);
  return {
    type: 'math', math: true, easy: true, mtype: 'ez-' + kind, wid: null, mlevel: level,
    prompt: { html: show ? `<div class="ez-show">${show}</div>` : '', listen: true },
    options: opts.map((_, k) => 'txt:' + k), easyOpts: opts.map(opt),
    answer: 'txt:' + opts.indexOf(right),
    say: [{ t: say, l: 'ja' }], explain: [{ t: explain, l: 'ja' }],
  };
}
const others = (list, not, n) => shuffle(list.filter(x => !not.includes(x))).slice(0, n);

const GEN = {
  // いくつ ある？
  count(level) {
    const [a, b] = level <= 1 ? [1, 5] : [3, 9];
    const n = R(a, b), item = pick([...CATS.くだもの, ...CATS.どうぶつ]);
    const wrongs = shuffle([n - 2, n - 1, n + 1, n + 2].filter(x => x >= 1 && x <= 10)).slice(0, level <= 1 ? 2 : 3);
    const dots = k => `<b class="ez-num">${k}</b><span class="ez-dots">${'●'.repeat(k)}</span>`;
    return Q('count', level, {
      show: `<span class="ez-many">${item.repeat(n)}</span>`, say: 'いくつ あるかな？ かぞえてみよう。',
      explain: `${n}こ だよ。${NUM.slice(1, n + 1).join('、')}。`, right: n, wrongs, opt: dots,
    });
  },
  // おなじ えは どれ？
  same(level) {
    const cat = pick(Object.values(CATS)), [t, ...rest] = shuffle(cat);
    return Q('same', level, { show: t, say: 'これと おなじ えは どれかな？', explain: 'おなじ えは これだよ。', right: t, wrongs: rest.slice(0, level <= 1 ? 2 : 3) });
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
    const names = shuffle(Object.keys(SHAPES)), want = names[0];
    return Q('shape', level, { say: `${want}は どれかな？`, explain: `${want}は これだよ。`, right: SHAPES[want], wrongs: names.slice(1, level <= 1 ? 3 : 4).map(n => SHAPES[n]) });
  },
  // おおきい・ちいさい
  size(level) {
    const item = pick(BIG), big = Math.random() < 0.5, n = level <= 1 ? 3 : 4;
    const sizes = [1.4, 2.4, 3.4, 4.4].slice(0, n), right = big ? sizes[n - 1] : sizes[0];
    return Q('size', level, {
      say: big ? 'いちばん おおきいのは どれかな？' : 'いちばん ちいさいのは どれかな？',
      explain: big ? 'いちばん おおきいのは これだよ。' : 'いちばん ちいさいのは これだよ。',
      right, wrongs: sizes.filter(s => s !== right), opt: s => `<span style="font-size:${s}rem;line-height:1">${item}</span>`,
    });
  },
  // つぎは どれ？（🍎🍌🍎🍌…）
  next(level) {
    const cat = pick(Object.values(CATS)), [a, b, c, d] = shuffle(cat);
    const unit = level <= 1 ? [a, b] : pick([[a, b], [a, a, b], [a, b, c]]);
    const len = unit.length * 2 + 1, row = Array.from({ length: len }, (_, i) => unit[i % unit.length]);
    const right = unit[len % unit.length];
    const wrongs = [...new Set([...unit, d, c].filter(x => x !== right))].slice(0, level <= 1 ? 2 : 3);
    return Q('next', level, { show: row.join('') + '<span class="ez-q">？</span>', say: 'じゅんばんに ならんでるよ。つぎに くるのは どれかな？', explain: 'つぎは これだよ。', right, wrongs });
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
