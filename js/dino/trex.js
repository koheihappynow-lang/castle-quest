// ティラノサウルス（プログラムで作る試作）
// 体は「背骨にそった輪切り」をつないで作り、骨（ボーン）を入れて動かす
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
// 0→1→1→0 と動く 山形のカーブ
const env = (t, a, b, c, d) => (t < a || t > d) ? 0 : t < b ? sstep(a, b, t) : t < c ? 1 : 1 - sstep(c, d, t);

// ---------- うろこの でこぼこ（法線マップ） ----------
function scaleNormalMap(size = 256, cells = 18) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, size, size);
  const cw = size / cells;
  for (let r = 0; r < cells; r++) for (let q = 0; q < cells; q++) {
    const x = (q + (r % 2) * 0.5) * cw, y = (r + 0.5) * cw;
    const rad = cw * (0.5 + Math.random() * 0.18);
    for (const [dx, dy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]]) {
      const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad);
      gr.addColorStop(0, '#fff'); gr.addColorStop(0.6, '#999'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x + dx, y + dy, rad, 0, 7); g.fill();
    }
  }
  const src = g.getImageData(0, 0, size, size).data;
  const out = g.createImageData(size, size);
  const H = (x, y) => src[((((y + size) % size) * size) + ((x + size) % size)) * 4] / 255;
  const n = new THREE.Vector3();
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    n.set(-(H(x + 1, y) - H(x - 1, y)) * 2.5, -(H(x, y + 1) - H(x, y - 1)) * 2.5, 1).normalize();
    const i = (y * size + x) * 4;
    out.data[i] = (n.x * 0.5 + 0.5) * 255; out.data[i + 1] = (n.y * 0.5 + 0.5) * 255; out.data[i + 2] = (n.z * 0.5 + 0.5) * 255; out.data[i + 3] = 255;
  }
  g.putImageData(out, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---------- 輪切りを つないで 形を作る ----------
// frame(t) → {c: 中心, T: 進む向き}、prof(t) → {w: はば, h: 高さ}
function loft({ S, R, frame, prof, color, sqz = 0.85, under = 1, over = 1, skin, uvRep = [1, 1] }) {
  const pos = [], uv = [], col = [], idx = [], si = [], sw = [];
  const cc = new THREE.Color();
  const pushV = (p, u, v, t, ys) => {
    pos.push(p.x, p.y, p.z); uv.push(u * uvRep[0], v * uvRep[1]);
    color(t, ys, cc); col.push(cc.r, cc.g, cc.b);
    if (skin) { const [i0, i1, w0, w1] = skin(t); si.push(i0, i1, 0, 0); sw.push(w0, w1, 0, 0); }
  };
  const ends = [];
  for (let s = 0; s < S; s++) {
    const t = s / (S - 1);
    const { c, T } = frame(t);
    const { w, h } = prof(t);
    const side = new THREE.Vector3().crossVectors(T, UP).normalize();
    const up = new THREE.Vector3().crossVectors(side, T).normalize();
    for (let j = 0; j <= R; j++) {
      const a = -Math.PI / 2 + (j / R) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const xs = Math.sign(ca) * Math.pow(Math.abs(ca), sqz), ys = Math.sign(sa) * Math.pow(Math.abs(sa), sqz);
      const hh = ys < 0 ? h * under : h * over;
      pushV(c.clone().addScaledVector(side, w * xs).addScaledVector(up, hh * ys), t, j / R, t, ys);
    }
    if (s === 0 || s === S - 1) ends.push({ c, t });
  }
  for (let s = 0; s < S - 1; s++) for (let j = 0; j < R; j++) {
    const a = s * (R + 1) + j, b = a + R + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  // 両はしの ふた
  const base = pos.length / 3;
  pushV(ends[0].c, 0, 0.5, 0, 0); pushV(ends[1].c, 1, 0.5, 1, 0);
  const last = (S - 1) * (R + 1);
  for (let j = 0; j < R; j++) { idx.push(base, j, j + 1); idx.push(base + 1, last + j + 1, last + j); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  if (skin) {
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  }
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// 手足など：a から b への 太さの変わる つつ
function limbGeo(a, b, ra, rb, bulge = 0, seg = 14) {
  const L = a.distanceTo(b), pts = [];
  for (let k = 0; k <= 4; k++) { const th = -Math.PI / 2 + (k / 4) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.max(0.001, ra * Math.cos(th)), ra * Math.sin(th) * 0.8)); }
  for (let i = 1; i < 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(lerp(ra, rb, t) + bulge * Math.sin(Math.PI * t), t * L)); }
  for (let k = 0; k <= 4; k++) { const th = (k / 4) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.max(0.001, rb * Math.cos(th)), L + rb * Math.sin(th) * 0.8)); }
  const g = new THREE.LatheGeometry(pts, seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize()));
  g.translate(a.x, a.y, a.z);
  return colorize(g);
}

