// 問題づくり（13種類）
import { WORDS, BY_ID, LETTERS, excluded } from './words.js';
import { TEMPLATES, TEMPLATE_JA, QA, OPPOSITES, LOOKALIKE, COUNT_THINGS } from './sentences.js';
import { dueIds } from './review.js';

export const TYPE_NAMES = {
  1: 'え → えいご',
  2: 'えいご → え',
  3: 'きいて → え',
  4: 'ひらがな → えいご',
  5: 'えいご → ひらがな',
  6: 'さいしょの もじ',
  7: 'おおもじ・こもじ',
  8: 'ぶんを きいて → え',
  9: 'あなうめ',
  10: 'しつもんに こたえる',
  11: 'ただしい つづり',
  12: 'はんたいことば',
  13: 'かずの ぶんしょう もんだい',
};

// レベルごとの問題の種類の出やすさ
const TYPE_WEIGHTS = {
  1: { 2: 4, 3: 4, 1: 2, 6: 1, 7: 1, 8: 1, 10: 1 },
  2: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 1, 10: 2, 12: 1, 13: 1 },
  3: { 1: 1, 2: 1, 3: 1, 4: 2, 5: 2, 6: 1, 7: 1, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2, 13: 2 },
};
const WORD_WEIGHTS = { 1: { 1: 1 }, 2: { 1: 1, 2: 2 }, 3: { 1: 0.5, 2: 1, 3: 2 } };
export const SESSION_LEN = 10;
export const REVIEW_LEN = 5;
const CHALLENGE_RATE = 0.15;

const rand = n => Math.floor(Math.random() * n);
const pickOne = a => a[rand(a.length)];
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

// ---------- 種類ごとに「使える単語」 ----------
const OPP_MAP = {};
for (const [a, b] of OPPOSITES) { if (BY_ID[a] && BY_ID[b]) { OPP_MAP[a] = b; OPP_MAP[b] = a; } }
const QA_OK = QA.filter(x => BY_ID[x.a] && x.d.every(id => BY_ID[id]));
const NUM_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const suits = {
  1: w => w.hasPic,
  2: w => w.hasPic,
  3: w => w.hasPic,
  4: () => true,
  5: () => true,
  6: w => w.hasPic && /^[A-Za-z]/.test(w.en) && w.cat !== 'number',
  8: w => w.hasPic && TEMPLATES[w.cat] && !(w.cat === 'number'),
  9: w => TEMPLATES[w.cat] && w.cat !== 'number' && !(w.cat === 'job'),
  11: w => /^[a-z]{3,9}$/.test(w.en),
  12: w => !!OPP_MAP[w.id],
};
const isLetterType = t => t === 7;
const isSpecialType = t => t === 10 || t === 13;

function wordPool(level, challenge, type) {
  const ok = suits[type] || (() => true);
  if (challenge) {
    const lv = Math.min(3, level + 1);
    const p = WORDS.filter(w => w.lv === lv && ok(w));
    if (p.length) return p;
  }
  const ww = WORD_WEIGHTS[level];
  const lv = pickWeighted(ww);
  let p = WORDS.filter(w => w.lv === lv && ok(w));
  if (p.length < 4) p = WORDS.filter(w => ww[w.lv] && ok(w));
  if (p.length < 4) p = WORDS.filter(w => w.lv <= 3 && ok(w));
  return p;
}

// ---------- 選択肢 ----------
function distractors(word, mode, level, challenge, extraOk = () => true) {
  const showsPic = mode === 'pic';
  const okBase = w => w.id !== word.id
    && w.en.toLowerCase() !== word.en.toLowerCase()
    && w.ja !== word.ja
    && !(w.pic && w.pic === word.pic)
    && !excluded(w.cat, word.cat)
    && (!showsPic || w.hasPic)
    && extraOk(w);
  // 絵の選択肢は「写真どうし」「絵文字どうし」でそろえる
  const ok = w => okBase(w)
    && (!showsPic || !!w.photo === !!word.photo)
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
  return out.map(w => w.id);
}

