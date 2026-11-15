// 効果音（ファイルを使わず、その場で音を作る）
let ctx = null;
function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function tone(freq, start, dur, { type = 'sine', vol = 0.18, slide = 0 } = {}) {
  const a = ac(); if (!a) return;
  const t0 = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}
export const sfx = {
  unlock() { ac(); },
  tap() { tone(660, 0, 0.08, { type: 'triangle', vol: 0.08 }); },
  correct() { tone(784, 0, 0.15, { type: 'triangle' }); tone(1047, 0.12, 0.3, { type: 'triangle' }); },
  wrong() { tone(330, 0, 0.18, { type: 'sine', vol: 0.12 }); tone(262, 0.15, 0.3, { type: 'sine', vol: 0.12 }); },
  coin() { tone(1319, 0, 0.08, { type: 'square', vol: 0.05 }); tone(1976, 0.07, 0.25, { type: 'square', vol: 0.05 }); },
  bonus() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.08, 0.2, { type: 'triangle', vol: 0.12 })); },
  build() { tone(110, 0, 0.6, { type: 'sawtooth', vol: 0.06, slide: 2 }); tone(523, 0.45, 0.25, { type: 'triangle' }); tone(784, 0.6, 0.4, { type: 'triangle' }); },
  fanfare() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.16, i === 5 ? 0.8 : 0.2, { type: 'triangle', vol: 0.15 })); },
  ghost() { tone(880, 0, 0.5, { type: 'sine', vol: 0.1, slide: 1.5 }); tone(1320, 0.3, 0.5, { type: 'sine', vol: 0.1 }); },
};