// 手足の 色（上が こく、下が うすい）
function colorize(g) {
  const n = g.attributes.normal, c = new THREE.Color(), arr = [];
  for (let i = 0; i < n.count; i++) { skinColor(0.9, n.getY(i) * 0.7 + 0.15, c); arr.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(arr, 3));
  return g;
}
// ---------- 色 ----------
const PAL = {
  back: new THREE.Color(0x45663a), side: new THREE.Color(0x7d9a4c), belly: new THREE.Color(0xe9dcb0),
  stripe: new THREE.Color(0x2f4a2a), babyBack: new THREE.Color(0x6f9a52),
};
function skinColor(t, ys, out, stripes = 0) {
  out.copy(PAL.belly).lerp(PAL.side, sstep(-0.55, -0.1, ys)).lerp(PAL.back, sstep(0.35, 0.85, ys));
  if (stripes && ys > 0.25) {
    const s = Math.sin(t * stripes);
    if (s > 0.45) out.lerp(PAL.stripe, 0.55 * sstep(0.25, 0.6, ys) * sstep(0.45, 0.75, s));
  }
  return out;
}

// ---------- ティラノサウルス ----------
// 背骨の ポイント：x, y, はば, 高さ, おなかの下がり
const SPINE = [
  [-6.2, 1.85, 0.03, 0.04, 0],
  [-5.3, 2.0, 0.10, 0.14, 0],
  [-4.4, 2.2, 0.17, 0.24, 0],
  [-3.5, 2.4, 0.25, 0.34, -0.02],
  [-2.6, 2.56, 0.34, 0.45, -0.04],
  [-1.7, 2.68, 0.44, 0.56, -0.06],
  [-0.8, 2.76, 0.55, 0.66, -0.08],
  [0.0, 2.8, 0.60, 0.74, -0.10], // こし（ここが 根もと）
  [0.8, 2.78, 0.66, 0.88, -0.2],
  [1.55, 2.72, 0.58, 0.78, -0.16],
  [2.15, 2.8, 0.46, 0.58, -0.06],
  [2.55, 3.02, 0.41, 0.48, -0.02],
  [2.85, 3.22, 0.37, 0.43, 0],
];
const HIP = 7;
const HEAD_L = 1.36;
const HEAD_KEYS = [[0.40, 0.46], [0.42, 0.50], [0.37, 0.46], [0.31, 0.41], [0.27, 0.36], [0.23, 0.31], [0.18, 0.25], [0.05, 0.07]];
const JAW_L = 1.18;
const JAW_KEYS = [[0.33, 0.16], [0.33, 0.17], [0.29, 0.15], [0.25, 0.13], [0.21, 0.115], [0.17, 0.095], [0.05, 0.04]];

function keyCurve(keys) { return new THREE.CatmullRomCurve3(keys.map(k => V(k[0], k[1], k[2] || 0)), false, 'catmullrom', 0.5); }

