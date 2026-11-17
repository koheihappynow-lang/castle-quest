// 🧩 ひらめき パズル（かんがえる ちから・プログラミングの きほん）
// さんすうと おなじ しくみ（q.math = true）で クイズ画面・おかね・まちがいなおしを つかう
// レベル 1〜5（さんすうの むずかしさと おなじ。ねんれい から じどう）
import { MATH_TYPE_NAMES } from './math.js';

const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const opts = (ans, others, n = 4) => { const s = new Set([ans]); for (const o of shuffle(others)) if (s.size < n && o !== ans) s.add(o); return shuffle([...s]).map(v => `txt:${v}`); };
function Q(mtype, { html, text, ja, options, answer, explain }, level) {
  return { type: 'math', math: true, puzzle: true, mtype, wid: null, prompt: { html, text }, options, answer: `txt:${answer}`, say: [{ t: ja || text, l: 'ja' }], explain, mlevel: level, retryFn: () => puzzleRetry(mtype, level) };
}

export const PUZZLE_TYPE_NAMES = {
  pattern: 'きまりを みつけよう', odd: 'なかまはずれ', robot: 'ロボットを うごかそう', rotate: 'まわすと どうなる？',
  ifthen: 'もし 〜なら', balance: 'どれが おもい？', order: 'ならべよう',
};
Object.assign(MATH_TYPE_NAMES, PUZZLE_TYPE_NAMES);   // クイズ画面の みだし に つかう

const row = items => `<div class="pz-row">${items.map(x => `<span class="pz-cell">${x}</span>`).join('')}</div>`;

// ---------- 1. きまりを みつけよう（パターン） ----------
const PAT_SETS = [['🔴', '🔵', '🟡', '🟢'], ['🐶', '🐱', '🐰', '🐻'], ['🍎', '🍌', '🍇', '🍓'], ['⭐', '🌙', '☀️', '☁️'], ['🚗', '🚌', '🚓', '🚒']];
function pattern(level) {
  const set = shuffle(pick(PAT_SETS));
  const units = level <= 1 ? [[0, 1]] : level === 2 ? [[0, 1, 2], [0, 0, 1], [0, 1, 1]] : level === 3 ? [[0, 1, 2], [0, 0, 1, 1], [0, 1, 1, 2]] : [[0, 1, 2, 3], [0, 0, 1, 2], [0, 1, 0, 2], [0, 1, 2, 2, 1]];
  const u = pick(units).map(i => set[i]);
  const len = Math.min(9, Math.max(5, u.length * 2 + 1) + (level >= 4 ? 1 : 0));
  const seq = Array.from({ length: len + 1 }, (_, i) => u[i % u.length]);
  const ans = seq.pop();
  return Q('pattern', { html: row([...seq, '❓']), text: '❓ に はいるのは どれ？', ja: 'はてなに はいるのは どれかな？', options: opts(ans, set), answer: ans, explain: `${u.join('')} の くりかえし` }, level);
}

