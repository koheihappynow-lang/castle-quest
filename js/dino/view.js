// ダイナソークエスト：恐竜の おせわ画面の 3D（島・すみか・かざり・えさ）
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { initAssets, M, TEX, Batch, palm, roundTree, rr, setSeed } from '../diorama/engine.js';
import { TRex } from './trex.js';
import { stageOf } from '../dinos.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };
const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra });

// ---------- 音 ----------
let ac = null;
const audio = () => { try { return (ac ??= new (window.AudioContext || window.webkitAudioContext)()); } catch (e) { return null; } };
function chirp(f0 = 600, f1 = 1100, d = 0.18, type = 'sine', vol = 0.16, delay = 0) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.05);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + 0.1);
}
function roarSound(growth) {
  const a = audio(); if (!a) return;
  const t = a.currentTime, pitch = 1.6 - growth;
  const o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(140 * pitch, t); o.frequency.linearRampToValueAtTime(220 * pitch, t + 0.25); o.frequency.exponentialRampToValueAtTime(70 * pitch, t + 1.3);
  f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 6;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
  const lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = 28; lg.gain.value = 30 * pitch; lfo.connect(lg).connect(o.frequency);
  o.connect(f).connect(g).connect(a.destination); o.start(t); lfo.start(t); o.stop(t + 1.5); lfo.stop(t + 1.5);
}

function spriteTex(ch, color) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); g.fillStyle = color; g.font = '110px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- えさの 形 ----------
function foodMesh(kind) {
  const g = new THREE.Group();
  if (kind === 'meat' || kind === 'feast') {
    const big = kind === 'feast';
    const meat = mesh(new THREE.SphereGeometry(big ? 0.38 : 0.28, 18, 14), std(big ? 0xc0582f : 0xa4482c, { roughness: 0.5 }), 0.12, 0, 0); meat.scale.set(1.35, 1, 1); g.add(meat);
    const bone = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 10), M.white, -0.32, 0, 0); bone.rotation.z = Math.PI / 2; g.add(bone);
    for (const dz of [-0.05, 0.05]) g.add(mesh(new THREE.SphereGeometry(0.075, 10, 8), M.white, -0.58, 0, dz));
    if (big) { const plate = mesh(new THREE.CylinderGeometry(0.6, 0.5, 0.06, 24), M.gold, 0, -0.3, 0); g.add(plate); }
  } else if (kind === 'fish') {
    const b = mesh(new THREE.SphereGeometry(0.25, 16, 12), std(0x7fa8c9, { roughness: 0.35, metalness: 0.2 })); b.scale.set(1.6, 0.8, 0.5); g.add(b);
    const tail = mesh(new THREE.ConeGeometry(0.2, 0.3, 4), std(0x6a92b5)); tail.rotation.z = Math.PI / 2; tail.position.x = -0.5; g.add(tail);
  } else {
    const col = { fern: 0x4f8a3a, leaves: 0x6aa548, cycad: 0x8a5a2b }[kind] || 0x4f8a3a;
    for (let i = 0; i < 7; i++) { const l = mesh(new THREE.ConeGeometry(0.12, 0.8, 4), std(col)); l.scale.z = 0.25; l.rotation.z = Math.PI / 2 - 0.3 + i * 0.1; l.rotation.y = i * 0.9; l.position.y = 0.1; g.add(l); }
  }
  return g;
}

