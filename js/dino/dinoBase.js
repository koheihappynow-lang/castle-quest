// 恐竜の 動きの 共通部分（プログラム製の 恐竜も、AIで作った GLB の 恐竜も これで 動かす）
// 必要なもの：group、bones、rig = { hip, hipRestY, neck: [...], tail: [こしに 近い順], yaw: [...] }、
//            head、jaw（なくてもよい）、legs: [{hip, knee, ank, foot, s}]、arms、eyes（なくてもよい）、snoutLocal
import * as THREE from 'three';
import { lookFor, stageOf } from '../dinos.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const env = (t, a, b, c, d) => (t < a || t > d) ? 0 : t < b ? sstep(a, b, t) : t < c ? 1 : 1 - sstep(c, d, t);

export class DinoBase {
  constructor({ scale = [0.17, 0.58], headScale = [1.75, 1.3], eyeScale = [1.55, 1] } = {}) {
    this.group = new THREE.Group();
    this.cfg = { scale, headScale, eyeScale };
    this.growth = 0.5;
    this.actions = [];
    this.walking = false;
    this.walkPhase = 0;
    this.blinkAt = 2;
    this.eyes = [];
    this.arms = [];
    this.legs = [];
    this.jawRest = 0;
    this.onEvent = () => {};
  }

  // 大きさ（0 = あかちゃん、1 = おとな）
  setGrowth(g) {
    this.growth = Math.min(1, Math.max(0, g));
    const k = this.growth, c = this.cfg;
    this.group.scale.setScalar(lerp(c.scale[0], c.scale[1], k));
    this.head?.scale.setScalar(lerp(c.headScale[0], c.headScale[1], k));
    this.eyeScale = lerp(c.eyeScale[0], c.eyeScale[1], k);
    this.look?.set(lookFor(k * 100));
  }
  stage() { return stageOf(this.growth * 100).name; }

  play(type, opts = {}) {
    const dur = { pet: 1.9, feed: 3.4, roar: 2.6 }[type];
    this.actions = this.actions.filter(a => a.type !== type);
    const a = { type, t: 0, dur, fired: {}, ...opts };
    if (type === 'feed') a.reach = this.findReach(opts.foodY ?? 0.15);
    this.actions.push(a);
    return a;
  }
  busy() { return this.actions.length > 0; }

  pose(p) {
    const b = this.bones, r = this.rig;
    b[r.hip].rotation.z = p.pitch;
    b[r.hip].position.y = r.hipRestY + p.bob;
    for (const i of r.neck) b[i].rotation.z = p.neckZ / r.neck.length;
    r.yaw.forEach((i, n) => { b[i].rotation.y = p.neckY * (n === r.yaw.length - 1 ? 1 : 0.5); });
    if (this.head) this.head.rotation.x = p.roll;
    if (this.jaw) this.jaw.rotation.z = this.jawRest - p.jaw * (this.jawMul ?? 1);
    const T = r.tail.length;
    r.tail.forEach((i, k) => {
      b[i].rotation.y = p.tailAmp * Math.sin(p.tt * p.tailSpeed - k * 0.55);
      b[i].rotation.z = p.tailLift / T + 0.012 * Math.sin(p.tt * 0.8 - k * 0.4);
    });
    for (const L of this.legs) {
      const ph = p.walk ? p.wphase + (L.s > 0 ? Math.PI : 0) : 0;
      const sw = p.walk ? Math.sin(ph) : 0, lift = p.walk ? Math.max(0, Math.cos(ph)) : 0;
      L.hip.rotation.z = 0.36 * sw * p.walk - p.pitch * 0.25;
      L.knee.rotation.z = -0.5 * lift * p.walk;
      L.ank.rotation.z = (-0.36 * sw * 0.6 + 0.45 * lift) * p.walk;
      if (L.foot) L.foot.rotation.z = -(L.hip.rotation.z + L.knee.rotation.z + L.ank.rotation.z) * 0.9;
    }
    for (const A of this.arms) { A.sh.rotation.z = p.arm; if (A.el) A.el.rotation.z = p.arm * 0.6; }
  }
  basePose(tt) {
    return {
      tt, pitch: 0, bob: 0.02 * Math.sin(tt * 2.1), neckZ: 0.05 * Math.sin(tt * 0.6), neckY: 0.22 * Math.sin(tt * 0.37) + 0.08 * Math.sin(tt * 0.93),
      roll: 0, jaw: 0.015 + 0.015 * Math.sin(tt * 2.1), tailAmp: 0.05, tailSpeed: 1.3, tailLift: 0, walk: 0, wphase: 0, arm: 0.08 * Math.sin(tt * 1.7),
    };
  }
  // えさを食べる姿勢で、口がどこに来るか（地面の えさに とどく 曲げぐあいを さがす）
  findReach(foodY) {
    const save = this.group.position.y;
    let lo = 0, hi = 1.6, best = 1;
    const snout = V();
    for (let it = 0; it < 14; it++) {
      const e = (lo + hi) / 2;
      const p = this.basePose(0); p.pitch = -0.42 * e; p.neckZ = -0.7 * e; p.tailLift = 0.25 * e; p.neckY = 0;
      this.pose(p);
      this.group.updateMatrixWorld(true);
      this.head.localToWorld(snout.copy(this.snoutLocal));
      best = e;
      if (snout.y > foodY) lo = e; else hi = e;
    }
    this.group.position.y = save;
    return { e: best, snout: snout.clone() };
  }