// ---------- 2. なかまはずれ ----------
const GROUPS = [
  ['どうぶつ', ['🐶', '🐱', '🐰', '🐻', '🐼', '🦊', '🐷']], ['くだもの', ['🍎', '🍌', '🍇', '🍓', '🍊', '🍑', '🍉']],
  ['のりもの', ['🚗', '🚌', '🚓', '🚑', '🚒', '🚜', '🚲']], ['やさい', ['🥕', '🥦', '🍅', '🥒', '🌽', '🧅']],
];
const HARD = [   // おなじ なかまでも ちがいが こまかい
  ['とぶ', ['🐦', '🦅', '🦆', '🦉', '🐝', '🦋'], 'とばない', ['🐟', '🐢', '🐘', '🐄']],
  ['うみの いきもの', ['🐟', '🐙', '🦀', '🐬', '🐳'], 'りくの いきもの', ['🐄', '🐘', '🦒', '🐒']],
  ['そらに ある', ['☀️', '🌙', '⭐', '☁️', '🌈'], 'じめんに ある', ['🌳', '🏠', '🌷', '🪨']],
];
function odd(level) {
  let same, other, why;
  if (level >= 3 && Math.random() < 0.6) {
    const [g1, a, g2, b] = pick(HARD); same = shuffle(a).slice(0, 3); other = pick(b); why = `ほかは ${g1}。${other} は ${g2}`;
  } else {
    const [ga, gb] = shuffle(GROUPS); same = shuffle(ga[1]).slice(0, 3); other = pick(gb[1]); why = `ほかは ${ga[0]}。${other} は ${gb[0]}`;
  }
  const four = shuffle([...same, other]);
  return Q('odd', { html: row(four), text: 'ひとつだけ ちがう なかまは どれ？', ja: 'ひとつだけ なかまじゃないのは どれかな？', options: four.map(v => `txt:${v}`), answer: other, explain: why }, level);
}

// ---------- 3. ロボットを うごかそう（プログラミング：じゅんばん・くりかえし） ----------
const DIRS = { '➡️': [1, 0], '⬅️': [-1, 0], '⬆️': [0, -1], '⬇️': [0, 1] };
function walk(start, moves, n, walls) {
  let [x, y] = start;
  for (const m of moves) { const [dx, dy] = DIRS[m]; x += dx; y += dy; if (x < 0 || y < 0 || x >= n || y >= n || walls.has(x + ',' + y)) return null; }
  return [x, y];
}
// ➡️➡️➡️ → ➡️×3（くりかえし）
const pack = moves => { const out = []; for (let i = 0; i < moves.length;) { let j = i; while (j < moves.length && moves[j] === moves[i]) j++; out.push(j - i > 1 ? `${moves[i]}×${j - i}` : moves[i]); i = j; } return out.join(' '); };
function robot(level) {
  const n = level <= 2 ? 3 : 4, useLoop = level >= 4;
  for (let tries = 0; tries < 60; tries++) {
    const start = [0, n - 1];
    // ゴールまでの みち（みぎと うえ だけ ＋ レベル5は すこし まわりみち）
    const right = R(1, n - 1), up = R(level <= 1 ? 0 : 1, n - 1);
    if (right + up < (level <= 1 ? 1 : 2)) continue;
    let moves = shuffle([...Array(right).fill('➡️'), ...Array(up).fill('⬆️')]);
    if (useLoop) moves = [...Array(right).fill('➡️'), ...Array(up).fill('⬆️')];   // くりかえしが つかえる かたち
    if (level === 1) moves = moves.slice(0, R(1, 2));
    const goal = walk(start, moves, n, new Set()); if (!goal) continue;
    // じゃまな 木（みちの うえには おかない）
    const path = new Set(); { let [x, y] = start; path.add(x + ',' + y); for (const m of moves) { x += DIRS[m][0]; y += DIRS[m][1]; path.add(x + ',' + y); } }
    const walls = new Set();
    if (level >= 2) for (let k = 0; k < (level >= 4 ? 3 : 2); k++) { const w = R(0, n - 1) + ',' + R(0, n - 1); if (!path.has(w)) walls.add(w); }
    // まちがいの こたえ：ちがう ところに つく か 木に ぶつかる
    const wrongs = new Set();
    const variants = [
      () => moves.map(m => m === '➡️' ? '⬆️' : m === '⬆️' ? '➡️' : m),
      () => moves.slice(0, -1), () => [...moves, pick(['➡️', '⬆️'])],
      () => { const c = [...moves]; const i = R(0, c.length - 1); c[i] = pick(Object.keys(DIRS)); return c; },
      () => moves.map(m => m === '⬆️' ? '⬇️' : m), () => [...moves].reverse().map(m => m === '➡️' ? '⬅️' : m),
    ];
    for (let g = 0; g < 40 && wrongs.size < 3; g++) {
      const v = pick(variants)(); if (!v.length) continue;
      const end = walk(start, v, n, walls);
      if (end && end[0] === goal[0] && end[1] === goal[1]) continue;
      wrongs.add(useLoop ? pack(v) : v.join(''));
    }
    if (wrongs.size < 2) continue;
    const ans = useLoop ? pack(moves) : moves.join('');
    if (wrongs.has(ans)) continue;
    let cells = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const k = x + ',' + y;
      cells += `<span class="pz-g">${x === start[0] && y === start[1] ? '🤖' : x === goal[0] && y === goal[1] ? '🎁' : walls.has(k) ? '🌳' : ''}</span>`;
    }
    const html = `<div class="pz-grid" style="--n:${n}">${cells}</div>${useLoop ? '<div class="pz-note">➡️×3 は「➡️を 3かい」</div>' : ''}`;
    return Q('robot', { html, text: '🤖 を 🎁 まで うごかす めいれいは どれ？', ja: 'ロボットを プレゼントまで うごかす めいれいは どれかな？', options: shuffle([ans, ...[...wrongs].slice(0, 3)]).map(v => `txt:${v}`), answer: ans, explain: `${ans} で 🎁 に つくよ` }, level);
  }
  return pattern(level);
}

