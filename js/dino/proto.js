// ダイナソークエスト 試作：ティラノサウルス1匹を育てる画面
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { initAssets, M, TEX, Batch, palm, roundTree, rr, setSeed } from '../diorama/engine.js';
import { TRex } from './trex.js';
import { GLBDino, loadGLBDino, bakeStatic, PROTO_TREX_RIG } from './rig.js';

const Q = new URLSearchParams(location.search);
const SHOT = Q.has('shot');
if (SHOT) document.body.classList.add('shot');

initAssets();
setSeed(11);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- 画面 ----------
const view = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: SHOT });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
view.appendChild(renderer.domElement);

const scene = new THREE.Scene();
{ // 空のグラデーション
  const c = document.createElement('canvas'); c.width = 4; c.height = 256;
  const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#5fb2e8'); gr.addColorStop(0.55, '#bfe6f5'); gr.addColorStop(1, '#f4f0d8');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
}
scene.fog = new THREE.Fog(0xcfeaf2, 30, 70);
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.45;

const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 200);
camera.position.set(4.6, 2.8, 6.8);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0.3, 1.2, 0);
controls.enableDamping = true;
controls.maxPolarAngle = 1.45; controls.minDistance = 2.5; controls.maxDistance = 22;
controls.enablePan = false;
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); camera.position.set(c[0], c[1], c[2]); if (c.length > 3) controls.target.set(c[3], c[4], c[5]); }
controls.update();