// まちがった つづりを3つ作る
function misspell(word) {
  const s = word.toLowerCase();
  const vowels = 'aeiou';
  const outs = new Set();
  const tries = [
    () => { const i = 1 + rand(s.length - 2); return s.slice(0, i) + s.slice(i + 1); }, // 1文字ぬく
    () => { const i = rand(s.length - 1); return s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2); }, // となりと入れかえ
    () => { const i = rand(s.length); return s.slice(0, i) + s[i] + s.slice(i); }, // 1文字ふやす
    () => { const idx = [...s].map((c, i) => vowels.includes(c) ? i : -1).filter(i => i >= 0); if (!idx.length) return s; const i = pickOne(idx); const v = pickOne([...vowels].filter(c => c !== s[i])); return s.slice(0, i) + v + s.slice(i + 1); }, // 母音をかえる
  ];
  for (let n = 0; n < 60 && outs.size < 3; n++) { const t = pickOne(tries)(); if (t && t !== s && t.length >= 2) outs.add(t); }
  return [...outs];
}

function article(w) { return w; }

// ---------- 問題を1つ作る ----------
// 返す形：{ type, wid, answer, options:[id], optMode:'pic'|'en'|'ja'|'letter'|'spell', prompt:{...}, say:[{t,l}], after: 'えいごの文' }
export function makeQuestion(word, level, opts = {}) {
  let type = opts.type || pickWeighted(TYPE_WEIGHTS[level]);
  if (word && word.letter) type = 7;
  if (word && !word.letter && !isSpecialType(type) && suits[type] && !suits[type](word)) type = word.hasPic ? pickOne([1, 2, 3, 4, 5].filter(t => level > 1 || t <= 3)) : pickOne([4, 5]);
  if (word && !word.letter && isLetterType(type)) type = word.hasPic ? 2 : 4;
  const challenge = !!opts.challenge;
  const base = { type, challenge, review: !!opts.review, retry: !!opts.retry };

  if (type === 7) {
    // こたえ＝target。画面には反対の形（大文字なら小文字）を出す
    const target = word && word.letter ? word : pickOne(LETTERS);
    const L = target.en.toUpperCase();
    const askUpper = target.en === L;
    const shown = askUpper ? L.toLowerCase() : L;
    const ans = target.en;
    const group = LOOKALIKE.find(g => g.includes(L.toLowerCase())) || '';
    const pool = shuffle([...new Set([...group.replace(L.toLowerCase(), ''), ...'abcdefghijklmnopqrstuvwxyz'.replace(L.toLowerCase(), '')])]).slice(0, 12);
    const d = [...new Set([...shuffle([...group.replace(L.toLowerCase(), '')]), ...pool])].slice(0, 3).map(c => `letter:${askUpper ? c.toUpperCase() : c}`);
    const ansId = `letter:${ans}`;
    return {
      ...base, wid: ansId, answer: ansId, optMode: 'letter', options: shuffle([ansId, ...d]),
      prompt: { big: shown, text: askUpper ? `こもじ「${shown}」の おおもじは どれ？` : `おおもじ「${shown}」の こもじは どれ？` },
      say: [{ t: askUpper ? `小文字の${shown.toUpperCase()}の、大文字はどれ？` : `大文字の${shown}の、小文字はどれ？`, l: 'ja' }],
      after: ans,
    };
  }

  if (type === 10) {
    const qa = opts.qa != null ? QA_OK[opts.qa] : pickOne(QA_OK.filter(x => x.lv <= level + (challenge ? 1 : 0)));
    const qi = QA_OK.indexOf(qa);
    const a = BY_ID[qa.a];
    const allPic = [a, ...qa.d.map(id => BY_ID[id])].every(w => w.hasPic && !!w.photo === !!a.photo);
    return {
      ...base, wid: qa.a, answer: qa.a, qa: qi, optMode: allPic ? 'pic' : 'en', options: shuffle([qa.a, ...qa.d]),
      prompt: { sentence: qa.q, text: qa.ja },
      say: [{ t: qa.q, l: 'en' }],
      after: a.en,
    };
  }

  if (type === 13) {
    const [emoji, one, many] = pickOne(COUNT_THINGS);
    const sub = level >= 3 && Math.random() < 0.5;
    let a, b, n;
    if (sub) { a = 3 + rand(7); b = 1 + rand(a - 1); n = a - b; } else { const max = level >= 3 ? 10 : 7; a = 1 + rand(max - 1); b = 1 + rand(Math.min(4, max - a)); n = a + b; }
    const ansId = `number:${NUM_WORDS[n - 1]}`;
    const near = shuffle([n - 3, n - 2, n - 1, n + 1, n + 2, n + 3].filter(x => x >= 1 && x <= 12 && x !== n)).slice(0, 3).map(x => `number:${NUM_WORDS[x - 1]}`);
    const name = c => (c === 1 ? one : many);
    const sentence = sub
      ? `I have ${a} ${name(a)}. I give away ${b}. How many ${many} do I have now?`
      : `I have ${a} ${name(a)}. I get ${b} more. How many ${many} do I have?`;
    return {
      ...base, wid: ansId, answer: ansId, optMode: 'pic', options: shuffle([ansId, ...near]),
      prompt: { sentence, emojiRow: sub ? `${emoji.repeat(a)}  ➖ ${b}` : `${emoji.repeat(a)}  ➕  ${emoji.repeat(b)}`, text: sub ? 'いくつ のこるかな？' : 'ぜんぶで いくつ？' },
      say: [{ t: sentence, l: 'en' }],
      after: `${NUM_WORDS[n - 1]}`,
    };
  }

  // ここから下は「単語」をもとにした問題
  const w = word;
  if (type === 1) return { ...base, wid: w.id, answer: w.id, optMode: 'en', options: shuffle([w.id, ...distractors(w, 'en', level, challenge)]), prompt: { pic: w.id, text: 'これは えいごで なんて いう？' }, say: [{ t: 'これは英語でなんて言う？', l: 'ja' }], after: w.en };
  if (type === 2) return { ...base, wid: w.id, answer: w.id, optMode: 'pic', options: shuffle([w.id, ...distractors(w, 'pic', level, challenge)]), prompt: { word: w.en, text: 'は どれかな？' }, say: [{ t: w.en, l: 'en' }, { t: 'は、どれかな？', l: 'ja' }], after: w.en };
  if (type === 3) return { ...base, wid: w.id, answer: w.id, optMode: 'pic', options: shuffle([w.id, ...distractors(w, 'pic', level, challenge)]), prompt: { listen: w.en, text: 'よく きいてね！ どれかな？' }, say: [{ t: 'よく聞いてね。', l: 'ja' }, { t: w.en, l: 'en' }], after: w.en };
  if (type === 4) return { ...base, wid: w.id, answer: w.id, optMode: 'en', options: shuffle([w.id, ...distractors(w, 'en', level, challenge)]), prompt: { word: `「${w.ja}」`, ja: true, text: 'は えいごで どれ？' }, say: [{ t: `${w.ja}は、英語でどれ？`, l: 'ja' }], after: w.en };
  if (type === 5) return { ...base, wid: w.id, answer: w.id, optMode: 'ja', options: shuffle([w.id, ...distractors(w, 'ja', level, challenge)]), prompt: { word: w.en, text: 'は にほんごで どれ？' }, say: [{ t: w.en, l: 'en' }, { t: 'は、日本語でどれ？', l: 'ja' }], after: w.en };

  if (type === 6) {
    const L = w.en[0].toUpperCase();
    const group = LOOKALIKE.find(g => g.includes(L.toLowerCase())) || '';
    const others = shuffle([...'ABCDEFGHIJKLMNOPRSTUVWY'.replace(L, '')]);
    const d = [...new Set([...shuffle([...group.toUpperCase().replace(L, '')]).slice(0, 1), ...others])].filter(c => c !== L).slice(0, 3);
    return {
      ...base, wid: w.id, answer: `letter:${L}`, optMode: 'letter', options: shuffle([`letter:${L}`, ...d.map(c => `letter:${c}`)]),
      prompt: { pic: w.id, text: 'えいごで いうと、さいしょの もじは どれ？' },
      say: [{ t: '英語で言うと、最初の文字はどれ？', l: 'ja' }],
      after: w.en,
    };
  }

  if (type === 8 || type === 9) {
    const tpl = pickOne(TEMPLATES[w.cat]);
    const full = tpl.replace('___', w.en);
    if (type === 8) {
      return {
        ...base, wid: w.id, answer: w.id, optMode: 'pic', options: shuffle([w.id, ...distractors(w, 'pic', level, challenge)]),
        prompt: { sentence: full, listenSentence: true, text: 'ぶんを きいて、あう えを えらんでね' },
        say: [{ t: full, l: 'en' }],
        after: full,
      };
    }
    // あなうめ：同じカテゴリの ことばで まよわせる（文に入っても おかしくない ことば）
    return {
      ...base, wid: w.id, answer: w.id, optMode: 'en', options: shuffle([w.id, ...distractors(w, 'en', Math.max(level, 2), true, x => !!TEMPLATES[x.cat])]),
      prompt: { pic: w.hasPic ? w.id : null, sentence: tpl, text: `（${TEMPLATE_JA[tpl] || ''}）え に あう ことばを いれてね`, hintJa: w.ja },
      say: [{ t: '絵に合う言葉を入れてね。', l: 'ja' }],
      after: full,
    };
  }

  if (type === 11) {
    const wrong = misspell(w.en);
    if (wrong.length < 3) return makeQuestion(w, level, { ...opts, type: w.hasPic ? 1 : 4 });
    return {
      ...base, wid: w.id, answer: `txt:${w.en}`, optMode: 'spell', options: shuffle([`txt:${w.en}`, ...wrong.map(s => `txt:${s}`)]),
      prompt: { pic: w.hasPic ? w.id : null, word: w.hasPic ? null : `「${w.ja}」`, ja: true, text: 'ただしい つづりは どれ？' },
      say: [{ t: w.en, l: 'en' }, { t: '正しいつづりはどれ？', l: 'ja' }],
      after: w.en,
    };
  }

  if (type === 12) {
    const oppId = OPP_MAP[w.id];
    const opp = BY_ID[oppId];
    const d = distractors(opp, 'en', Math.max(level, 2), true, x => x.id !== w.id && x.id !== oppId);
    return {
      ...base, wid: oppId, answer: oppId, optMode: 'en', options: shuffle([oppId, ...d.slice(0, 3)]),
      prompt: { word: w.en, sub: w.ja, text: 'の はんたいの ことばは どれ？' },
      say: [{ t: w.en, l: 'en' }, { t: 'の、反対の言葉はどれ？', l: 'ja' }],
      after: `${w.en} ↔ ${opp.en}`,
    };
  }
  return makeQuestion(w, level, { ...opts, type: w.hasPic ? 2 : 4 });
}