// ---------- 4. まわすと どうなる？（やじるし） ----------
const ARROWS = ['⬆️', '➡️', '⬇️', '⬅️'];
function rotate(level) {
  const a = R(0, 3), turns = level >= 5 ? pick([1, 2, 3]) : level >= 4 ? pick([1, 2]) : 1, dir = level >= 4 ? pick([1, -1]) : 1;
  const ans = ARROWS[(a + dir * turns + 8) % 4];
  const how = turns === 2 ? 'はんたいに（2かい）' : `${dir > 0 ? 'みぎ' : 'ひだり'}に ${turns}かい`;
  return Q('rotate', { html: row([ARROWS[a], dir > 0 ? '↻' : '↺', turns > 1 ? `×${turns}` : '']), text: `やじるしを ${how} まわすと？`, ja: `やじるしを ${how} まわすと どうなるかな？`, options: ARROWS.map(v => `txt:${v}`), answer: ans, explain: `${ARROWS[a]} を ${how} まわすと ${ans}` }, level);
}

// ---------- 5. もし 〜なら（じょうけん） ----------
const IFS = [
  [['☔', 'あめ'], ['☀️', 'はれ']], [['🌙', 'よる'], ['☀️', 'あさ']], [['🥶', 'さむい'], ['🥵', 'あつい']],
];
const THENS = { 'あめ': '☂️', 'はれ': '🧢', 'よる': '🛏️', 'あさ': '🍳', 'さむい': '🧣', 'あつい': '🍦' };
function ifthen(level) {
  const [a, b] = pick(IFS); const now = pick([a, b]);
  const ans = THENS[now[1]];
  const html = `<div class="pz-if"><div>もし ${a[0]} なら ${THENS[a[1]]}</div><div>もし ${b[0]} なら ${THENS[b[1]]}</div><div class="pz-now">いまは ${now[0]}</div></div>`;
  return Q('ifthen', { html, text: 'どれを えらぶ？', ja: `いまは ${now[1]}。どれを えらぶかな？`, options: opts(ans, Object.values(THENS)), answer: ans, explain: `${now[1]} だから ${ans}` }, level);
}