scene.add(new THREE.HemisphereLight(0xe4f4ff, 0x6c7a3e, 0.9));
const sun = new THREE.DirectionalLight(0xfff1d6, 3.0);
sun.position.set(8, 14, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
scene.add(sun);

// ---------- 恐竜の島 ----------
const world = new THREE.Group(); scene.add(world);
const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };
// 地面（島）
const grassMat = M.grass.clone(); grassMat.map = TEX.grass.clone(); grassMat.map.repeat.set(5, 5); grassMat.map.needsUpdate = true;
const top = mesh(new THREE.CircleGeometry(11, 64), grassMat); top.rotation.x = -Math.PI / 2; top.castShadow = false; world.add(top);
world.add(mesh(new THREE.CylinderGeometry(11, 10.2, 1.6, 64, 1, true), M.mud, 0, -0.8, 0));
// 池
const pond = mesh(new THREE.CircleGeometry(2.1, 40), M.water, -4.6, 0.03, -2.6); pond.rotation.x = -Math.PI / 2; pond.castShadow = false; world.add(pond);
const b = new Batch();
for (let i = 0; i < 16; i++) {
  const a = (i / 16) * Math.PI * 2, r = 2.15 + rr(-0.1, 0.15);
  b.geo('rock', new THREE.DodecahedronGeometry(rr(0.18, 0.34), 0), -4.6 + Math.cos(a) * r, 0.05, -2.6 + Math.sin(a) * r, rr(0, 3), null, 1, 0.6, 1);
}
// 大きな岩
for (const [x, z, s] of [[5.2, -3.8, 1.1], [6.0, -2.6, 0.7], [-6.8, 3.6, 0.9], [3.6, 5.6, 0.6]]) b.geo('rock', new THREE.DodecahedronGeometry(s, 1), x, s * 0.35, z, rr(0, 3), null, 1.2, 0.75, 1);
// ヤシの木と 木
for (const [x, z, s] of [[-7.5, -5, 1.25], [-5.5, -6.8, 1.0], [7.4, -5.5, 1.15], [8.2, 1.5, 0.95], [-8.4, 1.2, 1.1], [-2.0, -8.2, 1.2], [3.0, -8.4, 0.9]]) palm(b, x, 0, z, s);
for (const [x, z, s] of [[-8.8, -2.4, 1.3], [6.4, 4.8, 1.0], [-6.2, 6.6, 1.1], [0.5, -9.0, 1.2]]) roundTree(b, x, 0, z, s);
b.build(world);
// シダ
const fernMat = new THREE.MeshStandardMaterial({ color: 0x4f8a3a, roughness: 0.8, side: THREE.DoubleSide });
const fernMat2 = new THREE.MeshStandardMaterial({ color: 0x6aa548, roughness: 0.8, side: THREE.DoubleSide });
function fern(x, z, s) {
  const g = new THREE.Group();
  const n = 9;
  for (let i = 0; i < n; i++) {
    const leaf = new THREE.PlaneGeometry(0.28, 1.3, 1, 6);
    const p = leaf.attributes.position;
    for (let k = 0; k < p.count; k++) { const y = p.getY(k) + 0.65; p.setX(k, p.getX(k) * Math.sin((y / 1.3) * Math.PI) * 1.4); p.setZ(k, -0.35 * (y / 1.3) ** 2); p.setY(k, y); }
    leaf.computeVertexNormals();
    const m = new THREE.Mesh(leaf, i % 2 ? fernMat : fernMat2);
    m.rotation.order = 'YXZ'; m.rotation.y = (i / n) * Math.PI * 2 + rr(-0.2, 0.2); m.rotation.x = -0.75 - rr(0, 0.35);
    m.castShadow = true; g.add(m);
  }
  g.position.set(x, 0, z); g.scale.setScalar(s); world.add(g);
}
for (let i = 0; i < 26; i++) {
  const a = rr(0, Math.PI * 2), r = rr(4.8, 9.8);
  const x = Math.cos(a) * r, z = Math.sin(a) * r;
  if (Math.hypot(x + 4.6, z + 2.6) < 2.7) continue;
  fern(x, z, rr(0.7, 1.2));
}
// 火山（遠く）
const volc = mesh(new THREE.CylinderGeometry(2.2, 9, 9, 24, 4), new THREE.MeshStandardMaterial({ color: 0x7b5e4c, roughness: 0.95, flatShading: true }), -10, 3.6, -26); volc.castShadow = false; scene.add(volc);
const lava = new THREE.Mesh(new THREE.CircleGeometry(2.1, 24), new THREE.MeshBasicMaterial({ color: 0xff7a2a })); lava.rotation.x = -Math.PI / 2; lava.position.set(-10, 8.12, -26); scene.add(lava);
const smokeN = 26, smokeP = new Float32Array(smokeN * 3), smokeL = [];
for (let i = 0; i < smokeN; i++) smokeL.push(Math.random());
const smokeG = new THREE.BufferGeometry(); smokeG.setAttribute('position', new THREE.BufferAttribute(smokeP, 3));
scene.add(new THREE.Points(smokeG, new THREE.PointsMaterial({ map: TEX.dot, size: 4.5, color: 0xf2f2f2, transparent: true, opacity: 0.55, depthWrite: false })));
// 遠くの 山
for (const [x, z, r, h] of [[14, -30, 9, 7], [26, -24, 8, 5], [-26, -22, 9, 6], [4, -36, 10, 8]]) { const m = mesh(new THREE.ConeGeometry(r, h, 9), M.mountainGrey ?? M.mountain, x, h / 2 - 0.5, z); m.castShadow = false; scene.add(m); }
// たまごの 巣（これから 生まれる なかま）
const nest = new THREE.Group(); nest.position.set(3.4, 0, -3.2); world.add(nest);
nest.add(mesh(new THREE.TorusGeometry(0.55, 0.2, 10, 24), M.straw, 0, 0.15, 0)).rotation.x = Math.PI / 2;
const eggMat = new THREE.MeshStandardMaterial({ color: 0xf4ead2, roughness: 0.55 });
for (const [x, z, r] of [[-0.18, 0.05, 0.3], [0.22, -0.1, -0.2]]) { const e = mesh(new THREE.SphereGeometry(0.24, 20, 14), eggMat, x, 0.3, z); e.scale.set(1, 1.3, 1); e.rotation.z = r; nest.add(e); }

// ---------- ティラノサウルス ----------
// ?rigtest=1 → 骨入れの テスト（プログラム製ティラノを いったん ただの 形にしてから、骨を 入れなおす）
// ?glb=ファイル名 → models/ の GLB を 読みこむ（cfg は rig.js）
let rex;
if (Q.has('glb')) rex = await loadGLBDino(`models/${Q.get("glb")}`, PROTO_TREX_RIG);
else if (Q.has('rigtest')) { const src = new TRex(); rex = new GLBDino(bakeStatic(src.group), PROTO_TREX_RIG); }
else rex = new TRex();
rex.group.rotation.y = -0.45;
world.add(rex.group);
let growth = Q.has('g') ? Number(Q.get('g')) : 0.5;
let shownGrowth = growth;
rex.setGrowth(growth);