export class TRex {
  constructor() {
    this.group = new THREE.Group();
    this.growth = 0.5;
    this.actions = [];
    this.walking = false;
    this.walkPhase = 0;
    this.blinkAt = 2;
    this.onEvent = () => {};
    const nmap = scaleNormalMap();
    this.skinMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, normalMap: nmap, normalScale: new THREE.Vector2(0.4, 0.4) });
    const lmap = nmap.clone(); lmap.repeat.set(2, 1.5); lmap.needsUpdate = true;
    this.legMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, normalMap: lmap, normalScale: new THREE.Vector2(0.3, 0.3) });
    this.clawMat = new THREE.MeshStandardMaterial({ color: 0xece2c6, roughness: 0.35 });
    this.mouthMat = new THREE.MeshStandardMaterial({ color: 0xc85d68, roughness: 0.5 });
    this.build();
  }

  build() {
    const K = SPINE.length;
    const curve = keyCurve(SPINE.map(s => [s[0], s[1], 0]));
    const prof = keyCurve(SPINE.map(s => [s[2], s[3], s[4]]));
    // 骨
    this.bones = SPINE.map(() => new THREE.Bone());
    SPINE.forEach((s, i) => {
      const p = i === HIP ? null : i < HIP ? i + 1 : i - 1;
      if (p === null) this.bones[i].position.set(s[0], s[1], 0);
      else { this.bones[i].position.set(s[0] - SPINE[p][0], s[1] - SPINE[p][1], 0); this.bones[p].add(this.bones[i]); }
    });
    const geo = loft({
      S: 120, R: 28, sqz: 0.82, under: 1.0, over: 1.0, uvRep: [6, 1.5],
      frame: t => { const c = curve.getPoint(t); c.y += prof.getPoint(t).z; return { c, T: curve.getTangent(t) }; },
      prof: t => { const p = prof.getPoint(t); return { w: p.x, h: p.y }; },
      color: (t, ys, out) => skinColor(t, ys, out, t < 0.62 ? 70 : 0),
      skin: t => { const seg = t * (K - 1); const i0 = Math.min(K - 2, Math.floor(seg)); const f = sstep(0, 1, seg - i0); return [i0, i0 + 1, 1 - f, f]; },
    });
    const body = new THREE.SkinnedMesh(geo, this.skinMat);
    body.add(this.bones[HIP]);
    body.updateMatrixWorld(true);
    body.bind(new THREE.Skeleton(this.bones));
    body.castShadow = true; body.receiveShadow = true; body.frustumCulled = false;
    this.body = body;
    this.group.add(body);

    this.buildHead();
    this.legs = [-1, 1].map(s => this.buildLeg(s));
    this.arms = [-1, 1].map(s => this.buildArm(s));
    this.group.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  }

  buildHead() {
    const head = new THREE.Group();
    head.position.set(-0.12, -0.02, 0);
    head.rotation.z = -0.1;
    this.bones[SPINE.length - 1].add(head);
    this.head = head;
    const hp = keyCurve(HEAD_KEYS.map(k => [k[0], k[1], 0]));
    const hProf = t => { const p = hp.getPoint(t); return { w: p.x, h: p.y }; };
    const skull = loft({
      S: 48, R: 26, sqz: 0.72, under: 0.45, over: 1.0, uvRep: [3, 3],
      frame: t => { const h = hProf(t).h; return { c: V(t * HEAD_L, -0.2 + h * 0.45, 0), T: V(1, 0, 0) }; },
      prof: hProf,
      color: (t, ys, out) => skinColor(t, ys, out, 0),
    });
    head.add(new THREE.Mesh(skull, this.skinMat));
    // 口の中（上あご）
    const roof = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8), this.mouthMat);
    roof.scale.set(0.55, 0.025, 0.2); roof.position.set(0.65, -0.205, 0); head.add(roof);
    // 上の歯（小さめで かわいく）
    const toothG = new THREE.ConeGeometry(0.024, 0.075, 6); toothG.rotateX(Math.PI);
    for (let x = 0.42; x < 1.25; x += 0.1) {
      const w = hProf(x / HEAD_L).w * 0.82;
      for (const s of [-1, 1]) { const tm = new THREE.Mesh(toothG, this.clawMat); tm.position.set(x, -0.23, s * w); head.add(tm); }
    }
    // 下あご（ちょうつがいで 開く）
    const jaw = new THREE.Group(); jaw.position.set(0.12, -0.2, 0); head.add(jaw); this.jaw = jaw;
    const jp = keyCurve(JAW_KEYS.map(k => [k[0], k[1], 0]));
    const jProf = t => { const p = jp.getPoint(t); return { w: p.x, h: p.y }; };
    const jawGeo = loft({
      S: 36, R: 22, sqz: 0.8, under: 1.0, over: 0.35, uvRep: [3, 3],
      frame: t => { const h = jProf(t).h; return { c: V(0.05 + t * JAW_L - 0.12, -h * 0.35, 0), T: V(1, 0, 0) }; },
      prof: jProf,
      color: (t, ys, out) => { skinColor(t, ys * 0.6 - 0.25, out, 0); return out; },
    });
    jaw.add(new THREE.Mesh(jawGeo, this.skinMat));
    const tongue = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8), this.mouthMat);
    tongue.scale.set(0.45, 0.04, 0.15); tongue.position.set(0.42, 0.0, 0); jaw.add(tongue);
    for (let x = 0.4; x < 1.1; x += 0.12) {
      const w = jProf((x + 0.07) / JAW_L).w * 0.8;
      for (const s of [-1, 1]) { const tm = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 6), this.clawMat); tm.position.set(x - 0.05, 0.02, s * w); jaw.add(tm); }
    }
    // 目（少し大きめ＋光）
    const eyeMat = new THREE.MeshPhysicalMaterial({ color: 0xd8962a, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 });
    const pupilMat = new THREE.MeshPhysicalMaterial({ color: 0x120b05, roughness: 0.08, clearcoat: 1 });
    const hiMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.eyes = [];
    for (const s of [-1, 1]) {
      const eg = new THREE.Group(); eg.position.set(0.37, 0.25, s * 0.345); head.add(eg);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 16), eyeMat); eg.add(ball);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.058, 20, 14), pupilMat); pupil.position.set(0.022, 0.004, s * 0.05); eg.add(pupil);
      const hi = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), hiMat); hi.position.set(0.05, 0.04, s * 0.085); eg.add(hi);
      const hi2 = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), hiMat); hi2.position.set(0.0, -0.025, s * 0.095); eg.add(hi2);
      // まゆの でっぱり
      const brow = new THREE.Mesh(colorize(new THREE.SphereGeometry(1, 14, 10)), this.skinMat);
      brow.scale.set(0.16, 0.055, 0.08); brow.position.set(0.36, 0.36, s * 0.31); brow.rotation.z = -0.15; head.add(brow);
      // はなの あな
      const nos = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), pupilMat);
      nos.scale.set(0.04, 0.018, 0.02); nos.position.set(1.24, 0.06, s * 0.1); head.add(nos);
      this.eyes.push(eg);
    }
    this.snoutLocal = V(1.25, -0.28, 0);
  }

  buildLeg(s) {
    const hip = new THREE.Group(); hip.position.set(0.05, 2.45, s * 0.5); this.group.add(hip);
    const KNEE = V(0.38, -1.05, 0), ANK = V(-0.5, -0.9, 0), FOOT = V(0.18, -0.42, 0);
    hip.add(new THREE.Mesh(limbGeo(V(0, 0.2, 0), KNEE, 0.52, 0.22, 0.08), this.legMat));
    const knee = new THREE.Group(); knee.position.copy(KNEE); hip.add(knee);
    knee.add(new THREE.Mesh(limbGeo(V(0, 0, 0), ANK, 0.23, 0.13, 0.03), this.legMat));
    const ank = new THREE.Group(); ank.position.copy(ANK); knee.add(ank);
    ank.add(new THREE.Mesh(limbGeo(V(0, 0, 0), FOOT, 0.12, 0.09), this.legMat));
    const foot = new THREE.Group(); foot.position.copy(FOOT); ank.add(foot);
    for (const [a, L] of [[-0.42, 0.42], [0, 0.52], [0.42, 0.42]]) {
      const dir = V(Math.cos(a), -0.12, Math.sin(a) * s * -1).normalize();
      const tip = dir.clone().multiplyScalar(L);
      foot.add(new THREE.Mesh(limbGeo(V(0, 0, 0), tip, 0.085, 0.055), this.legMat));
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 8), this.clawMat);
      claw.quaternion.setFromUnitVectors(UP, V(dir.x, -0.35, dir.z).normalize());
      claw.position.copy(tip).addScaledVector(dir, 0.05); foot.add(claw);
    }
    return { hip, knee, ank, foot, s };
  }

  buildArm(s) {
    const sh = new THREE.Group(); sh.position.set(0.25, -0.35, s * 0.42); this.bones[9].add(sh);
    const EL = V(0.12, -0.3, s * 0.05);
    sh.add(new THREE.Mesh(limbGeo(V(0, 0, 0), EL, 0.09, 0.065), this.legMat));
    const el = new THREE.Group(); el.position.copy(EL); sh.add(el);
    const WR = V(0.26, -0.04, 0);
    el.add(new THREE.Mesh(limbGeo(V(0, 0, 0), WR, 0.065, 0.05), this.legMat));
    for (const dz of [-0.03, 0.03]) {
      const tip = V(0.12, -0.06, dz);
      el.add(new THREE.Mesh(limbGeo(WR, WR.clone().add(tip), 0.03, 0.022), this.legMat));
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.07, 6), this.clawMat);
      claw.quaternion.setFromUnitVectors(UP, V(0.4, -1, 0).normalize());
      claw.position.copy(WR).add(tip).add(V(0.02, -0.04, 0)); el.add(claw);
    }
    return { sh, el };
  }

  // 大きさ（0 = あかちゃん、1 = おとな）
  setGrowth(g) {
    this.growth = Math.min(1, Math.max(0, g));
    const k = this.growth;
    this.group.scale.setScalar(lerp(0.17, 0.58, k));
    this.head.scale.setScalar(1.3 + 0.45 * (1 - k));
    this.eyeScale = 1 + 0.55 * (1 - k);
  }
  stage() {
    const g = this.growth;
    return g < 0.25 ? 'あかちゃん' : g < 0.5 ? 'こども' : g < 0.8 ? 'わかもの' : 'おとな';
  }

  play(type, opts = {}) {
    const dur = { pet: 1.9, feed: 3.4, roar: 2.6 }[type];
    this.actions = this.actions.filter(a => a.type !== type);
    const a = { type, t: 0, dur, fired: {}, ...opts };
    if (type === 'feed') a.reach = this.findReach(opts.foodY ?? 0.15);
    this.actions.push(a);
    return a;
  }
  busy() { return this.actions.length > 0; }

  // えさを食べる姿勢で、口がどこに来るか
  pose(p) {
    const b = this.bones;
    b[HIP].rotation.z = p.pitch;
    b[HIP].position.y = SPINE[HIP][1] + p.bob;
    for (const i of [10, 11, 12]) b[i].rotation.z = p.neckZ / 3;
    b[12].rotation.y = p.neckY;
    b[11].rotation.y = p.neckY * 0.5;
    this.head.rotation.x = p.roll;
    this.jaw.rotation.z = -p.jaw;
    for (let i = 0; i < HIP; i++) {
      const k = HIP - 1 - i;
      b[i].rotation.y = p.tailAmp * Math.sin(p.tt * p.tailSpeed - k * 0.55);
      b[i].rotation.z = p.tailLift / HIP + 0.012 * Math.sin(p.tt * 0.8 - k * 0.4);
    }
    for (const L of this.legs) {
      const ph = p.walk ? p.wphase + (L.s > 0 ? Math.PI : 0) : 0;
      const sw = p.walk ? Math.sin(ph) : 0, lift = p.walk ? Math.max(0, Math.cos(ph)) : 0;
      L.hip.rotation.z = 0.36 * sw * p.walk - p.pitch * 0.25;
      L.knee.rotation.z = -0.5 * lift * p.walk;
      L.ank.rotation.z = (-0.36 * sw * 0.6 + 0.45 * lift) * p.walk;
      L.foot.rotation.z = -(L.hip.rotation.z + L.knee.rotation.z + L.ank.rotation.z) * 0.9;
    }
    for (const A of this.arms) { A.sh.rotation.z = p.arm; A.el.rotation.z = p.arm * 0.6; }
  }
  basePose(tt) {
    return {
      tt, pitch: 0, bob: 0.02 * Math.sin(tt * 2.1), neckZ: 0.05 * Math.sin(tt * 0.6), neckY: 0.22 * Math.sin(tt * 0.37) + 0.08 * Math.sin(tt * 0.93),
      roll: 0, jaw: 0.015 + 0.015 * Math.sin(tt * 2.1), tailAmp: 0.05, tailSpeed: 1.3, tailLift: 0, walk: 0, wphase: 0, arm: 0.08 * Math.sin(tt * 1.7),
    };
  }
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
    for (const eg of this.eyes) { eg.scale.set(this.eyeScale, this.eyeScale * Math.min(blink, eyeSquint), this.eyeScale); }
  }
}