// ---------- かざり（ティラノの 体の どこに つけるか） ----------
function accessoryMesh(id) {
  const g = new THREE.Group();
  if (id === 'ribbon') {
    const m = std(0xff5a9a, { roughness: 0.5 });
    for (const s of [-1, 1]) { const c = mesh(new THREE.ConeGeometry(0.11, 0.2, 12), m, 0, 0, s * 0.1); c.rotation.x = s * Math.PI / 2; g.add(c); }
    g.add(mesh(new THREE.SphereGeometry(0.05, 10, 8), m));
    g.position.set(0.12, 0.52, 0); g.rotation.z = 0.3;
  } else if (id === 'cap') {
    const m = std(0x2f6fd8, { roughness: 0.6 });
    const dome = mesh(new THREE.SphereGeometry(0.26, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), m); g.add(dome);
    const brim = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 18, 1, false, -Math.PI / 2, Math.PI), m, 0.18, 0, 0); g.add(brim);
    g.add(mesh(new THREE.SphereGeometry(0.035, 8, 6), std(0xffffff), 0, 0.26, 0));
    g.position.set(0.32, 0.47, 0); g.rotation.z = -0.08;
  } else if (id === 'crown') {
    const ring = mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.12, 20, 1, true), M.gold); ring.material = M.gold; g.add(ring);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const sp = mesh(new THREE.ConeGeometry(0.04, 0.14, 6), M.gold, Math.cos(a) * 0.2, 0.12, Math.sin(a) * 0.2); g.add(sp); g.add(mesh(new THREE.SphereGeometry(0.025, 8, 6), std(0xe8304a, { roughness: 0.2 }), Math.cos(a) * 0.21, 0.02, Math.sin(a) * 0.21)); }
    g.position.set(0.3, 0.56, 0);
  } else if (id === 'flower') {
    const cols = [0xffd23f, 0xff7aa8, 0xffffff, 0xa06bff];
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; g.add(mesh(new THREE.SphereGeometry(0.06, 8, 6), std(cols[i % 4]), Math.cos(a) * 0.26, 0, Math.sin(a) * 0.22)); }
    g.add(mesh(new THREE.TorusGeometry(0.24, 0.025, 6, 24), std(0x4f8a3a))).rotation.x = Math.PI / 2;
    g.position.set(0.3, 0.48, 0);
  } else if (id === 'glasses') {
    const m = std(0x111111, { roughness: 0.15, metalness: 0.4 });
    for (const s of [-1, 1]) { const lens = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 20), m, 0.42, 0.26, s * 0.4); lens.rotation.x = Math.PI / 2; g.add(lens); }
    const bridge = mesh(new THREE.TorusGeometry(0.4, 0.015, 6, 20, Math.PI), m, 0.46, 0.26, 0); bridge.rotation.y = Math.PI / 2; bridge.scale.set(1, 0.45, 1); g.add(bridge);
  } else if (id === 'scarf') {
    const m = std(0xd93a3a, { roughness: 0.9 });
    const ring = mesh(new THREE.TorusGeometry(0.47, 0.11, 10, 28), m); ring.rotation.y = Math.PI / 2; ring.scale.set(1, 1.1, 1); g.add(ring);
    const tail = mesh(new THREE.BoxGeometry(0.08, 0.5, 0.18), m, 0.15, -0.55, 0.3); tail.rotation.x = 0.2; g.add(tail);
    g.position.set(0.05, -0.02, 0);
  } else if (id === 'bell') {
    const ring = mesh(new THREE.TorusGeometry(0.45, 0.04, 8, 28), std(0xd93a3a)); ring.rotation.y = Math.PI / 2; ring.scale.set(1, 1.1, 1); g.add(ring);
    g.add(mesh(new THREE.SphereGeometry(0.1, 14, 10), M.gold, 0.05, -0.55, 0));
    g.position.set(0.2, -0.02, 0);
  } else if (id === 'cape') {
    const geo = new THREE.CylinderGeometry(0.95, 0.95, 1.6, 20, 1, true, -Math.PI * 0.42, Math.PI * 0.84);
    geo.rotateZ(Math.PI / 2);
    const cape = mesh(geo, std(0xc0202f, { side: THREE.DoubleSide, roughness: 0.7 }), -0.3, 0.05, 0); g.add(cape);
  }
  return g;
}
const ACC_ANCHOR = { ribbon: 'head', cap: 'head', crown: 'head', flower: 'head', glasses: 'head', scarf: 'neck', bell: 'neck', cape: 'back' };

