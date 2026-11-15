// 問題づくり
import { WORDS, BY_ID, excluded } from './words.js';
import { dueIds } from './review.js';

export const TYPE_NAMES = {
  1: 'え → えいご',
  2: 'えいご → え',
  3: 'きいて → え',
  4: 'ひらがな → えいご',
  5: 'えいご → ひらがな',
};

// レベルごとの問題の種類の出やすさ
const TYPE_WEIGHTS = {
  1: { 2: 4, 3: 4, 1: 2 },
  2: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2 },
  3: { 1: 2, 2: 1, 3: 2, 4: 3, 5: 3 },
};
// レベルごとに使う単語のレベルと重み
const WORD_WEIGHTS = {
  1: { 1: 1 },
  2: { 1: 1, 2: 2 },
  3: { 1: 0.5, 2: 1, 3: 2 },
};
export const COIN_PER_LEVEL = { 1: 10, 2: 12, 3: 15 };
export const SESSION_LEN = 10;
export const REVIEW_LEN = 5;
const CHALLENGE_RATE = 0.15;

const rand = n => Math.floor(Math.random() * n);
export function shuffle(a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = rand(i + 1); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
function pickWeighted(obj) {
  const entries = Object.entries(obj);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [k, w] of entries) { if ((r -= w) <= 0) return Number(k); }
  return Number(entries[0][0]);
}

function pickWord(level, avoid0, challenge) {
  // かんたん（4歳）は絵の問題だけなので、絵のない ことば は出さない
  const avoid = level === 1 ? new Set([...avoid0, ...WORDS.filter(w => !w.hasPic).map(w => w.id)]) : avoid0;
  let pool;
  if (challenge) {
    const lv = Math.min(3, level + 1);
    pool = WORDS.filter(w => w.lv === lv && !avoid.has(w.id));
  } else {
    const ww = WORD_WEIGHTS[level];
    const lv = pickWeighted(ww);
    pool = WORDS.filter(w => w.lv === lv && !avoid.has(w.id));
    if (!pool.length) pool = WORDS.filter(w => ww[w.lv] && !avoid.has(w.id));
  }
  if (!pool.length) pool = WORDS.filter(w => w.lv <= Math.max(level, 1) && !avoid.has(w.id));
  if (!pool.length) pool = WORDS.filter(w => w.lv <= Math.max(level, 1) && (level > 1 || w.hasPic));
  return pool[rand(pool.length)];
}

function distractors(word, type, level, challenge) {
  const showsPic = type === 2 || type === 3; // 選択肢が絵
  const okBase = w => w.id !== word.id
    && w.en.toLowerCase() !== word.en.toLowerCase()
    && w.ja !== word.ja
    && !(w.pic && w.pic === word.pic)
    && !excluded(w.cat, word.cat)
    && (!showsPic || w.hasPic);
  // 絵の選択肢は「写真どうし」「絵文字どうし」でそろえる（写真だけ目立って答えがわかる、を防ぐ）
  const ok = w => okBase(w)
    && (!showsPic || !!w.photo === !!word.photo)
    // 数字の問題で、絵の選択肢が数字ばかりにならないよう、数字どうしは同じカテゴリの時だけ
    && (!showsPic || w.isNum === word.isNum || w.cat !== 'number');
  const maxLv = Math.max(level, word.lv);
  let sameCatN = level === 1 ? 0 : level === 2 ? 1 : 2;
  if (challenge) sameCatN = Math.min(3, sameCatN + 1);
  const same = shuffle(WORDS.filter(w => ok(w) && w.cat === word.cat && w.lv <= maxLv));
  const other = shuffle(WORDS.filter(w => ok(w) && w.cat !== word.cat && w.lv <= maxLv));
  const out = [];
  const seen = new Set([word.en.toLowerCase(), word.ja, word.pic].filter(Boolean));
  const take = w => {
    if (seen.has(w.en.toLowerCase()) || seen.has(w.ja) || (w.pic && seen.has(w.pic))) return false;
    seen.add(w.en.toLowerCase()); seen.add(w.ja); if (w.pic) seen.add(w.pic);
    out.push(w);
    return true;
  };
  for (const w of same) { if (out.length >= sameCatN) break; take(w); }
  for (const w of other) { if (out.length >= 3) break; take(w); }
  for (const w of same) { if (out.length >= 3) break; take(w); }
  if (out.length < 3) for (const w of shuffle(WORDS.filter(okBase))) { if (out.length >= 3) break; take(w); }
  return out;
}

export function makeQuestion(word, level, opts = {}) {
  let type = opts.type || pickWeighted(TYPE_WEIGHTS[level]);
  // 絵も写真もない ことば は、文字の問題（ひらがな⇔えいご）だけ
  if (!word.hasPic && type <= 3) type = Math.random() < 0.5 ? 4 : 5;
  const ds = distractors(word, type, level, !!opts.challenge);
  const options = shuffle([word, ...ds]).map(w => w.id);
  return { wid: word.id, type, options, challenge: !!opts.challenge, review: !!opts.review, retry: !!opts.retry };
}

export function retryOf(q, level) {
  const word = BY_ID[q.wid];
  const nq = makeQuestion(word, level, { type: q.type, challenge: q.challenge });
  nq.retry = true;
  nq.review = false;
  return nq;
}

export function buildSession(p, mode) {
  const level = p.level;
  const due = shuffle(dueIds(p)).filter(id => BY_ID[id]);
  if (mode === 'review') {
    return due.slice(0, REVIEW_LEN).map(id => makeQuestion(BY_ID[id], level, { review: true }));
  }
  const qs = [];
  const used = new Set(p.recent || []);
  const nRev = Math.min(due.length, 2 + rand(2)); // 2〜3問は復習を混ぜる
  for (const id of due.slice(0, nRev)) { qs.push(makeQuestion(BY_ID[id], level, { review: true })); used.add(id); }
  while (qs.length < SESSION_LEN) {
    const challenge = Math.random() < CHALLENGE_RATE;
    const w = pickWord(level, used, challenge);
    used.add(w.id);
    qs.push(makeQuestion(w, level, { challenge }));
  }
  return shuffle(qs);
}