  update(tt, dt) {
    const p = this.basePose(tt);
    if (this.walking && !this.actions.length) {
      this.walkPhase += dt * 5.2;
      p.walk = 1; p.wphase = this.walkPhase;
      p.bob += 0.06 * Math.abs(Math.cos(this.walkPhase));
      p.tailAmp = 0.09; p.tailSpeed = 2.6; p.neckY *= 0.4;
    }
    let hop = 0, eyeSquint = 1;
    for (const a of this.actions) {
      a.t += dt;
      const t = a.t;
      if (a.type === 'pet') {
        const e = env(t, 0, 0.2, 1.5, a.dur);
        hop = 0.5 * Math.abs(Math.sin(t * 7.5)) * (t < 1.25 ? 1 : 0);
        p.roll = 0.28 * Math.sin(t * 5) * e;
        p.tailAmp = lerp(p.tailAmp, 0.3, e); p.tailSpeed = lerp(p.tailSpeed, 11, e);
        p.neckZ += 0.2 * e; p.arm += 0.5 * e * Math.abs(Math.sin(t * 7.5));
        eyeSquint = lerp(1, 0.25, e);
        p.jaw = lerp(p.jaw, 0.25, e);
      } else if (a.type === 'feed') {
        const e = env(t, 0.1, 0.8, 2.6, a.dur) * a.reach.e;
        p.pitch = -0.42 * e; p.neckZ = -0.7 * e; p.tailLift = 0.25 * e; p.neckY *= (1 - Math.min(1, e * 2));
        if (t > 0.6 && t < 0.85) p.jaw = 0.5 * sstep(0.6, 0.8, t);
        else if (t >= 0.85 && t < 2.5) p.jaw = 0.22 * (0.5 - 0.5 * Math.cos((t - 0.85) * 15));
        if (t > 0.88 && !a.fired.bite) { a.fired.bite = 1; this.onEvent('bite'); }
        if (t > 2.6) eyeSquint = lerp(1, 0.3, env(t, 2.6, 2.8, 3.2, a.dur));
      } else if (a.type === 'roar') {
        const e = env(t, 0, 0.45, 1.9, a.dur);
        p.pitch = 0.1 * e; p.neckZ = 0.4 * e; p.jaw = 0.8 * e; p.neckY = p.neckY * (1 - e) + 0.06 * Math.sin(t * 38) * e;
        p.tailAmp = lerp(p.tailAmp, 0.12, e); p.tailLift = -0.15 * e; p.arm += 0.4 * e;
        if (t > 0.3 && !a.fired.roar) { a.fired.roar = 1; this.onEvent('roar'); }
      }
    }
    const finished = this.actions.filter(a => a.t >= a.dur);
    this.actions = this.actions.filter(a => a.t < a.dur);
    finished.forEach(a => this.onEvent('done', a));
    this.pose(p);
    this.group.position.y = hop * this.group.scale.y;
    // まばたき
    let blink = 1;
    if (tt > this.blinkAt) { const k = tt - this.blinkAt; blink = k < 0.14 ? 0.12 : 1; if (k > 0.14) this.blinkAt = tt + 2 + Math.random() * 3.5; }
    for (const eg of this.eyes) eg.scale.set(this.eyeScale, this.eyeScale * Math.min(blink, eyeSquint), this.eyeScale);
  }
}
