// にがて復習（間をあけて復習：1日後 → 3日後 → 7日後 → 14日後。4回続けて正解で卒業）
import { today, addDays } from './store.js';

const NEXT = [1, 3, 7, 14];

export function markWrong(p, wid) {
  const r = p.review[wid] || { box: 0, wrong: 0, grad: false, first: today() };
  r.box = 0;
  r.wrong += 1;
  r.grad = false;
  r.due = addDays(today(), NEXT[0]);
  r.last = today();
  p.review[wid] = r;
}

// 復習の日が来ている「おばけ」に正解したときだけ進める。戻り値: null | 'up' | 'graduated'
export function markCorrect(p, wid) {
  const r = p.review[wid];
  if (!r || r.grad || r.due > today()) return null;
  r.box += 1;
  if (r.box >= 4) {
    r.grad = true;
    r.gradDate = today();
    p.ghostsGraduated = (p.ghostsGraduated || 0) + 1;
    return 'graduated';
  }
  r.due = addDays(today(), NEXT[r.box]);
  return 'up';
}

export function dueIds(p) {
  const t = today();
  return Object.entries(p.review).filter(([, r]) => !r.grad && r.due <= t).map(([id]) => id);
}
export function ghostIds(p) { return Object.entries(p.review).filter(([, r]) => !r.grad).map(([id]) => id); }
export function friendIds(p) { return Object.entries(p.review).filter(([, r]) => r.grad).map(([id]) => id); }