export class DinoView {
  constructor() {
    initAssets();
    setSeed(11);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false });
    this.renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    this.camera.position.set(4.6, 2.8, 6.8);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0.3, 1.2, 0);
    this.controls.enableDamping = true; this.controls.enablePan = false;
    this.controls.maxPolarAngle = 1.45; this.controls.minDistance = 2.5; this.controls.maxDistance = 20;
    this.clock = new THREE.Clock();
    this.tt = 0;
    this.floaters = [];
    this.heart = spriteTex('♥', '#ff5a8a');
    this.star = spriteTex('★', '#ffd84a');
    this.onTapDino = () => {};
    this.onBite = () => {};
    this.onStageUp = () => {};
    this.buildWorld();
    this.buildHome();
    this.bindTap();
  }

  buildWorld() {
    const s = this.scene;
    const c = document.createElement('canvas'); c.width = 4; c.height = 256;
    const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#5fb2e8'); gr.addColorStop(0.55, '#bfe6f5'); gr.addColorStop(1, '#f4f0d8');
    g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; s.background = t;
    s.fog = new THREE.Fog(0xcfeaf2, 30, 70);
    const pm = new THREE.PMREMGenerator(this.renderer);
    s.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    s.environmentIntensity = 0.45;
    s.add(new THREE.HemisphereLight(0xe4f4ff, 0x6c7a3e, 0.9));
    const sun = new THREE.DirectionalLight(0xfff1d6, 3.0);
    sun.position.set(8, 14, 6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; s.add(sun);

    const world = new THREE.Group(); s.add(world); this.world = world;
    const grassMat = M.grass.clone(); grassMat.map = TEX.grass.clone(); grassMat.map.repeat.set(5, 5); grassMat.map.needsUpdate = true;
    const top = mesh(new THREE.CircleGeometry(11, 64), grassMat); top.rotation.x = -Math.PI / 2; top.castShadow = false; world.add(top);
    world.add(mesh(new THREE.CylinderGeometry(11, 10.2, 1.6, 64, 1, true), M.mud, 0, -0.8, 0));
    const b = new Batch();
    for (const [x, z, sc] of [[-8.6, -5.4, 1.25], [-6.2, -8.0, 1.0], [8.2, -5.8, 1.15], [9.2, 1.0, 0.95], [-9.3, 0.6, 1.1], [-2.4, -9.6, 1.2], [3.4, -9.4, 0.9], [8.0, 5.6, 1.0], [-8.0, 5.8, 1.05]]) palm(b, x, 0, z, sc);
    for (const [x, z, sc] of [[-9.6, -2.6, 1.3], [7.0, -8.0, 1.0], [0.4, -10.0, 1.2]]) roundTree(b, x, 0, z, sc);
    b.build(world);
    // 火山と 山
    const volc = mesh(new THREE.CylinderGeometry(2.2, 9, 9, 24, 4), std(0x7b5e4c, { roughness: 0.95, flatShading: true }), -10, 3.6, -26); volc.castShadow = false; s.add(volc);
    const lava = new THREE.Mesh(new THREE.CircleGeometry(2.1, 24), new THREE.MeshBasicMaterial({ color: 0xff7a2a })); lava.rotation.x = -Math.PI / 2; lava.position.set(-10, 8.12, -26); s.add(lava);
    this.smokeN = 26; this.smokeP = new Float32Array(this.smokeN * 3); this.smokeL = Array.from({ length: this.smokeN }, () => Math.random());
    this.smokeG = new THREE.BufferGeometry(); this.smokeG.setAttribute('position', new THREE.BufferAttribute(this.smokeP, 3));
    s.add(new THREE.Points(this.smokeG, new THREE.PointsMaterial({ map: TEX.dot, size: 4.5, color: 0xf2f2f2, transparent: true, opacity: 0.55, depthWrite: false })));
    for (const [x, z, r, h] of [[14, -30, 9, 7], [26, -24, 8, 5], [-26, -22, 9, 6], [4, -36, 10, 8]]) { const m = mesh(new THREE.ConeGeometry(r, h, 9), M.mountainGrey ?? M.mountain, x, h / 2 - 0.5, z); m.castShadow = false; s.add(m); }
  }

  // ---------- すみか（10だんかい × 3） ----------
  buildHome() {
    const H = []; this.homeStages = H;
    const stage = () => { const g = new THREE.Group(); this.world.add(g); H.push(g); return g; };
    const part = (g, fill) => { const p = new THREE.Group(); fill(p); g.add(p); p.visible = false; return p; };
    const wood = M.wood, straw = M.straw;
    // 1 じめんを ならす
    let g = stage();
    part(g, p => { const d = mesh(new THREE.CircleGeometry(5.6, 48), std(0xc9b48a, { roughness: 1 }), 0, 0.012, 0); d.rotation.x = -Math.PI / 2; d.castShadow = false; p.add(d); });
    part(g, p => { for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2; p.add(mesh(new THREE.DodecahedronGeometry(rr(0.14, 0.24), 0), M.rock, Math.cos(a) * 5.7, 0.05, Math.sin(a) * 5.7)); } });
    part(g, p => { const path = mesh(new THREE.PlaneGeometry(1.6, 5), std(0xc9b48a, { roughness: 1 }), 4.6, 0.014, 6.2); path.rotation.x = -Math.PI / 2; path.rotation.z = -0.62; path.castShadow = false; p.add(path); });
    // 2 さく
    g = stage();
    for (let k = 0; k < 3; k++) part(g, p => {
      const a0 = -0.5 + k * 2.0, a1 = a0 + 1.85;
      for (let a = a0; a <= a1 + 0.001; a += 0.31) { p.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.1, 7), wood, Math.cos(a) * 7.2, 0.55, Math.sin(a) * 7.2)); }
      for (const y of [0.45, 0.85]) for (let a = a0; a < a1; a += 0.31) {
        const p1 = V(Math.cos(a) * 7.2, y, Math.sin(a) * 7.2), p2 = V(Math.cos(a + 0.31) * 7.2, y, Math.sin(a + 0.31) * 7.2);
        const r = mesh(new THREE.CylinderGeometry(0.05, 0.05, p1.distanceTo(p2), 6), wood); r.position.copy(p1).lerp(p2, 0.5); r.quaternion.setFromUnitVectors(V(0, 1, 0), p2.clone().sub(p1).normalize()); p.add(r);
      }
    });
    // 3 みずのみば
    g = stage();
    const PX = -4.2, PZ = -2.6;
    part(g, p => { for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; p.add(mesh(new THREE.DodecahedronGeometry(rr(0.2, 0.34), 0), M.rock, PX + Math.cos(a) * 1.7, 0.06, PZ + Math.sin(a) * 1.7)); } });
    part(g, p => { const w = mesh(new THREE.CircleGeometry(1.65, 36), M.water, PX, 0.04, PZ); w.rotation.x = -Math.PI / 2; w.castShadow = false; p.add(w); });
    part(g, p => { for (let i = 0; i < 9; i++) { const a = 2.2 + i * 0.16; const r = mesh(new THREE.CylinderGeometry(0.02, 0.03, rr(0.6, 1.0), 5), std(0x5d8a3a), PX + Math.cos(a) * 1.85, 0.4, PZ + Math.sin(a) * 1.85); r.rotation.z = rr(-0.2, 0.2); p.add(r); } });
    // 4 ねどこ
    g = stage();
    const NX = 3.8, NZ = -3.2;
    part(g, p => { const d = mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.12, 24), std(0xc9a46a, { roughness: 1 }), NX, 0.06, NZ); p.add(d); });
    part(g, p => { const t = mesh(new THREE.TorusGeometry(1.0, 0.3, 10, 26), straw, NX, 0.25, NZ); t.rotation.x = Math.PI / 2; p.add(t); });
    part(g, p => { for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const l = mesh(new THREE.ConeGeometry(0.12, 0.7, 4), std(0x6aa548), NX + Math.cos(a) * 1.2, 0.35, NZ + Math.sin(a) * 1.2); l.rotation.z = Math.cos(a) * 0.8; l.rotation.x = -Math.sin(a) * 0.8; p.add(l); } });
    // 5 きと シダ
    g = stage();
    const trees = [[[-6.0, 1.0], [-5.4, -5.0]], [[5.8, -1.2], [1.0, -6.2]], [[-2.6, -5.8], [6.0, 2.6]]];
    for (const set of trees) part(g, p => { const bb = new Batch(); for (const [x, z] of set) palm(bb, x, 0, z, rr(0.8, 1.0)); bb.build(p); for (const [x, z] of set) this.fern(p, x + rr(-0.8, 0.8), z + rr(0.6, 1.2), rr(0.7, 1.0)); });
    // 6 いわと ほらあな
    g = stage();
    const CX = -5.0, CZ = 3.4;
    part(g, p => { for (const [x, z, sc] of [[0, 0, 0.9], [0.9, 0.4, 0.6], [-0.8, 0.5, 0.55]]) p.add(mesh(new THREE.DodecahedronGeometry(sc, 1), M.rock, CX + x, sc * 0.4, CZ + z)); });
    part(g, p => { const arch = mesh(new THREE.TorusGeometry(1.1, 0.45, 8, 18, Math.PI), M.rock, CX + 0.3, 0, CZ - 0.6); arch.rotation.y = 0.9; p.add(arch); const dark = mesh(new THREE.CircleGeometry(0.85, 18, 0, Math.PI), std(0x2a2420), CX + 0.3, 0.02, CZ - 0.6); dark.rotation.y = 0.9; p.add(dark); });
    part(g, p => { for (let i = 0; i < 8; i++) p.add(mesh(new THREE.SphereGeometry(rr(0.12, 0.22), 8, 6), std(0x5d8f3a), CX + rr(-1.2, 1.2), rr(0.4, 1.2), CZ + rr(-1.0, 0.6))); });
    // 7 ひよけの やね
    g = stage();
    const RX = 4.4, RZ = 2.4;
    part(g, p => { for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) p.add(mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.4, 7), wood, RX + x * 1.1, 1.2, RZ + z * 0.9)); });
    part(g, p => { for (const z of [-1, 1]) p.add(mesh(new THREE.BoxGeometry(2.6, 0.12, 0.14), wood, RX, 2.4, RZ + z * 0.9)); });
    part(g, p => { const roof = mesh(new THREE.BoxGeometry(2.9, 0.1, 2.4), straw, RX, 2.55, RZ); roof.rotation.x = 0.12; p.add(roof); });
    // 8 えさば
    g = stage();
    const FX = -2.8, FZ = 4.6;
    part(g, p => { p.add(mesh(new THREE.BoxGeometry(1.6, 0.35, 0.7), wood, FX, 0.18, FZ)); p.add(mesh(new THREE.BoxGeometry(1.4, 0.06, 0.5), std(0x3a2a1a), FX, 0.34, FZ)); });
    part(g, p => { for (let i = 0; i < 5; i++) p.add(mesh(new THREE.SphereGeometry(0.12, 10, 8), std(0xa4482c), FX - 0.5 + i * 0.25, 0.42, FZ + rr(-0.1, 0.1))); });
    part(g, p => { p.add(mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.5, 14), wood, FX + 1.2, 0.25, FZ + 0.2)); });
    // 9 あそびば
    g = stage();
    part(g, p => { const log = mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.2, 12), M.trunk ?? wood, 1.4, 0.3, 5.2); log.rotation.z = Math.PI / 2; log.rotation.y = 0.4; p.add(log); });
    part(g, p => { const ballMat = new THREE.MeshStandardMaterial({ map: this.stripeTex(), roughness: 0.4 }); const ball = mesh(new THREE.SphereGeometry(0.45, 24, 16), ballMat, 3.0, 0.45, 4.6); p.add(ball); this.ball = ball; });
    part(g, p => { for (let i = 0; i < 4; i++) p.add(mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.2 + i * 0.18, 10), M.rock, -0.6 + i * 0.75, 0.1 + i * 0.09, 6.0)); });
    // 10 かんばんと ライト
    g = stage();
    part(g, p => { this.signBoard = p; });
    for (let k = 0; k < 2; k++) part(g, p => {
      const glows = [];
      for (let i = 0; i < 5; i++) {
        const a = -0.4 + k * 3.1 + i * 0.55, x = Math.cos(a) * 6.6, z = Math.sin(a) * 6.6;
        p.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.5, 6), M.iron ?? wood, x, 0.75, z));
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xffb84a, emissiveIntensity: 1.4 }));
        lamp.position.set(x, 1.55, z); p.add(lamp); glows.push([x, 1.55, z]);
      }
    });
    this.homeN = -1;
  }
  fern(parent, x, z, sc) {
    const g = new THREE.Group();
    const mats = [std(0x4f8a3a, { side: THREE.DoubleSide }), std(0x6aa548, { side: THREE.DoubleSide })];
    for (let i = 0; i < 9; i++) {
      const leaf = new THREE.PlaneGeometry(0.28, 1.3, 1, 6);
      const p = leaf.attributes.position;
      for (let k = 0; k < p.count; k++) { const y = p.getY(k) + 0.65; p.setX(k, p.getX(k) * Math.sin((y / 1.3) * Math.PI) * 1.4); p.setZ(k, -0.35 * (y / 1.3) ** 2); p.setY(k, y); }
      leaf.computeVertexNormals();
      const m = new THREE.Mesh(leaf, mats[i % 2]); m.rotation.order = 'YXZ'; m.rotation.y = (i / 9) * Math.PI * 2; m.rotation.x = -0.75 - rr(0, 0.35); m.castShadow = true; g.add(m);
    }
    g.position.set(x, 0, z); g.scale.setScalar(sc); parent.add(g);
  }
  stripeTex() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d');
    ['#ff5a5a', '#ffffff', '#3a8cff', '#ffffff', '#ffd23f', '#ffffff'].forEach((col, i) => { g.fillStyle = col; g.fillRect(i * 128 / 6, 0, 128 / 6 + 1, 64); });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  setSign(name) {
    if (!this.signBoard) return;
    this.signBoard.clear();
    const c = document.createElement('canvas'); c.width = 512; c.height = 192; const g = c.getContext('2d');
    g.fillStyle = '#7a4a22'; g.fillRect(0, 0, 512, 192); g.strokeStyle = '#4a2a10'; g.lineWidth = 14; g.strokeRect(7, 7, 498, 178);
    g.fillStyle = '#fff6d8'; g.font = 'bold 64px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(name, 256, 100);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const board = mesh(new THREE.BoxGeometry(2.0, 0.75, 0.08), [M.wood, M.wood, M.wood, M.wood, new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }), M.wood], 5.6, 1.5, 5.0);
    board.rotation.y = 0.75; this.signBoard.add(board);
    for (const s of [-0.8, 0.8]) this.signBoard.add(mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.6, 6), M.wood, 5.6 + s * Math.cos(0.75), 0.8, 5.0 - s * Math.sin(0.75)));
  }
  // n パーツまで 見せる（0〜30）。animate なら いちばん 新しい パーツが ぽんっと 出る
  setHome(n, animate = false) {
    this.homeStages.forEach((g, si) => g.children.forEach((p, k) => {
      const idx = si * 3 + k + 1;
      const was = p.visible;
      p.visible = idx <= n;
      if (animate && !was && p.visible) { p.scale.setScalar(0.01); p.userData.pop = 0; }
    }));
    this.homeN = n;
  }

  // ---------- 恐竜 ----------
  setDino(id, { growth = 0, accessories = [], name = '' } = {}) {
    if (this.dino) this.world.remove(this.dino.group);
    // いまは ティラノだけ（ほかの 恐竜は 3Dが できたら ここで 切りかえる）
    this.dino = new TRex();
    this.dino.group.rotation.y = -0.45;
    this.dino.onEvent = ev => {
      if (ev === 'bite') { this.food && (this.food.userData.eaten = 0.0001); for (let i = 0; i < 4; i++) chirp(220, 140, 0.07, 'square', 0.06, i * 0.22); }
      if (ev === 'roar') roarSound(this.dino.growth);
    };
    this.world.add(this.dino.group);
    this.growth = this.shown = growth / 100;
    this.dino.setGrowth(this.shown);
    this.lastStage = this.dino.stage();
    this.setAccessories(accessories);
    if (name) this.setSign(name);
    this.walkA = 0;
  }
  setGrowth(g100) { this.growth = g100 / 100; }
  setAccessories(list) {
    const d = this.dino; if (!d) return;
    (this.accMeshes || []).forEach(m => m.parent?.remove(m));
    const anchors = { head: d.head, neck: d.bones[11], back: d.bones[8] };
    this.accMeshes = list.map(id => { const m = accessoryMesh(id); m.traverse(o => { o.castShadow = true; }); anchors[ACC_ANCHOR[id]].add(m); return m; });
  }

  pet() { if (!this.dino || this.dino.busy()) return false; this.dino.play('pet'); this.burst(this.heart, this.headPos(), 6, 0.45 * this.sizeK()); chirp(700, 1300, 0.14); chirp(900, 1500, 0.14, 'sine', 0.12, 0.18); return true; }
  roar() { if (!this.dino || this.dino.busy()) return false; this.dino.walking = false; this.dino.play('roar'); return true; }
  toggleWalk() { if (!this.dino) return false; this.dino.walking = !this.dino.walking; return this.dino.walking; }
  // えさを あげる → 食べおわったら resolve
  feed(kind) {
    return new Promise(resolve => {
      if (!this.dino || this.dino.busy() || this.food) { resolve(false); return; }
      this.dino.walking = false;
      this.dino.group.updateMatrixWorld(true);
      const s = this.sizeK();
      const act = this.dino.play('feed', { foodY: 0.18 * s });
      const food = foodMesh(kind); food.scale.setScalar(Math.max(0.3, s * 0.6));
      const target = act.reach.snout.clone(); target.y = 0.18 * s;
      food.position.set(target.x, 4, target.z);
      food.userData = { target, vy: 0, done: resolve };
      this.scene.add(food); this.food = food;
      chirp(500, 300, 0.25, 'triangle', 0.12);
    });
  }
  hatchEffect() {
    const p = this.headPos();
    const shellMat = new THREE.MeshStandardMaterial({ color: 0xf4ead2, roughness: 0.55, side: THREE.DoubleSide });
    for (let i = 0; i < 10; i++) {
      const sh = mesh(new THREE.SphereGeometry(0.25, 8, 6, 0, 1.2, 0, 1.2), shellMat, p.x, 0.3, p.z);
      this.scene.add(sh);
      this.floaters.push({ s: sh, v: V(rr(-2, 2), rr(2, 4), rr(-2, 2)), life: 0, max: 1.4, spin: V(rr(-6, 6), rr(-6, 6), 0), gravity: true });
    }
    this.burst(this.star, p, 14, 0.5); this.burst(this.heart, p, 6, 0.4);
    chirp(600, 1500, 0.35, 'triangle', 0.15); chirp(900, 1800, 0.3, 'triangle', 0.12, 0.3);
    this.dino?.play('pet');
  }
  celebrate() { const p = this.headPos(); for (let i = 0; i < 4; i++) setTimeout(() => this.burst(this.star, p, 12, 0.6), i * 350); this.dino?.play('roar'); }

  // 恐竜の 大きさに あわせて カメラを よせる
  frame() {
    const k = this.sizeK(), t = this.dino ? this.dino.group.position : V(0, 0, 0);
    this.controls.target.set(t.x + 0.3 * k, 0.25 + 1.0 * k, t.z);
    const dir = V(4.3, 1.6, 6.8).normalize();
    this.camera.position.copy(this.controls.target).addScaledVector(dir, 3.2 + 5.2 * k);
    this.controls.update();
  }
  sizeK() { return this.dino ? this.dino.group.scale.x / 0.58 : 1; }
  headPos() { return this.dino ? this.dino.head.localToWorld(V(0.5, 0.3, 0)) : V(0, 2, 0); }
  burst(tex, pos, n = 6, size = 0.45) {
    for (let i = 0; i < n; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
      s.position.copy(pos).add(V(rr(-0.5, 0.5), rr(0, 0.4), rr(-0.5, 0.5)));
      s.scale.setScalar(size * rr(0.7, 1.2));
      this.scene.add(s);
      this.floaters.push({ s, v: V(rr(-0.3, 0.3), rr(0.9, 1.5), rr(-0.3, 0.3)), life: 0, max: rr(1.1, 1.6) });
    }
  }

  bindTap() {
    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
    let down = null;
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
    el.addEventListener('pointerup', e => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8 || !this.dino) return;
      const r = el.getBoundingClientRect();
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ptr, this.camera);
      if (ray.intersectObject(this.dino.group, true).length) this.onTapDino();
    });
  }

  attach(el) {
    if (this.running) this.detach();   // 画面を かきなおしたときは つけなおす
    this.el = el;
    el.appendChild(this.renderer.domElement);
    this.resize();
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(el);
    this.running = true;
    this.clock.getDelta();
    const loop = () => { if (!this.running) return; this.tick(); this.raf = requestAnimationFrame(loop); };
    loop();
  }
  detach() {
    this.running = false; cancelAnimationFrame(this.raf); this.ro?.disconnect();
    this.renderer.domElement.remove();
  }
  resize() {
    if (!this.el) return;
    const w = this.el.clientWidth || innerWidth, h = this.el.clientHeight || innerHeight;
    this.renderer.setSize(w, h); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  tick() {
    const dt = Math.min(0.05, this.clock.getDelta());
    this.step(dt);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
  step(dt) {
    this.tt += dt;
    const d = this.dino;
    if (d) {
      if (Math.abs(this.shown - this.growth) > 0.0005) { this.shown += (this.growth - this.shown) * Math.min(1, dt * 1.5); d.setGrowth(this.shown); }
      const st = d.stage();
      if (st !== this.lastStage) { this.flashT = 0; this.burst(this.star, this.headPos(), 16, 0.6); chirp(700, 1400, 0.3, 'triangle', 0.15); chirp(900, 1800, 0.3, 'triangle', 0.12, 0.25); this.onStageUp(stageOf(this.shown * 100)); setTimeout(() => this.frame(), 1500); }
      this.lastStage = st;
      if (this.flashT >= 0) { this.flashT += dt; d.look.flash(Math.max(0, Math.sin(Math.min(1, this.flashT / 1.2) * Math.PI)) * 0.85); if (this.flashT > 1.2) { this.flashT = -1; d.look.flash(0); } }
      if (d.walking && !d.busy()) {
        this.walkA += dt * 0.28;
        const R = 2.6;
        d.group.position.x = Math.cos(this.walkA) * R; d.group.position.z = Math.sin(this.walkA) * R;
        d.group.rotation.y = -(this.walkA + Math.PI / 2);
      }
      d.update(this.tt, dt);
    }
    // えさ
    const food = this.food;
    if (food) {
      const u = food.userData;
      if (u.eaten) {
        u.eaten += dt;
        food.scale.multiplyScalar(Math.max(0, 1 - dt * 1.3));
        if (u.eaten > 1.5) { this.scene.remove(food); this.food = null; this.burst(this.star, this.headPos(), 5, 0.35); this.onBite(); u.done(true); }
      } else {
        u.vy -= dt * 14; food.position.y += u.vy * dt; food.rotation.z += dt * 3;
        if (food.position.y < u.target.y) { food.position.y = u.target.y; u.vy = Math.abs(u.vy) > 1.5 ? -u.vy * 0.3 : 0; food.rotation.z = 0; }
      }
    }
    // すみかの パーツが ぽんっと 出る
    for (const g of this.homeStages) for (const p of g.children) if (p.userData.pop !== undefined) {
      p.userData.pop += dt * 2.2; const t = Math.min(1, p.userData.pop);
      p.scale.setScalar(Math.max(0.01, t + Math.sin(t * Math.PI) * 0.2));
      if (t >= 1) { p.scale.setScalar(1); delete p.userData.pop; }
    }
    if (this.ball) this.ball.rotation.y += dt * 0.3;
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i]; f.life += dt;
      if (f.gravity) { f.v.y -= dt * 9; if (f.spin) { f.s.rotation.x += f.spin.x * dt; f.s.rotation.y += f.spin.y * dt; } }
      f.s.position.addScaledVector(f.v, dt);
      if (f.s.material.opacity !== undefined && f.s.isSprite) f.s.material.opacity = 1 - f.life / f.max;
      if (f.life > f.max || f.s.position.y < -1) { this.scene.remove(f.s); this.floaters.splice(i, 1); }
    }
    for (let i = 0; i < this.smokeN; i++) {
      this.smokeL[i] = (this.smokeL[i] + dt * 0.08) % 1; const u = this.smokeL[i];
      this.smokeP[i * 3] = -10 + Math.sin(i * 7.1) * u * 2 + u * 4; this.smokeP[i * 3 + 1] = 8.5 + u * 9; this.smokeP[i * 3 + 2] = -26 + Math.cos(i * 3.3) * u * 2;
    }
    this.smokeG.attributes.position.needsUpdate = true;
  }
}
