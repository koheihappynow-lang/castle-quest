// 読み上げ（英語はアメリカ英語、日本語は日本語の声）
// できるだけ自然な声（Natural / Premium / Enhanced）を自動で選ぶ。おうちのひとメニューで変更もできる
const synth = window.speechSynthesis;
let voices = [];
let prefs = { en: '', ja: '', rate: 1 };
const listeners = new Set();
function loadVoices() {
  voices = synth ? synth.getVoices() : [];
  listeners.forEach(f => f());
}
if (synth) { loadVoices(); synth.onvoiceschanged = loadVoices; }
export function onVoicesChanged(f) { listeners.add(f); }

// おもしろ声（ロボット・ささやき声など）は使わない
const NOVELTY = /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Ralph|Kathy|Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley/i;
const FAVORITE = {
  'en-US': ['Ava', 'Ana', 'Jenny', 'Aria', 'Samantha', 'Zoe', 'Allison', 'Nicky', 'Google US English', 'Evan', 'Joelle', 'Nathan'],
  'ja-JP': ['Nanami', 'Kyoko', 'Otoya', 'O-Ren', 'Hattori', 'Google 日本語', 'Keita', 'Ayumi', 'Haruka'],
};
function score(v, lang) {
  let s = 0;
  if (/Natural|Premium|Neural|プレミアム/i.test(v.name)) s += 100;
  if (/Enhanced|拡張/i.test(v.name)) s += 70;
  if (/Online/i.test(v.name)) s += 40;
  if (/Google/i.test(v.name)) s += 35;
  const fav = FAVORITE[lang].findIndex(n => v.name.includes(n));
  if (fav >= 0) s += 30 - fav;
  if (v.localService === false) s += 5;
  return s;
}
export function voiceList(lang) {
  return voices
    .filter(v => v.lang.replace('_', '-') === lang && !NOVELTY.test(v.name))
    .sort((a, b) => score(b, lang) - score(a, lang));
}
function voiceFor(lang) {
  const key = lang.startsWith('en') ? 'en' : 'ja';
  const list = voiceList(lang);
  if (prefs[key]) { const v = list.find(v => v.name === prefs[key]); if (v) return v; }
  return list[0] || voices.find(v => v.lang.startsWith(lang.slice(0, 2))) || null;
}
export function setPrefs(p) { prefs = { ...prefs, ...(p || {}) }; }
export function currentVoiceName(lang) { return voiceFor(lang)?.name || '（なし）'; }

// 日本語は、ひらがなの間のスペースで声がとぎれて片言になるので、読み上げる前にスペースを取る
function cleanJa(t) {
  return t.replace(/([^\x00-\x7F])[ 　]+(?=[^\x00-\x7F])/g, '$1').replace(/[ 　]+([、。！？])/g, '$1');
}

// parts: [{t:'dog', l:'en'}, {t:'はどれかな？', l:'ja'}]
export function say(parts, { cancel = true } = {}) {
  if (!synth) return;
  if (cancel) synth.cancel();
  for (const { t, l } of parts) {
    if (!t) continue;
    const lang = l === 'en' ? 'en-US' : 'ja-JP';
    const u = new SpeechSynthesisUtterance(l === 'en' ? t : cleanJa(t));
    u.lang = lang;
    const v = voiceFor(lang);
    if (v) u.voice = v;
    const natural = v && /Natural|Premium|Enhanced|Online|Google/i.test(v.name);
    u.rate = (l === 'en' ? (natural ? 0.92 : 0.85) : 1.0) * (prefs.rate || 1);
    u.pitch = 1.0;
    synth.speak(u);
  }
}
export const en = t => say([{ t, l: 'en' }]);
export const ja = t => say([{ t, l: 'ja' }]);
export function stop() { if (synth) synth.cancel(); }

// iPadは最初のタップのときに読み上げを有効にする必要がある
export function unlock() {
  if (!synth) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  synth.speak(u);
}
