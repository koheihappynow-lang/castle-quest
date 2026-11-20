// 👀 みまもり（こどもの iPad がわ）
// ・あそんでいる あいだ、1ぷんごとに「ようす」を おうちのひとの スマホへ おくる（おてがみと おなじ サーバー）
// ・おうちのひとが「おやすみ」に したら、その こ の iPad は「いまは おやすみ」の がめんに なる
import { online, postStatus, deviceName, nameKey } from './letters.js';
import { EASY_NAMES } from './easy.js';

const AREA = { normal: 'えいご', review: 'ふくしゅう', math: 'さんすう', puzzle: 'パズル', easy: 'やさしい' };
// 親の スマホに 出す ことば（漢字で よい）
const DOING = {
  home: '🏰 キャッスルクエストのホーム', dhome: '🦖 ダイナソークエストのホーム', castles: '🏰 お城を選んでいる', castle: '🏰 お城を建てている',
  exchange: '💱 両替所', ghosts: '📕 おばけ図鑑', result: '🎉 結果を見ている', deggs: '🥚 たまごを選んでいる', hatch: '🥚 たまごがかえるところ',
  dcare: '🦖 恐竜のお世話', dshop: '🛒 恐竜のお店', dzukan: '📕 恐竜図鑑', letters: '💌 お手紙', games: 'ゲームを選んでいる',
  shadow: '🌑 かげあて', rest: '☕ 休憩中', limit: '🌙 今日は終了', paused: '🌙 おやすみ中',
};
const AREA_JA = { normal: '英語', review: '復習', math: '算数', puzzle: 'パズル', easy: 'やさしいモード' };

export function installWatch(api) {
  const { S, SCREENS, AFTER, BG, go, activeProfile, esc, sayJa, today, playedSec, limitSec, dueIds, BY_ID, TYPE_NAMES, MATH_TYPE_NAMES, PLAY_SCREENS, homeScreen, easyLevelOf } = api;
  const typeName = x => x.ty === 'easy' ? '🌈 ' + (EASY_NAMES[String(x.w).slice(8)] || 'やさしい')
    : String(x.w).startsWith('math:') ? (x.m === 'puzzle' ? '🧩 ' : '🔢 ') + (MATH_TYPE_NAMES[String(x.w).slice(5)] || 'もんだい')
    : '🔤 ' + (TYPE_NAMES[x.ty] || 'えいご');

  // おくる ようす（1にん ぶん）
  function report(p) {
    const now = Date.now(), DAY = 86400000;
    const h14 = p.history.filter(x => x.ts > now - 14 * DAY && !x.r);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = today(new Date(now - (6 - i) * DAY)), hs = p.history.filter(x => x.d === d && !x.r);
      return { d, sec: (p.play || {})[d] || 0, n: hs.length, ok: hs.filter(x => x.ok).length };
    });
    const areas = {}, types = {}, hours = Array(24).fill(0);
    for (const x of h14) {
      const a = AREA[x.m] || 'えいご'; (areas[a] ||= { n: 0, ok: 0 }); areas[a].n++; if (x.ok) areas[a].ok++;
      const t = typeName(x); (types[t] ||= { n: 0, ok: 0 }); types[t].n++; if (x.ok) types[t].ok++;
      hours[new Date(x.ts).getHours()]++;
    }
    const tl = Object.entries(types).filter(([, v]) => v.n >= 4).map(([k, v]) => ({ k, n: v.n, ok: v.ok, r: v.ok / v.n }));
    const weak = tl.filter(t => t.r < 0.75).sort((a, b) => a.r - b.r).slice(0, 3);
    const strong = tl.filter(t => t.r >= 0.85).sort((a, b) => b.r - a.r || b.n - a.n).slice(0, 3);
    const weakWords = Object.entries(p.review || {}).filter(([id, r]) => BY_ID[id] && r.wrong).sort((a, b) => b[1].wrong - a[1].wrong).slice(0, 5)
      .map(([id, r]) => ({ en: BY_ID[id].en, ja: BY_ID[id].ja, pic: BY_ID[id].pic || '', wrong: r.wrong }));
    let streak = 0; for (let i = 0; i < 60; i++) { const d = today(new Date(now - i * DAY)); if (((p.play || {})[d] || 0) >= 60) streak++; else if (i > 0) break; }
    const quizDoing = S.screen === 'quiz' && S.quiz ? `✏️ ${AREA_JA[S.quiz.mode] || ''}の問題（${S.quiz.i + 1}問目）` : '';
    return {
      v: 1, at: now, playing: document.visibilityState === 'visible' && PLAY_SCREENS.has(S.screen),
      doing: quizDoing || DOING[S.screen] || '', game: S.game,
      todaySec: playedSec(p), limitMin: Math.round(limitSec(p) / 60), days, areas, weak, strong, weakWords, hours, streak,
      castles: (p.completed || []).length, dinos: (p.dino?.order || []).length, ghosts: dueIds(p).length,
      easy: easyLevelOf(p), age: p.age,
    };
  }

  // ---------- おやすみ ----------
  const kidOf = p => nameKey(p?.name);
  const paused = p => !!(p && S.pause && S.pause.kid === kidOf(p) && S.pause.until > Date.now());
  const QUIET = ['paused', 'profiles', 'boot', 'newProfile', 'parent', 'pin', 'setupPin'];
  function applyControl(p, c) {
    const was = paused(p);
    S.pause = c ? { ...c, kid: kidOf(p) } : null;
    if (paused(p)) { if (!QUIET.includes(S.screen)) go('paused'); else if (S.screen === 'paused' && !was) go('paused'); }
    else if (S.screen === 'paused') { go(homeScreen()); sayJa('おまたせ！ あそんで いいよ！'); }
  }
  const untilText = u => {
    const d = new Date(u), mid = new Date(); mid.setHours(23, 50, 0, 0);
    return u >= mid.getTime() ? 'きょうは おしまい。また あした あそぼうね' : `${d.getHours()}じ${d.getMinutes() ? d.getMinutes() + 'ふん' : ''}まで おやすみ`;
  };
  SCREENS.paused = () => `
    <div class="page narrow center-text limit">
      <div class="logo">🌙</div>
      <h2>いまは おやすみ</h2>
      ${S.pause?.msg ? `<p class="pause-msg">💬 ${esc(S.pause.msg)}</p>` : '<p>おうちのひとが「おやすみ」に したよ。</p>'}
      <p>${S.pause ? untilText(S.pause.until) : ''}</p>
      <div class="row center"><button class="btn ghost" data-act="go" data-to="profiles">おわる</button></div>
    </div>`;
  BG.paused = 'night';
  AFTER.paused = () => sayJa(`いまは おやすみ だよ。${S.pause?.msg || ''}`);

  // ---------- おくる ----------
  let busy = false;
  async function ping() {
    const p = activeProfile();
    if (!p || !online() || busy || ['profiles', 'boot', 'newProfile', 'setupPin'].includes(S.screen)) return;
    busy = true;
    try { const r = await postStatus({ kid: kidOf(p), name: p.name, device: deviceName(), rep: report(p) }); applyControl(p, r.control); }
    catch (e) {}
    finally { busy = false; }
  }
  let n = 0;
  setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    n++;
    if (S.screen === 'paused' ? n % 20 === 0 : n % 60 === 0) ping();   // おやすみ ちゅうは 20びょう ごと、ふだんは 1ぷん ごと
    if (S.screen === 'paused' && !paused(activeProfile())) applyControl(activeProfile(), null);  // じかんが きた
  }, 1000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') setTimeout(ping, 800); });
  return { ping, paused };
}