export function retryOf(q, level) {
  const word = BY_ID[q.wid];
  let nq;
  if (q.type === 10) nq = makeQuestion(null, level, { type: 10, qa: q.qa, challenge: q.challenge });
  else if (q.type === 13) nq = makeQuestion(null, level, { type: 13 });
  else if (q.type === 12) nq = makeQuestion(BY_ID[OPP_MAP[q.wid]] || word, level, { type: 12 });
  else nq = makeQuestion(word, level, { type: q.type, challenge: q.challenge });
  nq.retry = true;
  nq.review = false;
  return nq;
}

// ---------- 1回ぶん（10問）をつくる ----------
// boost：そのカテゴリの ことばを 多めに 出す（ダイナソークエストでは 'dino'）
export function buildSession(p, mode, { boost = null } = {}) {
  const level = p.level;
  const due = shuffle(dueIds(p)).filter(id => BY_ID[id]);
  if (mode === 'review') {
    return due.slice(0, REVIEW_LEN).map(id => makeQuestion(BY_ID[id], level, { review: true, type: reviewType(BY_ID[id], level) }));
  }
  const qs = [];
  const used = new Set(p.recent || []);
  const nRev = Math.min(due.length, 2 + rand(2)); // 2〜3問は復習を混ぜる
  for (const id of due.slice(0, nRev)) { qs.push(makeQuestion(BY_ID[id], level, { review: true, type: reviewType(BY_ID[id], level) })); used.add(id); }
  const typeCount = {};
  let guard = 0;
  while (qs.length < SESSION_LEN && guard++ < 200) {
    const challenge = Math.random() < CHALLENGE_RATE;
    const type = pickWeighted(TYPE_WEIGHTS[level]);
    if ((typeCount[type] || 0) >= 3) continue; // 同じ種類ばかりにならないように
    typeCount[type] = (typeCount[type] || 0) + 1;
    if (isSpecialType(type) || isLetterType(type)) { qs.push(makeQuestion(null, level, { type, challenge })); continue; }
    let pool = wordPool(level, challenge, type).filter(w => !used.has(w.id) && (level > 1 || w.hasPic));
    if (boost && Math.random() < 0.3) { const bp = WORDS.filter(w => w.cat === boost && w.lv <= Math.min(3, level + 1) && !used.has(w.id) && (suits[type] || (() => true))(w) && (level > 1 || w.hasPic)); if (bp.length) pool = bp; }
    if (!pool.length) pool = wordPool(level, false, type);
    if (!pool.length) continue;
    const w = pickOne(pool);
    used.add(w.id);
    qs.push(makeQuestion(w, level, { type, challenge }));
  }
  return shuffle(qs);
}
function reviewType(w, level) {
  if (w.letter) return 7;
  if (!w.hasPic) return pickOne([4, 5]);
  return pickOne(level === 1 ? [1, 2, 3] : [1, 2, 3, 4, 5]);
}
void article;