const $ = id => document.getElementById(id);
function refreshUI() {
  $('stage').textContent = rex.stage();
  $('bar').style.width = `${Math.round(growth * 100)}%`;
  $('grow').value = growth;
}
refreshUI();
let dragging = false;
$('grow').addEventListener('pointerdown', () => { dragging = true; });
$('grow').addEventListener('change', () => { dragging = false; });
$('grow').addEventListener('input', e => { growth = shownGrowth = Number(e.target.value); rex.setGrowth(growth); refreshUI(); });

// ---------- 音（その場で つくる） ----------
let ac = null;
const audio = () => (ac ??= new (window.AudioContext || window.webkitAudioContext)());
function roarSound() {
  const a = audio(), t = a.currentTime, pitch = 1.6 - growth;
  const o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(140 * pitch, t); o.frequency.linearRampToValueAtTime(220 * pitch, t + 0.25); o.frequency.exponentialRampToValueAtTime(70 * pitch, t + 1.3);
  f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 6;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
  const lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = 28; lg.gain.value = 30 * pitch; lfo.connect(lg).connect(o.frequency);
  o.connect(f).connect(g).connect(a.destination); o.start(t); lfo.start(t); o.stop(t + 1.5); lfo.stop(t + 1.5);
}
function chirp(f0 = 600, f1 = 1100, d = 0.18, type = 'sine', vol = 0.18, delay = 0) {
  const a = audio(), t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.05);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + 0.1);
}

// ---------- ハートと キラキラ ----------
function spriteTex(draw) { const c = document.createElement('canvas'); c.width = c.height = 128; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const heartTex = spriteTex(g => { g.fillStyle = '#ff5a8a'; g.font = '110px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♥', 64, 70); });
const starTex = spriteTex(g => { g.fillStyle = '#ffd84a'; g.font = '110px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('★', 64, 70); });
const floaters = [];
function burst(tex, pos, n = 6, size = 0.45) {
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    s.position.copy(pos).add(V(rr(-0.5, 0.5), rr(0, 0.4), rr(-0.5, 0.5)));
    s.scale.setScalar(size * rr(0.7, 1.2));
    scene.add(s);
    floaters.push({ s, v: V(rr(-0.3, 0.3), rr(0.9, 1.5), rr(-0.3, 0.3)), life: 0, max: rr(1.1, 1.6) });
  }
}
const headPos = () => rex.head.localToWorld(V(0.5, 0.3, 0));

// ---------- えさ ----------
function makeMeat() {
  const g = new THREE.Group();
  const meat = mesh(new THREE.SphereGeometry(0.28, 18, 14), new THREE.MeshStandardMaterial({ color: 0xa4482c, roughness: 0.55 }), 0.12, 0, 0); meat.scale.set(1.35, 1, 1); g.add(meat);
  const bone = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 10), M.white, -0.32, 0, 0); bone.rotation.z = Math.PI / 2; g.add(bone);
  for (const dz of [-0.05, 0.05]) g.add(mesh(new THREE.SphereGeometry(0.075, 10, 8), M.white, -0.58, 0, dz));
  return g;
}
let food = null;
function feed() {
  if (rex.busy() || food) return;
  rex.walking = false; $('walk').textContent = '🚶 さんぽ';
  rex.group.updateMatrixWorld(true);
  const s = rex.group.scale.x / 0.58;
  const act = rex.play('feed', { foodY: 0.18 * s });
  food = makeMeat(); food.scale.setScalar(Math.max(0.3, s * 0.6));
  const target = act.reach.snout.clone(); target.y = 0.18 * s;
  food.position.set(target.x, 4, target.z);
  food.userData = { target, vy: 0 };
  scene.add(food);
  chirp(500, 300, 0.25, 'triangle', 0.12);
}
rex.onEvent = (ev) => {
  if (ev === 'bite' && food) {
    food.userData.eaten = 0.0001;
    for (let i = 0; i < 4; i++) chirp(220, 140, 0.07, 'square', 0.06, i * 0.22);
  }
  if (ev === 'roar') roarSound();
  if (ev === 'done') { /* 次の動きへ */ }
};
function growUp(amount) {
  const before = rex.stage();
  growth = Math.min(1, growth + amount);
  refreshUI();
  setTimeout(() => { if (rex.stage() !== before) { chirp(700, 1400, 0.3, 'triangle', 0.15); chirp(900, 1800, 0.3, 'triangle', 0.12, 0.25); } }, 900);
}