// ---------- 6. どれが おもい？（てんびん） ----------
function balance(level) {
  const items = shuffle(['🔴', '🔵', '🟡', '🟢', '🟣', '🟠']).slice(0, 3);   // items[0] が いちばん おもい（ほんものの たべものだと「バナナが スイカより おもい」に なるので いろの ボール）
  const sc = (h, l) => `<div class="pz-scale"><span class="lo">${h}</span><span class="beam">⚖️</span><span class="hi">${l}</span></div>`;
  const facts = shuffle([sc(items[0], items[1]), sc(items[1], items[2])]);
  const lightest = level >= 4 && Math.random() < 0.5;
  const ans = lightest ? items[2] : items[0];
  return Q('balance', { html: `<div class="pz-scales">${facts.join('')}</div><div class="pz-note">さがっている ほうが おもい</div>`, text: lightest ? 'いちばん かるいのは どれ？' : 'いちばん おもいのは どれ？', ja: lightest ? 'いちばん かるいのは どれかな？' : 'いちばん おもいのは どれかな？', options: items.map(v => `txt:${v}`), answer: ans, explain: `${items[0]} ＞ ${items[1]} ＞ ${items[2]}` }, level);
}

// ---------- 7. ならべよう（おおきさ） ----------
function order(level) {
  const e = pick(['🐻', '🌳', '🎈', '🐟', '🏠', '⭐']), sizes = shuffle([1, 2, 3, ...(level >= 3 ? [4] : [])]);
  const names = ['', 'ちいさい', 'ちゅうくらい', 'おおきい', 'いちばん おおきい'];
  const html = `<div class="pz-row pz-sizes">${sizes.map((s, i) => `<span class="pz-cell" style="font-size:${0.7 + s * 0.45}em"><b class="pz-tag">${'ABCD'[i]}</b>${e}</span>`).join('')}</div>`;
  const big = sizes.length, ask = Math.random() < 0.5 ? big : 1;
  const ans = 'ABCD'[sizes.indexOf(ask)];
  return Q('order', { html, text: ask === 1 ? 'いちばん ちいさいのは どれ？' : 'いちばん おおきいのは どれ？', ja: ask === 1 ? 'いちばん ちいさいのは どれかな？' : 'いちばん おおきいのは どれかな？', options: sizes.map((_, i) => `txt:${'ABCD'[i]}`), answer: ans, explain: `${ans} が ${ask === 1 ? 'いちばん ちいさい' : 'いちばん おおきい'}` }, level);
}

const GEN = { pattern, odd, robot, rotate, ifthen, balance, order };
const PLAN = {
  1: [['pattern', 4], ['odd', 3], ['ifthen', 2], ['robot', 2], ['order', 1]],
  2: [['pattern', 3], ['odd', 2], ['robot', 3], ['ifthen', 1], ['rotate', 1], ['order', 2]],
  3: [['pattern', 2], ['odd', 2], ['robot', 3], ['rotate', 2], ['balance', 2], ['order', 1]],
  4: [['pattern', 2], ['odd', 1], ['robot', 4], ['rotate', 2], ['balance', 2]],
  5: [['pattern', 2], ['odd', 1], ['robot', 4], ['rotate', 2], ['balance', 2]],
};
export function makePuzzle(level, type) {
  const plan = PLAN[level] || PLAN[1];
  for (let i = 0; i < 30; i++) {
    let t = type;
    if (!t) { const total = plan.reduce((s, x) => s + x[1], 0); let r = Math.random() * total; for (const [k, w] of plan) { r -= w; if (r <= 0) { t = k; break; } } t ||= plan[0][0]; }
    const q = GEN[t](level);
    if (q.options.length >= 3 && q.options.includes(q.answer) && new Set(q.options).size === q.options.length) return q;
  }
  return pattern(level);
}
export function buildPuzzleSession(level, n = 10) {
  const qs = [], seen = new Set(); let g = 0;
  while (qs.length < n && g++ < 300) {
    const challenge = level < 5 && Math.random() < 0.12;
    const q = makePuzzle(challenge ? level + 1 : level);
    const key = q.mtype + '|' + q.prompt.html; if (seen.has(key)) continue; seen.add(key);
    if (challenge) q.challenge = true;
    qs.push(q);
  }
  return qs;
}
export function puzzleRetry(type, level) { const q = makePuzzle(level, type); q.retry = true; return q; }
