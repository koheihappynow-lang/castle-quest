// データ保存（この端末の中だけ。外部には送らない）
const KEY = 'castleQuest.v1';

import { DEFAULT_RATES, RATES_DATE } from './castles.js';

function blank() {
  return {
    version: 2,
    profiles: [],
    activeId: null,
    settings: { pinHash: null, limitMin: 0, reviewGate: 30, rates: { ...DEFAULT_RATES }, ratesDate: RATES_DATE, voice: { en: '', ja: '', rate: 1 } },
  };
}

// 古いデータ（コイン）を新しい形（円のおさいふ）に直す
function migrate(d) {
  const b = blank();
  d = { ...b, ...d, settings: { ...b.settings, ...(d.settings || {}) } };
  d.settings.rates = { ...DEFAULT_RATES, ...(d.settings.rates || {}) };
  d.settings.voice = { ...b.settings.voice, ...(d.settings.voice || {}) };
  for (const p of d.profiles) {
    p.wallet = { yen: 0, dollar: 0, euro: 0, pound: 0, yuan: 0, ...(p.wallet || {}) };
    if (typeof p.coins === 'number') { p.wallet.yen += p.coins * 100; delete p.coins; }
    if (typeof p.totalCoins === 'number') { p.totalYen = (p.totalYen || 0) + p.totalCoins * 100; delete p.totalCoins; }
    p.castles = p.castles || {};
    p.completed = p.completed || [];
    p.tsurugaBonus = p.tsurugaBonus || 0;
  }
  d.version = 2;
  return d;
}

let db = load();

function load() {
  try {
    const s = localStorage.getItem(KEY);
    if (s) return migrate(JSON.parse(s));
  } catch (e) { console.warn('load failed', e); }
  return blank();
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { console.warn('save failed', e); }
}

export const getDB = () => db;
export function replaceDB(d) { db = migrate(d); save(); }

export function today(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}
export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return today(new Date(y, m - 1, d + n));
}

export function levelForAge(age) { return age <= 4 ? 1 : age === 5 ? 2 : 3; }

export function createProfile({ name, age, avatar, photo = null }) {
  const p = {
    id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name, age, avatar, photo, level: levelForAge(age),
    wallet: { yen: 0, dollar: 0, euro: 0, pound: 0, yuan: 0 },
    totalYen: 0,
    castles: {},
    completed: [],
    tsurugaBonus: 0,
    review: {},
    history: [],
    recent: [],
    play: {},
    extra: {},
    ghostsGraduated: 0,
    bestStreak: 0,
    created: today(),
  };
  db.profiles.push(p);
  save();
  return p;
}

export function activeProfile() { return db.profiles.find(p => p.id === db.activeId) || null; }
export function setActive(id) { db.activeId = id; save(); }

export function deleteProfile(id) {
  db.profiles = db.profiles.filter(p => p.id !== id);
  if (db.activeId === id) db.activeId = null;
  save();
}

// 暗証番号はハッシュにして保存する（番号そのものは保存しない）
export async function hashPin(pin) {
  const salt = 'castle-quest:';
  try {
    if (crypto?.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + pin));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) { /* fall through */ }
  let h = 5381;
  for (const ch of salt + pin) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
  return 'x' + h.toString(16);
}

export function playedSec(p, date = today()) { return p.play[date] || 0; }
export function limitSec(p, date = today()) {
  const m = db.settings.limitMin;
  if (!m) return Infinity;
  return (m + (p.extra[date] || 0)) * 60;
}

export async function requestPersist() {
  try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch (e) { /* ignore */ }
}