// ---------- ボタン ----------
$('feed').onclick = feed;
$('pet').onclick = () => pet();
$('roar').onclick = () => { if (!rex.busy()) { rex.walking = false; $('walk').textContent = '🚶 さんぽ'; rex.play('roar'); } };
$('walk').onclick = () => { rex.walking = !rex.walking; $('walk').textContent = rex.walking ? '✋ とまる' : '🚶 さんぽ'; };
function pet() {
  if (rex.busy()) return;
  rex.play('pet');
  burst(heartTex, headPos(), 6, 0.45 * Math.max(0.6, rex.group.scale.x / 0.58));
  chirp(700, 1300, 0.14, 'sine', 0.16); chirp(900, 1500, 0.14, 'sine', 0.12, 0.18);
}
// 恐竜を タップ → なでる
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let downAt = null;
renderer.domElement.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', e => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 8) return;
  ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  if (ray.intersectObject(rex.group, true).length) pet();
});
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

// ---------- 動かす ----------
const clock = new THREE.Clock();
let tt = 0, walkA = 0, lastStage = null, flashT = -1;
const freezeAt = Q.has('freeze') ? Number(Q.get('freeze')) : Infinity;
const runAct = () => ({ feed, pet, roar: () => rex.play('roar') }[Q.get('act')]?.());
if (Q.get('act') && !SHOT) setTimeout(runAct, 300);
if (Q.has('walk')) rex.walking = true;
function step(dt) {
  {
    tt += dt;
    // 大きくなるのは ゆっくり
    if (Math.abs(shownGrowth - growth) > 0.0005) { shownGrowth += (growth - shownGrowth) * Math.min(1, dt * 1.5); rex.setGrowth(shownGrowth); }
    const st = rex.stage();
    if (lastStage && st !== lastStage && !dragging) { flashT = 0; burst(starTex, headPos(), 16, 0.6); }
    lastStage = st;
    if (flashT >= 0) { flashT += dt; rex.look.flash(Math.max(0, Math.sin(Math.min(1, flashT / 1.2) * Math.PI)) * 0.85); if (flashT > 1.2) { flashT = -1; rex.look.flash(0); } }
    if (rex.walking && !rex.busy()) {
      walkA += dt * 0.28 / Math.max(0.5, rex.group.scale.x / 0.58) * (rex.group.scale.x / 0.58);
      const R = 2.6;
      rex.group.position.x = Math.cos(walkA) * R; rex.group.position.z = Math.sin(walkA) * R;
      rex.group.rotation.y = -(walkA + Math.PI / 2);
    }
    rex.update(tt, dt);
    // えさ
    if (food) {
      const u = food.userData;
      if (u.eaten) {
        u.eaten += dt;
        food.scale.multiplyScalar(Math.max(0, 1 - dt * 1.3));
        if (u.eaten > 1.5) { scene.remove(food); food = null; burst(starTex, headPos(), 5, 0.35); growUp(0.06); }
      } else {
        u.vy -= dt * 14; food.position.y += u.vy * dt; food.rotation.z += dt * 3;
        if (food.position.y < u.target.y) { food.position.y = u.target.y; u.vy = Math.abs(u.vy) > 1.5 ? -u.vy * 0.3 : 0; food.rotation.z = 0; }
      }
    }
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i]; f.life += dt;
      f.s.position.addScaledVector(f.v, dt); f.s.material.opacity = 1 - f.life / f.max;
      if (f.life > f.max) { scene.remove(f.s); floaters.splice(i, 1); }
    }
    for (let i = 0; i < smokeN; i++) {
      smokeL[i] = (smokeL[i] + dt * 0.08) % 1; const u = smokeL[i];
      smokeP[i * 3] = -10 + Math.sin(i * 7.1) * u * 2 + u * 4; smokeP[i * 3 + 1] = 8.5 + u * 9; smokeP[i * 3 + 2] = -26 + Math.cos(i * 3.3) * u * 2;
    }
    smokeG.attributes.position.needsUpdate = true;
    if (M.water.map) M.water.map.offset.x += dt * 0.01;
  }
}
let started = false;
function tick() {
  const dt = Math.min(0.05, clock.getDelta());
  if (SHOT && Number.isFinite(freezeAt)) {
    // 撮影用：決まった時間まで 一気に 進める
    if (!started) { started = true; step(0.001); if (Q.get('act')) runAct(); while (tt < freezeAt) { step(1 / 30); } }
  } else if (tt < freezeAt) step(dt);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
