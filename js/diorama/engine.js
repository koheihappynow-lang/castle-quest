// 3Dジオラマの共通エンジン（お城ごとの形は castles/*.js で組み立てる）
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export { THREE };

// ---------- 乱数（毎回同じ形になるよう固定） ----------
let seed = 7;
export const setSeed = s => { seed = s; };
export const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
export const rr = (a, b) => a + (b - a) * rnd();
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const pick = arr => arr[Math.floor(rnd() * arr.length)];

// ---------- テクスチャ ----------
function canvasTex(size, draw, rep = 0.5) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep, rep);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function noise(g, s, n, cols, a = 0.25) {
  for (let i = 0; i < n; i++) {
    g.globalAlpha = a * rnd();
    g.fillStyle = cols[Math.floor(rnd() * cols.length)];
    const r = rr(1, 3);
    g.fillRect(rnd() * s, rnd() * s, r, r);
  }
  g.globalAlpha = 1;
}
function roofTex(base, dark, light, rep = 1.4) {
  return canvasTex(128, (g, s) => {
    g.fillStyle = base; g.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 16) {
      const gr = g.createLinearGradient(x, 0, x + 16, 0);
      gr.addColorStop(0, dark); gr.addColorStop(0.5, light); gr.addColorStop(1, dark);
      g.fillStyle = gr; g.fillRect(x, 0, 16, s);
    }
    g.fillStyle = 'rgba(20,20,20,.45)';
    for (let y = 0; y < s; y += 32) g.fillRect(0, y, s, 3);
  }, rep);
}
function shingleTex(base, dark, rep = 1.6) {
  return canvasTex(128, (g, s) => {
    g.fillStyle = base; g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 16) {
      const off = (y / 16) % 2 ? 8 : 0;
      for (let x = -16; x < s + 16; x += 16) {
        g.fillStyle = dark; g.fillRect(x + off, y, 1.5, 16);
        g.globalAlpha = 0.12 + rnd() * 0.15; g.fillStyle = '#fff'; g.fillRect(x + off + 2, y + 2, 12, 3); g.globalAlpha = 1;
      }
      g.fillStyle = dark; g.fillRect(0, y + 14, s, 2);
    }
  }, rep);
}
export const TEX = {};
function makeTextures() {
  setSeed(7);
  TEX.stone = canvasTex(256, (g, s) => {
    g.fillStyle = '#5d5953'; g.fillRect(0, 0, s, s);
    let y = 0;
    while (y < s) {
      const h = rr(18, 30); let x = -rr(0, 30);
      while (x < s) {
        const w = rr(26, 52);
        const v = Math.floor(rr(135, 175));
        g.fillStyle = `rgb(${v},${v - 4},${v - 10})`;
        g.beginPath(); g.roundRect(x + 2, y + 2, w - 4, h - 4, 6); g.fill();
        g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + 4, y + 3, w - 10, 3);
        x += w;
      }
      y += h;
    }
    noise(g, s, 2500, ['#3d3a36', '#bdb7ab'], 0.35);
  }, 0.4);
  TEX.ashlar = canvasTex(256, (g, s) => {
    g.fillStyle = '#b9b3a8'; g.fillRect(0, 0, s, s);
    for (let y = 0, row = 0; y < s; y += 32, row++) {
      for (let x = (row % 2) * -32; x < s; x += 64) {
        const v = Math.floor(rr(200, 230));
        g.fillStyle = `rgb(${v},${v - 3},${v - 9})`; g.fillRect(x + 1.5, y + 1.5, 61, 29);
      }
    }
    noise(g, s, 2500, ['#9d968a', '#ffffff'], 0.25);
  }, 0.5);
  TEX.brick = canvasTex(128, (g, s) => {
    g.fillStyle = '#7d3b2b'; g.fillRect(0, 0, s, s);
    for (let y = 0, row = 0; y < s; y += 10, row++) for (let x = (row % 2) * -11; x < s; x += 22) {
      const v = rr(0.85, 1.1);
      g.fillStyle = `rgb(${Math.floor(178 * v)},${Math.floor(84 * v)},${Math.floor(60 * v)})`; g.fillRect(x + 1, y + 1, 20, 8);
    }
  }, 0.8);
  TEX.plaster = canvasTex(128, (g, s) => { g.fillStyle = '#f5f3ee'; g.fillRect(0, 0, s, s); noise(g, s, 1200, ['#dcd8cf', '#ffffff'], 0.4); }, 0.5);
  TEX.roof = roofTex('#4b5361', '#3a414d', '#68717f');
  TEX.roofRed = roofTex('#8a3a2a', '#6e2c20', '#b35a43');
  TEX.roofYellow = roofTex('#e0a526', '#b97d10', '#ffd45e');
  TEX.slate = shingleTex('#55657a', '#3a4656');
  TEX.terracotta = roofTex('#b85c38', '#8f4026', '#d98058', 1.6);
  TEX.wood = canvasTex(128, (g, s) => {
    g.fillStyle = '#6b4a2f'; g.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 16) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, 0, 2, s); }
    noise(g, s, 900, ['#3f2a19', '#8a6443'], 0.4);
  }, 0.5);
  TEX.grass = canvasTex(256, (g, s) => { g.fillStyle = '#74ad52'; g.fillRect(0, 0, s, s); noise(g, s, 9000, ['#5f9a41', '#8cc263', '#6aa34a', '#9ccf72'], 0.6); }, 0.12);
  TEX.gravel = canvasTex(128, (g, s) => { g.fillStyle = '#d8c7a3'; g.fillRect(0, 0, s, s); noise(g, s, 3000, ['#b9a681', '#efe2c4', '#a8977a'], 0.6); }, 0.3);
  TEX.sand = canvasTex(128, (g, s) => { g.fillStyle = '#d9c9a3'; g.fillRect(0, 0, s, s); noise(g, s, 3000, ['#c4b28a', '#ebdfc0', '#b8a780'], 0.5); }, 0.15);
  TEX.paving = canvasTex(128, (g, s) => {
    g.fillStyle = '#9b9790'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 32) for (let x = 0; x < s; x += 32) { const v = Math.floor(rr(160, 190)); g.fillStyle = `rgb(${v},${v - 2},${v - 6})`; g.fillRect(x + 1, y + 1, 30, 30); }
  }, 0.5);
  TEX.water = canvasTex(256, (g, s) => {
    g.fillStyle = '#3d8fa6'; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2;
    for (let i = 0; i < 40; i++) { const x = rnd() * s, y = rnd() * s, w = rr(10, 40); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 4, x + w, y); g.stroke(); }
  }, 0.08);
  TEX.zebra = canvasTex(64, (g, s) => { g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, s, s); g.fillStyle = '#1b1b1b'; for (let x = 0; x < s; x += 10) g.fillRect(x, 0, 5, s); }, 1);
  TEX.dot = canvasTex(64, (g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  }, 1);
  TEX.petal = canvasTex(32, (g, s) => { g.fillStyle = '#ffd1df'; g.beginPath(); g.ellipse(s / 2, s / 2, s * 0.42, s * 0.26, 0.6, 0, Math.PI * 2); g.fill(); }, 1);
  TEX.nobori = canvasTex(64, (g, s) => { g.fillStyle = '#f7f3ea'; g.fillRect(0, 0, s, s); g.fillStyle = '#c0392b'; g.beginPath(); g.arc(s / 2, s * 0.3, s * 0.18, 0, Math.PI * 2); g.fill(); g.fillStyle = '#1f3a68'; g.fillRect(0, s * 0.85, s, s * 0.15); }, 1);
  // ムーア風の もよう（アルハンブラ）
  TEX.tilePattern = canvasTex(64, (g, s) => {
    g.fillStyle = '#efe3c8'; g.fillRect(0, 0, s, s);
    g.strokeStyle = '#2f6d6a'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(s / 2, 4); g.lineTo(s - 4, s / 2); g.lineTo(s / 2, s - 4); g.lineTo(4, s / 2); g.closePath(); g.stroke();
    g.fillStyle = '#c4643c'; g.beginPath(); g.arc(s / 2, s / 2, 6, 0, Math.PI * 2); g.fill();
  }, 1.2);
}

// ---------- 材質 ----------
export const M = {};
function makeMaterials() {
  const std = o => new THREE.MeshStandardMaterial(o);
  const D = THREE.DoubleSide;
  Object.assign(M, {
    stone: std({ map: TEX.stone, roughness: 0.95 }),
    stoneGrey: std({ map: TEX.stone, color: 0xd5d8dc, roughness: 0.95 }),
    stoneWarm: std({ map: TEX.stone, color: 0xf0dcc0, roughness: 0.95 }),
    ashlar: std({ map: TEX.ashlar, roughness: 0.9 }),
    ashlarGrey: std({ map: TEX.ashlar, color: 0xb9bcc2, roughness: 0.9 }),
    ashlarWarm: std({ map: TEX.ashlar, color: 0xf2dfc2, roughness: 0.9 }),
    brick: std({ map: TEX.brick, roughness: 0.9 }),
    gravel: std({ map: TEX.gravel, roughness: 1 }),
    sand: std({ map: TEX.sand, roughness: 1 }),
    paving: std({ map: TEX.paving, roughness: 0.95 }),
    plaster: std({ map: TEX.plaster, roughness: 0.85, emissive: 0x3a3a3a }),
    eave: std({ map: TEX.plaster, roughness: 0.85, side: D, emissive: 0x3a3a3a }),
    limestone: std({ map: TEX.plaster, color: 0xf7efdd, roughness: 0.85, emissive: 0x222018 }),
    cream: std({ map: TEX.plaster, color: 0xf1e2c2, roughness: 0.85, emissive: 0x1a160e }),
    ochre: std({ map: TEX.plaster, color: 0xc9845a, roughness: 0.9 }),
    redOchre: std({ map: TEX.plaster, color: 0xb94a37, roughness: 0.9 }),
    yellowWall: std({ map: TEX.plaster, color: 0xf0c048, roughness: 0.9 }),
    vermilion: std({ map: TEX.plaster, color: 0xa8241c, roughness: 0.8 }),
    marble: std({ color: 0xf4f2ec, roughness: 0.45 }),
    roof: std({ map: TEX.roof, roughness: 0.6, metalness: 0.15, side: D }),
    roofRed: std({ map: TEX.roofRed, roughness: 0.6, metalness: 0.1, side: D }),
    roofYellow: std({ map: TEX.roofYellow, roughness: 0.4, metalness: 0.25, side: D, emissive: 0x2a1a00 }),
    slate: std({ map: TEX.slate, roughness: 0.6, metalness: 0.15, side: D }),
    terracotta: std({ map: TEX.terracotta, roughness: 0.8, side: D }),
    copper: std({ color: 0x5fa38a, roughness: 0.5, metalness: 0.4, side: D }),
    tilePattern: std({ map: TEX.tilePattern, roughness: 0.6 }),
    wood: std({ map: TEX.wood, roughness: 0.85 }),
    darkWood: std({ color: 0x3a281c, roughness: 0.8 }),
    grass: std({ map: TEX.grass, roughness: 1 }),
    mud: std({ color: 0x4e5b3c, roughness: 1 }),
    board: std({ map: TEX.wood, color: 0xb58a5c, roughness: 0.7 }),
    water: std({ map: TEX.water, color: 0x8fd3e6, roughness: 0.12, metalness: 0.25, transparent: true, opacity: 0.88 }),
    pool: std({ color: 0x45c3ea, roughness: 0.05, metalness: 0.1, emissive: 0x0b3a4d, transparent: true, opacity: 0.92 }),
    gold: std({ color: 0xf2c14e, metalness: 0.95, roughness: 0.25, emissive: 0x3a2800 }),
    bronze: std({ color: 0x8c6a3c, metalness: 0.7, roughness: 0.4 }),
    iron: std({ color: 0x2b2b2e, metalness: 0.6, roughness: 0.45 }),
    window: std({ color: 0x2a221c, roughness: 0.7, emissive: 0xffb347, emissiveIntensity: 0 }),
    lantern: std({ color: 0xfff1d0, emissive: 0xffb347, emissiveIntensity: 0.05 }),
    chochin: std({ color: 0xe0563b, emissive: 0xff8a3d, emissiveIntensity: 0.1, roughness: 0.6 }),
    sakuraA: std({ color: 0xf6b3c6, roughness: 0.9, flatShading: true }),
    sakuraB: std({ color: 0xfbd3df, roughness: 0.9, flatShading: true }),
    pine: std({ color: 0x2f5e3a, roughness: 0.9, flatShading: true }),
    pineB: std({ color: 0x3f7448, roughness: 0.9, flatShading: true }),
    leaf: std({ color: 0x4f8f3a, roughness: 0.9, flatShading: true }),
    leafB: std({ color: 0x6aa646, roughness: 0.9, flatShading: true }),
    leafDark: std({ color: 0x2c5232, roughness: 0.9, flatShading: true }),
    orange: std({ color: 0xff9a1f, roughness: 0.6 }),
    trunk: std({ color: 0x5a3e2b, roughness: 1 }),
    rock: std({ color: 0x8c867c, roughness: 1, flatShading: true }),
    rockDark: std({ color: 0x6d6862, roughness: 1, flatShading: true }),
    mountain: std({ color: 0x6f8f5c, roughness: 1, flatShading: true }),
    mountainGrey: std({ color: 0x8b9099, roughness: 1, flatShading: true }),
    snow: std({ color: 0xffffff, roughness: 0.8, flatShading: true }),
    houseA: std({ map: TEX.plaster, color: 0xf1e7d3, roughness: 0.9 }),
    houseB: std({ map: TEX.wood, color: 0xc49a6c, roughness: 0.9 }),
    houseC: std({ map: TEX.wood, color: 0x8a6448, roughness: 0.9 }),
    houseWhite: std({ map: TEX.plaster, color: 0xffffff, roughness: 0.9, emissive: 0x262626 }),
    housePink: std({ map: TEX.plaster, color: 0xf2c8b8, roughness: 0.9 }),
    houseYellow: std({ map: TEX.plaster, color: 0xf3dd9b, roughness: 0.9 }),
    houseBlue: std({ map: TEX.plaster, color: 0xc9d9e8, roughness: 0.9 }),
    houseGrey: std({ map: TEX.ashlar, color: 0xa9a49c, roughness: 0.9 }),
    lattice: std({ color: 0x4a3324, roughness: 0.8 }),
    norenBlue: std({ color: 0x24427a, side: D }),
    norenRed: std({ color: 0xa8322d, side: D }),
    norenWhite: std({ color: 0xf2efe6, side: D }),
    skin: std({ color: 0xf2c9a0, roughness: 0.8 }),
    hair: std({ color: 0x1e1a18, roughness: 0.8 }),
    straw: std({ color: 0xd9b56b, roughness: 1 }),
    redCoat: std({ color: 0xc0262d, roughness: 0.7 }),
    bearskin: std({ color: 0x141414, roughness: 1 }),
    tartan: std({ color: 0x2f5a3a, roughness: 0.9 }),
    horse: std({ color: 0x6b4423, roughness: 0.8 }),
    horseWhite: std({ color: 0xece8e0, roughness: 0.8 }),
    zebra: std({ map: TEX.zebra, roughness: 0.8 }),
    black: std({ color: 0x1d1d1f, roughness: 0.6 }),
    white: std({ color: 0xffffff, roughness: 0.7 }),
    redCloth: std({ color: 0xc23b30, side: D, roughness: 0.8 }),
    nobori: std({ map: TEX.nobori, side: D, roughness: 0.9 }),
    boat: std({ color: 0x7b5434, roughness: 0.8 }),
    bird: std({ color: 0x2d2d2d }),
    sheep: std({ color: 0xf3f0e8, roughness: 1, flatShading: true }),
    sign: std({ color: 0xe8d3a8, roughness: 0.9 }),
  });
  M.kimono = [0x2f5d8a, 0xb5403a, 0x6b4c9a, 0x3e7b5a, 0xc98b2b, 0x8a3b5c, 0x445566].map(c => std({ color: c, roughness: 0.85 }));
  M.clothes = [0x2f5d8a, 0xb5403a, 0x3e7b5a, 0xc98b2b, 0x8a3b5c, 0x445566, 0xe6e0d0, 0x6b4c9a].map(c => std({ color: c, roughness: 0.85 }));
}

// 旗
const flagCache = {};
export function flagMat(kind) {
  if (flagCache[kind]) return flagCache[kind];
  const tex = canvasTex(128, (g, s) => {
    const h = s * 0.66;
    g.fillStyle = '#fff'; g.fillRect(0, 0, s, s);
    const stripesH = cols => cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, (h / cols.length) * i, s, h / cols.length + 1); });
    const stripesV = cols => cols.forEach((c, i) => { g.fillStyle = c; g.fillRect((s / cols.length) * i, 0, s / cols.length + 1, h); });
    switch (kind) {
      case 'de': stripesH(['#111', '#d00', '#fc0']); break;
      case 'fr': stripesV(['#0055a4', '#fff', '#ef4135']); break;
      case 'es': stripesH(['#c60b1e', '#ffc400', '#ffc400', '#c60b1e']); break;
      case 'pt': g.fillStyle = '#006600'; g.fillRect(0, 0, s * 0.4, h); g.fillStyle = '#ff0000'; g.fillRect(s * 0.4, 0, s * 0.6, h); g.fillStyle = '#ffcc00'; g.beginPath(); g.arc(s * 0.4, h / 2, h * 0.2, 0, 7); g.fill(); break;
      case 'cn': g.fillStyle = '#de2910'; g.fillRect(0, 0, s, h); g.fillStyle = '#ffde00'; star(g, s * 0.17, h * 0.27, h * 0.15); break;
      case 'us':
        for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#fff' : '#b22234'; g.fillRect(0, (h / 13) * i, s, h / 13 + 1); }
        g.fillStyle = '#3c3b6e'; g.fillRect(0, 0, s * 0.4, h * 0.54); break;
      case 'scot': g.fillStyle = '#005eb8'; g.fillRect(0, 0, s, h); g.strokeStyle = '#fff'; g.lineWidth = h * 0.16; g.beginPath(); g.moveTo(0, 0); g.lineTo(s, h); g.moveTo(s, 0); g.lineTo(0, h); g.stroke(); break;
      case 'uk':
        g.fillStyle = '#012169'; g.fillRect(0, 0, s, h);
        g.strokeStyle = '#fff'; g.lineWidth = h * 0.2; g.beginPath(); g.moveTo(0, 0); g.lineTo(s, h); g.moveTo(s, 0); g.lineTo(0, h); g.stroke();
        g.strokeStyle = '#c8102e'; g.lineWidth = h * 0.07; g.stroke();
        g.fillStyle = '#fff'; g.fillRect(s * 0.42, 0, s * 0.16, h); g.fillRect(0, h * 0.36, s, h * 0.28);
        g.fillStyle = '#c8102e'; g.fillRect(s * 0.455, 0, s * 0.09, h); g.fillRect(0, h * 0.42, s, h * 0.16); break;
      case 'royal':
        g.fillStyle = '#c8102e'; g.fillRect(0, 0, s / 2, h / 2); g.fillRect(s / 2, h / 2, s / 2, h / 2);
        g.fillStyle = '#ffd200'; g.fillRect(s / 2, 0, s / 2, h / 2);
        g.fillStyle = '#0a3d91'; g.fillRect(0, h / 2, s / 2, h / 2); break;
      default: g.fillStyle = '#fff'; g.fillRect(0, 0, s, h); g.fillStyle = '#bc002d'; g.beginPath(); g.arc(s / 2, h / 2, h * 0.3, 0, 7); g.fill();
    }
  }, 1);
  tex.repeat.set(1, 1);
  tex.offset.set(0, 0.34);
  tex.repeat.set(1, 0.66);
  flagCache[kind] = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 });
  return flagCache[kind];
}
function star(g, x, y, r) {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr2 = i % 2 ? r * 0.4 : r; g.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
  g.closePath(); g.fill();
}

let inited = false;
export function initAssets() { if (inited) return; makeTextures(); makeMaterials(); inited = true; }

// ---------- 形の道具 ----------
export function rectPt(w, d, side, t) {
  const hw = w / 2, hd = d / 2;
  switch (side) {
    case 0: return [-hw + w * t, -hd];
    case 1: return [hw, -hd + d * t];
    case 2: return [hw - w * t, hd];
    default: return [-hw, hd - d * t];
  }
}
export function loft(fn, rings, seg) {
  const pos = [], uv = [], idx = [];
  const cols = seg + 1;
  let base = 0, uOff = 0;
  for (let side = 0; side < 4; side++) {
    const sp = [];
    for (let r = 0; r <= rings; r++) for (let c = 0; c <= seg; c++) sp.push(fn(r / rings, side, c / seg));
    for (let r = 0; r <= rings; r++) {
      let u = uOff;
      for (let c = 0; c <= seg; c++) {
        const p = sp[r * cols + c];
        if (c > 0) { const q = sp[r * cols + c - 1]; u += Math.hypot(p[0] - q[0], p[2] - q[2]); }
        let v = 0;
        for (let k = 1; k <= r; k++) { const a = sp[(k - 1) * cols + c], b = sp[k * cols + c]; v += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); }
        pos.push(...p); uv.push(u, v);
      }
    }
    for (let r = 0; r < rings; r++) for (let c = 0; c < seg; c++) {
      const a = base + r * cols + c, b = a + 1, cc = a + cols, dd = cc + 1;
      idx.push(a, cc, b, b, cc, dd);
    }
    uOff += Math.hypot(sp[seg][0] - sp[0][0], sp[seg][2] - sp[0][2]);
    base += (rings + 1) * cols;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
// 反りのある寄棟屋根（up=角のはね上がり、sag=まん中のへこみ）
export function roofGeo(wo, dO, wi, di, rise, { up = 0.35, sag = 0.14, seg = 10, rings = 6 } = {}) {
  return loft((s, side, t) => {
    const k = Math.pow(Math.abs(2 * t - 1), 3);
    const [ox, oz] = rectPt(wo * (1 + 0.03 * k * (up > 0 ? 1 : 0)), dO * (1 + 0.03 * k * (up > 0 ? 1 : 0)), side, t);
    const [ix, iz] = rectPt(wi, di, side, t);
    const y = up * k * (1 - s) * (1 - s) + rise * s - sag * rise * Math.sin(Math.PI * s);
    return [ox + (ix - ox) * s, y, oz + (iz - oz) * s];
  }, rings, seg);
}
export function eaveGeo(wo, dO, ww, wd, { up = 0.35, seg = 10, drop = 0.22 } = {}) {
  return loft((s, side, t) => {
    const k = Math.pow(Math.abs(2 * t - 1), 3);
    const [ox, oz] = rectPt(wo * (1 + 0.03 * k * (up > 0 ? 1 : 0)), dO * (1 + 0.03 * k * (up > 0 ? 1 : 0)), side, t);
    const [ix, iz] = rectPt(ww, wd, side, t);
    if (s < 0.5) return [ox, up * k - drop * (s * 2), oz];
    const f = (s - 0.5) * 2;
    return [ox + (ix - ox) * f, up * k * (1 - f) - drop, oz + (iz - oz) * f];
  }, 2, seg);
}
// 下はゆるやか・上は急な石垣
export function stoneBaseGeo(wb, db, wt, dt, h, curve = true) {
  return loft((s, side, t) => {
    const f = curve ? 1 - (1 - s) * (1 - s) : s;
    const [x, z] = rectPt(wb + (wt - wb) * f, db + (dt - db) * f, side, t);
    return [x, h * s, z];
  }, curve ? 7 : 1, 3);
}
export function boxGeo(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]); }
  return g;
}
export function cylGeo(rt, rb, h, seg = 20, open = false) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
  const uv = g.attributes.uv;
  const circ = Math.PI * (rt + rb);
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * circ, uv.getY(i) * h);
  return g;
}
export function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
export function triPrism(w, h, depth, curved = false) {
  const s = new THREE.Shape();
  if (curved) {
    s.moveTo(-w / 2, 0);
    s.bezierCurveTo(-w / 2 + w * 0.18, 0, -w * 0.2, h * 1.05, 0, h);
    s.bezierCurveTo(w * 0.2, h * 1.05, w / 2 - w * 0.18, 0, w / 2, 0);
    s.lineTo(-w / 2, 0);
  } else { s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.lineTo(-w / 2, 0); }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 10 });
  g.translate(0, 0, -depth);
  return g;
}
// 指定位置・向きの小グループ
export function sub(parent, x = 0, y = 0, z = 0, ry = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  parent.add(g);
  return g;
}

// 同じ材質の形を1つにまとめる（iPadでも軽く動くように）
export class Batch {
  constructor() { this.map = new Map(); }
  add(geo, key, matrix) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.clearGroups();
    if (matrix) g.applyMatrix4(matrix);
    if (!this.map.has(key)) this.map.set(key, []);
    this.map.get(key).push(g);
    geo.dispose?.();
  }
  box(key, w, h, d, x, y, z, ry = 0, parent = null, rx = 0, rz = 0) {
    const m = new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(1, 1, 1));
    if (parent) m.premultiply(parent);
    this.add(boxGeo(w, h, d), key, m);
  }
  geo(key, g, x, y, z, ry = 0, parent = null, sx = 1, sy = 1, sz = 1) {
    const m = new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), V(sx, sy, sz));
    if (parent) m.premultiply(parent);
    this.add(g, key, m);
  }
  build(group) {
    for (const [key, list] of this.map) {
      const merged = mergeGeometries(list, false);
      list.forEach(g => g.dispose());
      if (!merged) continue;
      group.add(mesh(merged, M[key]));
    }
    this.map.clear();
    return group;
  }
}
export const matrixAt = (x, y, z, ry = 0) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), V(1, 1, 1));

// ---------- 窓 ----------
export function windowSpots(list, cx, cz, w, d, y, spacing = 1.0) {
  const nx = Math.max(1, Math.floor((w - 0.5) / spacing));
  const nz = Math.max(1, Math.floor((d - 0.5) / spacing));
  for (let i = 0; i < nx; i++) {
    const x = cx - w / 2 + (i + 0.5) * (w / nx);
    list.push([x, y, cz + d / 2 + 0.02, 0], [x, y, cz - d / 2 - 0.02, 0]);
  }
  for (let i = 0; i < nz; i++) {
    const z = cz - d / 2 + (i + 0.5) * (d / nz);
    list.push([cx + w / 2 + 0.02, y, z, Math.PI / 2], [cx - w / 2 - 0.02, y, z, Math.PI / 2]);
  }
}
export function ringWindows(list, cx, cz, r, y, n, phase = 0) {
  for (let i = 0; i < n; i++) {
    const a = phase + (i / n) * Math.PI * 2;
    list.push([cx + Math.sin(a) * (r + 0.02), y, cz + Math.cos(a) * (r + 0.02), a]);
  }
}
const winGeos = {};
export function windowsMesh(list, { w = 0.3, h = 0.38, arch = false, mat = M.window } = {}) {
  const key = `${w}_${h}_${arch}`;
  if (!winGeos[key]) {
    if (arch) {
      const s = new THREE.Shape();
      s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2 - w / 2); s.absarc(0, h / 2 - w / 2, w / 2, 0, Math.PI, false); s.lineTo(-w / 2, -h / 2);
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false, curveSegments: 6 });
      g.translate(0, 0, -0.04);
      winGeos[key] = g;
    } else winGeos[key] = new THREE.BoxGeometry(w, h, 0.08);
  }
  const im = new THREE.InstancedMesh(winGeos[key], mat, list.length);
  const m = new THREE.Matrix4();
  list.forEach(([x, y, z, ry], i) => { m.compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), V(1, 1, 1)); im.setMatrixAt(i, m); });
  im.castShadow = true;
  return im;
}

// ---------- 日本のお城の部品 ----------
export function buildKeep({ x, z, y, tiers, ov = 0.8, rise = 0.75, up = 0.35, winScale = 1, topRise = 1.5, roofMat = M.roof, wallMat = M.plaster }) {
  const walls = new THREE.Group(), roofs = new THREE.Group();
  const wins = [];
  const info = [];
  let base = y;
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    const below = i === 0 ? 0 : rise;
    const wallH = t.h + below;
    walls.add(mesh(boxGeo(t.w, wallH, t.d), wallMat, x, base + wallH / 2, z));
    windowSpots(wins, x, z, t.w, t.d, base + below + t.h * 0.52, 1.05 * winScale);
    const top = base + wallH;
    info.push({ ...t, top, base });
    const next = tiers[i + 1];
    const wo = t.w + 2 * ov, dO = t.d + 2 * ov;
    if (next) {
      roofs.add(mesh(roofGeo(wo, dO, next.w, next.d, rise, { up }), roofMat, x, top - 0.05, z));
      roofs.add(mesh(eaveGeo(wo, dO, t.w, t.d, { up }), M.eave, x, top - 0.05, z));
      base = top;
    } else {
      const ridgeL = Math.max(0.4, t.w - t.d * 0.75);
      roofs.add(mesh(roofGeo(wo, dO, ridgeL, 0.18, topRise, { up: up * 1.1 }), roofMat, x, top - 0.05, z));
      roofs.add(mesh(eaveGeo(wo, dO, t.w, t.d, { up: up * 1.1 }), M.eave, x, top - 0.05, z));
      roofs.add(mesh(boxGeo(ridgeL + 0.5, 0.22, 0.32), roofMat, x, top + topRise - 0.02, z));
      info.ridge = { y: top + topRise + 0.1, half: (ridgeL + 0.5) / 2 };
    }
  }
  walls.add(windowsMesh(wins, { w: 0.3 * winScale, h: 0.38 * winScale }));
  return { walls, roofs, info };
}
export function shachihoko(x, y, z, flip, s = 1) {
  const g = new THREE.Group();
  const body = mesh(new THREE.SphereGeometry(0.16, 10, 8), M.gold); body.scale.set(0.8, 1.6, 0.8); body.position.y = 0.22;
  const tail = mesh(new THREE.ConeGeometry(0.14, 0.34, 6), M.gold); tail.position.set(flip * 0.1, 0.52, 0); tail.rotation.z = flip * 0.6;
  const head = mesh(new THREE.SphereGeometry(0.13, 10, 8), M.gold); head.position.set(-flip * 0.06, 0.08, 0);
  g.add(body, tail, head);
  g.position.set(x, y, z); g.scale.setScalar(s);
  return g;
}
function gable({ w = 2.4, h = 1.0, depth = 2, curved = false, roofMat = M.roof }) {
  const g = new THREE.Group();
  const prism = new THREE.Mesh(triPrism(w, h, depth, curved), [M.plaster, roofMat]);
  prism.castShadow = prism.receiveShadow = true;
  g.add(prism);
  if (!curved) {
    const slope = Math.atan2(h, w / 2);
    const len = Math.hypot(w / 2, h) + 0.35;
    for (const sgn of [-1, 1]) {
      const slab = mesh(boxGeo(len, 0.1, depth + 0.35), roofMat);
      slab.position.set(sgn * w / 4, h / 2 + 0.06, -depth / 2 + 0.17);
      slab.rotation.z = -sgn * slope;
      g.add(slab);
    }
  } else {
    const cap = mesh(boxGeo(w + 0.2, 0.08, depth + 0.3), roofMat);
    cap.position.set(0, h + 0.02, -depth / 2 + 0.15); cap.scale.x = 0.45;
    g.add(cap);
  }
  const fish = mesh(new THREE.BoxGeometry(0.22, 0.3, 0.06), M.gold);
  fish.position.set(0, h * 0.72, 0.04);
  g.add(fish);
  return g;
}
export function placeGable(parent, opts, cx, cz, tier, next, ov, face, offset = 0) {
  const outward = { pz: [0, 1], nz: [0, -1], px: [1, 0], nx: [-1, 0] }[face];
  const half = face.endsWith('z') ? tier.d / 2 : tier.w / 2;
  const nextHalf = face.endsWith('z') ? next.d / 2 : next.w / 2;
  const front = half + ov * 0.5;
  const g = gable({ ...opts, depth: front - nextHalf + 0.25 });
  const fx = face.endsWith('z') ? cx + offset : cx + outward[0] * front;
  const fz = face.endsWith('z') ? cz + outward[1] * front : cz + offset;
  g.position.set(fx, tier.top + 0.02, fz);
  g.rotation.y = { pz: 0, nz: Math.PI, px: Math.PI / 2, nx: -Math.PI / 2 }[face];
  parent.add(g);
}

// ---------- 西洋のお城の部品 ----------
// 丸い塔。roof: 'cone' | 'dome' | 'onion' | 'crenel' | 'none'
export function roundTower(g, { x, z, y = 0, r, h, wall = M.ashlar, roof = 'cone', roofMat = M.slate, roofH, overhang = 1.18, seg = 20, wins, winRows = 2, finial = true, corbel = false }) {
  g.add(mesh(cylGeo(r, r * 1.03, h, seg), wall, x, y + h / 2, z));
  let top = y + h;
  if (corbel) { g.add(mesh(cylGeo(r * 1.12, r, 0.35, seg), wall, x, top + 0.17, z)); top += 0.35; }
  if (roof === 'crenel' || corbel) merlonsRing(g, x, z, top, r * (corbel ? 1.1 : 1.0), wall);
  if (roof === 'cone') {
    const rh = roofH ?? r * 2.4;
    g.add(mesh(new THREE.ConeGeometry(r * overhang, rh, seg), roofMat, x, top + rh / 2, z));
    if (finial) { g.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), M.gold, x, top + rh + 0.05, z)); g.add(mesh(new THREE.ConeGeometry(0.03, 0.5, 6), M.gold, x, top + rh + 0.3, z)); }
    top += rh;
  } else if (roof === 'dome') {
    const d = mesh(new THREE.SphereGeometry(r * 1.02, seg, 10, 0, Math.PI * 2, 0, Math.PI / 2), roofMat, x, top, z);
    d.scale.y = (roofH ?? r) / r;
    g.add(d);
    if (finial) g.add(mesh(new THREE.ConeGeometry(0.06, 0.6, 6), M.gold, x, top + (roofH ?? r) + 0.25, z));
    top += roofH ?? r;
  } else if (roof === 'onion') {
    const R = r * 1.05;
    const pts = [[0, 0], [R * 0.95, 0.05], [R * 1.15, R * 0.45], [R * 0.95, R * 0.9], [R * 0.45, R * 1.3], [R * 0.12, R * 1.65], [0, R * 1.9]].map(([a, b]) => new THREE.Vector2(a, b));
    g.add(mesh(new THREE.LatheGeometry(pts, seg), roofMat, x, top, z));
    if (finial) g.add(mesh(new THREE.ConeGeometry(0.05, 0.6, 6), M.gold, x, top + R * 1.9 + 0.25, z));
    top += R * 1.9;
  }
  if (wins) for (let i = 0; i < winRows; i++) ringWindows(wins, x, z, r, y + h * (0.45 + i * 0.3), Math.max(3, Math.round(r * 3)), i * 0.5);
  return top;
}
export function merlonsRing(g, x, z, y, r, mat) {
  const n = Math.max(6, Math.floor((2 * Math.PI * r) / 0.55));
  for (let i = 0; i < n; i += 2) {
    const a = (i / n) * Math.PI * 2;
    const m = mesh(boxGeo(0.3, 0.38, 0.3), mat, x + Math.sin(a) * r * 0.95, y + 0.19, z + Math.cos(a) * r * 0.95);
    m.rotation.y = a;
    g.add(m);
  }
}
export function merlonsRect(g, x, z, y, w, d, mat, size = 0.32) {
  const step = size * 2;
  for (const [ax, az, len, ry] of [[0, d / 2, w, 0], [0, -d / 2, w, 0], [w / 2, 0, d, Math.PI / 2], [-w / 2, 0, d, Math.PI / 2]]) {
    const n = Math.max(2, Math.floor(len / step));
    for (let i = 0; i <= n; i++) {
      const t = -len / 2 + (i * len) / n;
      const px = ry ? x + ax : x + t, pz = ry ? z + t : z + az;
      const m = mesh(boxGeo(size, size * 1.2, size), mat, px, y + size * 0.6, pz);
      g.add(m);
    }
  }
}
// 四角い塔。roof: 'pyramid' | 'crenel' | 'hip' | 'spire' | 'flat'
export function squareTower(g, { x, z, y = 0, w, d = w, h, wall = M.ashlar, roof = 'pyramid', roofMat = M.slate, roofH, wins, winRows = 2, finial = true, ry = 0 }) {
  const t = sub(g, x, y, z, ry);
  t.add(mesh(boxGeo(w, h, d), wall, 0, h / 2, 0));
  let top = h;
  if (roof === 'crenel') { merlonsRect(t, 0, 0, top, w, d, wall); }
  else if (roof === 'pyramid' || roof === 'spire') {
    const rh = roofH ?? (roof === 'spire' ? Math.max(w, d) * 3 : Math.max(w, d) * 1.1);
    const big = Math.max(w, d);
    const geo = new THREE.ConeGeometry((big / 2) * Math.SQRT2 * 1.08, rh, 4);
    geo.rotateY(Math.PI / 4);
    const m = mesh(geo, roofMat, 0, top + rh / 2, 0);
    m.scale.set(w / big, 1, d / big);
    t.add(m);
    if (finial) t.add(mesh(new THREE.ConeGeometry(0.04, 0.6, 6), M.gold, 0, top + rh + 0.25, 0));
    top += rh;
  } else if (roof === 'hip') {
    const rh = roofH ?? Math.min(w, d) * 0.45;
    const ridge = Math.max(0.2, Math.abs(w - d));
    t.add(mesh(roofGeo(w + 0.5, d + 0.5, w >= d ? ridge : 0.12, w >= d ? 0.12 : ridge, rh, { up: 0, sag: 0.02 }), roofMat, 0, top - 0.02, 0));
    top += rh;
  }
  if (wins) {
    const local = [];
    for (let i = 0; i < winRows; i++) windowSpots(local, 0, 0, w, d, h * (0.45 + i * 0.3), 1.0);
    for (const [lx, ly, lz, lr] of local) {
      const p = V(lx, ly, lz).applyAxisAngle(V(0, 1, 0), ry).add(V(x, y, z));
      wins.push([p.x, p.y, p.z, lr + ry]);
    }
  }
  return y + top;
}
// 切妻の建物（長辺がx方向）。gable の三角の壁も同じ材質
export function gableHall(g, { x, z, y = 0, w, d, h, ry = 0, wall = M.ashlar, roofMat = M.slate, roofH, ov = 0.3, wins, winRows = 1, arch = false, dormers = 0 }) {
  const t = sub(g, x, y, z, ry);
  t.add(mesh(boxGeo(w, h, d), wall, 0, h / 2, 0));
  const rh = roofH ?? d * 0.6;
  const prism = triPrism(d, rh, w);
  prism.rotateY(Math.PI / 2); prism.translate(w / 2, 0, 0);
  t.add(mesh(prism, wall, 0, h, 0));
  const slope = Math.atan2(rh, d / 2);
  const len = Math.hypot(d / 2, rh) + ov;
  for (const s of [-1, 1]) {
    const slab = mesh(boxGeo(w + ov * 2, 0.12, len), roofMat, 0, h + rh / 2 + 0.07, s * (d / 4 + ov * 0.25 * Math.cos(slope)));
    slab.rotation.x = s * slope;
    t.add(slab);
  }
  for (let i = 0; i < dormers; i++) {
    const dx = -w / 2 + ((i + 0.5) * w) / dormers;
    const dm = mesh(boxGeo(0.6, 0.6, 0.6), wall, dx, h + rh * 0.35, d / 2 - rh * 0.35);
    t.add(dm);
    const cap = new THREE.ConeGeometry(0.55, 0.5, 4); cap.rotateY(Math.PI / 4);
    t.add(mesh(cap, roofMat, dx, h + rh * 0.35 + 0.55, d / 2 - rh * 0.35));
  }
  if (wins) {
    const local = [];
    for (let i = 0; i < winRows; i++) windowSpots(local, 0, 0, w, d, h * (winRows === 1 ? 0.55 : 0.35 + i * (0.5 / Math.max(1, winRows - 1))), 1.1);
    for (const [lx, ly, lz, lr] of local) { const p = V(lx, ly, lz).applyAxisAngle(V(0, 1, 0), ry).add(V(x, y, z)); wins.push([p.x, p.y, p.z, lr + ry]); }
  }
  return { top: y + h + rh, group: t };
}
// 寄棟の建物（中国・スペイン風など）
export function hipHall(g, { x, z, y = 0, w, d, h, ry = 0, wall = M.cream, roofMat = M.terracotta, rise, ov = 0.5, up = 0, sag = 0.05, eave = false, wins, winRows = 1 }) {
  const t = sub(g, x, y, z, ry);
  t.add(mesh(boxGeo(w, h, d), wall, 0, h / 2, 0));
  const rh = rise ?? Math.min(w, d) * 0.4;
  const ridge = Math.max(0.15, Math.abs(w - d) + 0.1);
  const wo = w + ov * 2, dO = d + ov * 2;
  t.add(mesh(roofGeo(wo, dO, w >= d ? ridge : 0.12, w >= d ? 0.12 : ridge, rh, { up, sag }), roofMat, 0, h - 0.03, 0));
  if (eave) t.add(mesh(eaveGeo(wo, dO, w, d, { up, drop: 0.15 }), roofMat, 0, h - 0.03, 0));
  if (wins) {
    const local = [];
    for (let i = 0; i < winRows; i++) windowSpots(local, 0, 0, w, d, h * (winRows === 1 ? 0.55 : 0.35 + i * 0.35), 1.1);
    for (const [lx, ly, lz, lr] of local) { const p = V(lx, ly, lz).applyAxisAngle(V(0, 1, 0), ry).add(V(x, y, z)); wins.push([p.x, p.y, p.z, lr + ry]); }
  }
  return { top: y + h + rh, group: t };
}
// 切妻屋根だけ（壁は別に作るとき）
export function gableRoof(g, { x, z, y, w, d, ry = 0, wall = M.ashlar, roofMat = M.slate, roofH, ov = 0.3 }) {
  const t = sub(g, x, y, z, ry);
  const rh = roofH ?? d * 0.6;
  const prism = triPrism(d, rh, w);
  prism.rotateY(Math.PI / 2); prism.translate(w / 2, 0, 0);
  t.add(mesh(prism, wall, 0, 0, 0));
  const slope = Math.atan2(rh, d / 2), len = Math.hypot(d / 2, rh) + ov;
  for (const s of [-1, 1]) {
    const slab = mesh(boxGeo(w + ov * 2, 0.12, len), roofMat, 0, rh / 2 + 0.07, s * (d / 4 + ov * 0.25 * Math.cos(slope)));
    slab.rotation.x = s * slope;
    t.add(slab);
  }
  t.add(mesh(boxGeo(w + ov * 2 + 0.05, 0.12, 0.16), roofMat, 0, rh + 0.06, 0));
  return y + rh;
}
// とんがり屋根だけ
export function coneRoof(g, x, z, y, r, h, mat = M.slate, { seg = 20, finial = true } = {}) {
  g.add(mesh(new THREE.ConeGeometry(r, h, seg), mat, x, y + h / 2, z));
  if (finial) { g.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), M.gold, x, y + h + 0.05, z)); g.add(mesh(new THREE.ConeGeometry(0.03, 0.5, 6), M.gold, x, y + h + 0.3, z)); }
  return y + h;
}
// 丸屋根だけ
export function domeRoof(g, x, z, y, r, h, mat = M.copper, finial = true) {
  const d = mesh(new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat, x, y, z);
  d.scale.y = h / r;
  g.add(d);
  if (finial) g.add(mesh(new THREE.ConeGeometry(0.05, 0.6, 6), M.gold, x, y + h + 0.25, z));
  return y + h;
}
// 柱の列
export function columns(g, pts, { h = 2, r = 0.14, mat = M.marble, capital = true, y = 0 } = {}) {
  const b = new Batch();
  for (const [x, z, yy = y] of pts) {
    b.geo(Object.keys(M).find(k => M[k] === mat) || 'marble', cylGeo(r, r * 1.1, h, 10), x, yy + h / 2, z);
    if (capital) b.box(Object.keys(M).find(k => M[k] === mat) || 'marble', r * 3, 0.14, r * 3, x, yy + h + 0.07, z);
  }
  b.build(g);
}
// 長方形の堀の穴があいた地面
export function pitGround(base, hw, hd, { mat = M.grass, side = M.stone } = {}) {
  const out = 32;
  for (const [gw, gd, x, z] of [
    [64, out - hd, 0, -(hd + (out - hd) / 2)], [64, out - hd, 0, hd + (out - hd) / 2],
    [out - hw, hd * 2, -(hw + (out - hw) / 2), 0], [out - hw, hd * 2, hw + (out - hw) / 2, 0],
  ]) base.add(mesh(boxGeo(gw, 1, gd), [side, side, mat, mat, side, side], x, -0.5, z));
  base.add(mesh(boxGeo(hw * 2, 0.3, hd * 2), M.mud, 0, -1.15, 0));
}
// 坂道（2点を結ぶ板）
export function ramp(g, a, b, w = 2.4, mat = M.gravel, thick = 0.3) {
  const L = a.distanceTo(b);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const s = sub(g, mid.x, mid.y - thick / 2, mid.z, Math.atan2(b.x - a.x, b.z - a.z));
  const m = mesh(boxGeo(w, thick, L), mat);
  m.rotation.x = -Math.atan2(b.y - a.y, Math.hypot(b.x - a.x, b.z - a.z));
  s.add(m);
  return s;
}
// 城壁（上にぎざぎざ）
export function crenelWall(g, x1, z1, x2, z2, { y = 0, h = 2, t = 0.8, wall = M.ashlar, merlon = 0.34 } = {}) {
  const L = Math.hypot(x2 - x1, z2 - z1);
  const ry = Math.atan2(-(z2 - z1), x2 - x1);
  const s = sub(g, (x1 + x2) / 2, y, (z1 + z2) / 2, ry);
  s.add(mesh(boxGeo(L, h, t), wall, 0, h / 2, 0));
  const n = Math.max(2, Math.floor(L / (merlon * 2)));
  for (let i = 0; i <= n; i++) {
    const px = -L / 2 + (i * L) / n;
    for (const side of [-1, 1]) s.add(mesh(boxGeo(merlon, merlon * 1.2, 0.22), wall, px, h + merlon * 0.6, side * (t / 2 - 0.11)));
  }
  return s;
}
export function flagPole(g, x, y, z, kind, { h = 2.2, w = 1.1 } = {}) {
  g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, h, 6), M.iron, x, y + h / 2, z));
  const geo = new THREE.PlaneGeometry(w, w * 0.62, 6, 1);
  geo.translate(w / 2, 0, 0);
  const f = mesh(geo, flagMat(kind), x + 0.03, y + h - w * 0.31, z);
  f.castShadow = false;
  f.userData.base = geo.attributes.position.array.slice();
  f.userData.phase = rnd() * 6;
  f.userData.isFlag = true;
  f.rotation.y = rr(-0.6, 0.6);
  g.add(f);
  return f;
}

// ---------- 地形 ----------
// ごつごつした岩山（上は平ら）。top: 上の面の材質
export function crag(g, { x = 0, z = 0, y = 0, rTop, rBot, h, seg = 16, mat = M.rock, top = M.grass, jitter = 0.18, sx = 1, sz = 1 }) {
  const geo = new THREE.CylinderGeometry(rTop, rBot, h, seg, 5);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const px = p.getX(i), pz = p.getZ(i), py = p.getY(i);
    const r = Math.hypot(px, pz);
    if (r < 1e-4) continue;
    const a = Math.atan2(pz, px);
    const k = 1 + jitter * (Math.sin(a * 3 + py * 0.7) * 0.5 + Math.sin(a * 7.3 + py * 1.9 + 1) * 0.35 + Math.sin(a * 13.1 + py * 3.1) * 0.15);
    p.setXYZ(i, px * k * sx, py, pz * k * sz);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, [mat, top, mat]);
  m.position.set(x, y + h / 2, z);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return y + h;
}
// 山（雪をかぶせることもできる）
export function mountain(g, { x, z, r, h, mat = M.mountain, snow = false, seg = 9, y = 0 }) {
  const geo = new THREE.ConeGeometry(r, h, seg, 4);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const py = p.getY(i);
    const f = 1 + 0.18 * Math.sin(p.getX(i) * 1.7 + p.getZ(i) * 1.3 + py);
    if (py < h / 2 - 0.01) p.setXYZ(i, p.getX(i) * f, py + 0.4 * Math.sin(i * 1.7), p.getZ(i) * f);
  }
  geo.computeVertexNormals();
  g.add(mesh(geo, mat, x, y + h / 2, z));
  if (snow) {
    const sg = new THREE.ConeGeometry(r * 0.36, h * 0.36, seg, 1);
    g.add(mesh(sg, M.snow, x, y + h - h * 0.18 + 0.02, z));
  }
}
export function hill(g, x, z, r, hScale = 0.42, mat = M.grass, y = 0) {
  const h = mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat, x, y, z);
  h.scale.y = hScale;
  g.add(h);
  return h;
}
export function waterPlane(g, w, d, x = 0, z = 0, y = -0.3, mat = M.water) {
  const m = mesh(new THREE.PlaneGeometry(w, d), mat, x, y, z);
  m.rotation.x = -Math.PI / 2;
  m.castShadow = false;
  g.add(m);
  return m;
}
export function ground(g, w, d, x, z, mat = M.grass, y = 0, thick = 1) {
  const sideMat = mat === M.grass ? M.stone : mat;
  g.add(mesh(boxGeo(w, thick, d), [sideMat, sideMat, mat, mat, sideMat, sideMat], x, y - thick / 2, z));
}

// ---------- 木 ----------
const mtx = (x, y, z, s) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rnd() * 6, 0)), V(s, s, s));
export function pineTree(b, x, y, z, s = 1) {
  const m = mtx(x, y, z, s);
  const trunk = new THREE.CylinderGeometry(0.12, 0.2, 2.2, 6); trunk.translate(0, 1.1, 0); trunk.rotateZ(0.12);
  b.add(trunk, 'trunk', m);
  for (const [bx, by, bz, r] of [[0.2, 2.2, 0, 1.0], [-0.6, 1.6, 0.3, 0.75], [0.7, 1.4, -0.3, 0.7], [0.1, 2.75, 0.1, 0.65]]) {
    const g = new THREE.DodecahedronGeometry(r, 0); g.scale(1.3, 0.45, 1.1); g.translate(bx, by, bz);
    b.add(g, rnd() < 0.5 ? 'pine' : 'pineB', m);
  }
}
export function sakuraTree(b, x, y, z, s = 1) {
  const m = mtx(x, y, z, s);
  const trunk = new THREE.CylinderGeometry(0.12, 0.22, 1.6, 6); trunk.translate(0, 0.8, 0);
  b.add(trunk, 'trunk', m);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2, r = i === 0 ? 0 : 0.75;
    const g = new THREE.IcosahedronGeometry(rr(0.55, 0.85), 0);
    g.translate(Math.cos(a) * r, 2.0 + rr(-0.2, 0.45) + (i === 0 ? 0.4 : 0), Math.sin(a) * r);
    b.add(g, rnd() < 0.5 ? 'sakuraA' : 'sakuraB', m);
  }
}
export function roundTree(b, x, y, z, s = 1, leaf = null) {
  const m = mtx(x, y, z, s);
  const trunk = new THREE.CylinderGeometry(0.1, 0.18, 1.4, 6); trunk.translate(0, 0.7, 0);
  b.add(trunk, 'trunk', m);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2, r = i === 0 ? 0 : 0.5;
    const g = new THREE.IcosahedronGeometry(rr(0.55, 0.8), 0);
    g.translate(Math.cos(a) * r, 1.8 + rr(-0.1, 0.4) + (i === 0 ? 0.35 : 0), Math.sin(a) * r);
    b.add(g, leaf || (rnd() < 0.5 ? 'leaf' : 'leafB'), m);
  }
}
export function orangeTree(b, x, y, z, s = 1) {
  roundTree(b, x, y, z, s * 0.75, 'leafDark');
  for (let i = 0; i < 5; i++) {
    const a = rnd() * 6;
    b.geo('orange', new THREE.SphereGeometry(0.1, 6, 4), x + Math.cos(a) * 0.55 * s, y + rr(1.1, 1.7) * s, z + Math.sin(a) * 0.55 * s);
  }
}
export function cypress(b, x, y, z, s = 1) {
  const m = mtx(x, y, z, s);
  const g = new THREE.CylinderGeometry(0.05, 0.42, 3.2, 7, 3);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const py = p.getY(i); const k = 1 + 0.25 * Math.sin((py + 1.6) * 1.4); p.setXYZ(i, p.getX(i) * k, py, p.getZ(i) * k); }
  g.translate(0, 1.9, 0);
  b.add(g, 'leafDark', m);
  const t = new THREE.CylinderGeometry(0.07, 0.1, 0.4, 5); t.translate(0, 0.2, 0);
  b.add(t, 'trunk', m);
}
export function spruce(b, x, y, z, s = 1) {
  const m = mtx(x, y, z, s);
  const t = new THREE.CylinderGeometry(0.08, 0.14, 0.8, 5); t.translate(0, 0.4, 0);
  b.add(t, 'trunk', m);
  for (let i = 0; i < 3; i++) { const c = new THREE.ConeGeometry(1.0 - i * 0.25, 1.4, 7); c.translate(0, 1.2 + i * 0.75, 0); b.add(c, i % 2 ? 'pine' : 'pineB', m); }
}
export function palm(b, x, y, z, s = 1) {
  const m = mtx(x, y, z, s);
  for (let i = 0; i < 6; i++) { const seg = new THREE.CylinderGeometry(0.11, 0.13, 0.55, 6); seg.translate(i * 0.05, 0.28 + i * 0.52, 0); b.add(seg, 'trunk', m); }
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const leafG = new THREE.ConeGeometry(0.22, 1.7, 4);
    leafG.rotateZ(Math.PI / 2 + 0.5); leafG.scale(1, 0.25, 1); leafG.translate(0.75, -0.25, 0); leafG.rotateY(a); leafG.translate(0.3, 3.3, 0);
    b.add(leafG, 'leafB', m);
  }
}

// ---------- 小物 ----------
export function stoneLantern(b, list, x, y, z) {
  b.box('stone', 0.5, 0.2, 0.5, x, y + 0.1, z);
  b.geo('stone', new THREE.CylinderGeometry(0.09, 0.12, 0.6, 8), x, y + 0.5, z);
  b.box('stone', 0.42, 0.08, 0.42, x, y + 0.84, z);
  list.push([x, y + 1.05, z]);
  const cap = new THREE.ConeGeometry(0.42, 0.3, 4); cap.rotateY(Math.PI / 4);
  b.geo('stone', cap, x, y + 1.38, z);
}
export function lampPost(g, list, x, y, z) {
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, 2, 6), M.iron, x, y + 1, z));
  list.push([x, y + 2.1, z]);
}
export function lanternsMesh(list, { size = 0.3, mat = M.lantern, sphere = false } = {}) {
  const geo = sphere ? new THREE.SphereGeometry(size / 2, 10, 8).scale(1, 1.3, 1) : new THREE.BoxGeometry(size, size, size);
  const im = new THREE.InstancedMesh(geo, mat, list.length);
  const m = new THREE.Matrix4();
  list.forEach(([x, y, z], i) => { m.makeTranslation(x, y, z); im.setMatrixAt(i, m); });
  return im;
}
// 町家（日本）
export function machiya(b, x, z, ry, variant) {
  const P = matrixAt(x, 0, z, ry);
  const w = rr(2.2, 2.7), d = 2.2, h = rr(1.3, 1.6);
  const wall = ['houseA', 'houseB', 'houseC'][variant % 3];
  b.box(wall, w, h, d, 0, h / 2, 0, 0, P);
  const two = rnd() < 0.55;
  let top = h;
  if (two) { b.box(wall, w, 0.9, d - 0.5, 0, h + 0.45, -0.25, 0, P); b.box('roof', w + 0.2, 0.08, 0.7, 0, h + 0.02, d / 2 + 0.05, 0, P, -0.35); top = h + 0.9; }
  const rh = 0.75, gw = two ? d - 0.5 : d, zc = two ? -0.25 : 0;
  const prism = triPrism(gw, rh, w); prism.rotateY(Math.PI / 2); prism.translate(w / 2, 0, 0);
  b.geo(wall, prism, 0, top, zc, 0, P);
  const slope = Math.atan2(rh, gw / 2), len = Math.hypot(gw / 2, rh) + 0.4;
  for (const sgn of [-1, 1]) b.box('roof', w + 0.4, 0.1, len, 0, top + rh / 2 + 0.06, zc + sgn * gw / 4, 0, P, sgn * slope);
  b.box('roof', w + 0.45, 0.14, 0.18, 0, top + rh + 0.04, zc, 0, P);
  b.box('lattice', w * 0.8, h * 0.62, 0.06, 0, h * 0.36, d / 2 + 0.03, 0, P);
  b.box(pick(['norenBlue', 'norenRed', 'norenWhite']), 0.8, 0.45, 0.03, rr(-0.5, 0.5), h * 0.6, d / 2 + 0.08, 0, P);
}
// ヨーロッパの家（とんがり屋根）
export function euroHouse(b, x, z, ry, { walls = ['houseA', 'housePink', 'houseYellow', 'houseBlue'], roof = 'slate', y = 0, floors, w, d } = {}) {
  const P = matrixAt(x, y, z, ry);
  w = w ?? rr(1.8, 2.4); d = d ?? rr(1.8, 2.2);
  const fl = floors ?? (rnd() < 0.5 ? 2 : 3);
  const h = fl * 0.95;
  const wall = pick(walls);
  b.box(wall, w, h, d, 0, h / 2, 0, 0, P);
  const rh = d * 0.75;
  const prism = triPrism(d, rh, w); prism.rotateY(Math.PI / 2); prism.translate(w / 2, 0, 0);
  b.geo(wall, prism, 0, h, 0, 0, P);
  const slope = Math.atan2(rh, d / 2), len = Math.hypot(d / 2, rh) + 0.3;
  for (const s of [-1, 1]) b.box(roof, w + 0.25, 0.1, len, 0, h + rh / 2 + 0.06, s * d / 4, 0, P, s * slope);
  b.box('darkWood', 0.1, 0.5, 0.35, w / 2 - 0.4, h + rh * 0.55, 0, 0, P);
  for (let f = 0; f < fl; f++) for (const wx of [-w / 4, w / 4]) b.box('darkWood', 0.3, 0.4, 0.05, wx, 0.55 + f * 0.95, d / 2 + 0.02, 0, P);
  b.box('darkWood', 0.45, 0.7, 0.05, 0, 0.35, d / 2 + 0.03, 0, P);
}
// 地中海風の白い家（平らな屋根 or 低い瓦屋根）
export function whiteHouse(b, x, z, ry, { y = 0, tiled = true, wall = 'houseWhite' } = {}) {
  const P = matrixAt(x, y, z, ry);
  const w = rr(1.6, 2.4), d = rr(1.6, 2.2), h = rr(1.1, 1.9);
  b.box(wall, w, h, d, 0, h / 2, 0, 0, P);
  if (tiled) {
    const g = roofGeo(w + 0.3, d + 0.3, Math.max(0.2, w - d + 0.2), 0.12, 0.5, { up: 0, sag: 0.02, seg: 2, rings: 1 });
    b.geo('terracotta', g, 0, h - 0.02, 0, 0, P);
  } else b.box(wall, w + 0.1, 0.12, d + 0.1, 0, h + 0.06, 0, 0, P);
  b.box('darkWood', 0.35, 0.45, 0.05, rr(-0.3, 0.3), h * 0.6, d / 2 + 0.02, 0, P);
  b.box('darkWood', 0.4, 0.65, 0.05, 0, 0.33, d / 2 + 0.03, 0, P);
}

// ---------- 人・動物・乗り物 ----------
export function person(mat, hat = 'none') {
  const g = new THREE.Group();
  const body = mesh(new THREE.ConeGeometry(0.22, 0.72, 8), mat); body.position.y = 0.36;
  const head = mesh(new THREE.SphereGeometry(0.13, 10, 8), M.skin); head.position.y = 0.82;
  g.add(body, head);
  if (hat === 'straw') { const h = mesh(new THREE.ConeGeometry(0.28, 0.16, 10), M.straw); h.position.y = 0.98; g.add(h); }
  else if (hat === 'bearskin') { const h = mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.38, 10), M.bearskin); h.position.y = 1.05; g.add(h); }
  else if (hat === 'cap') { const h = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 10), M.black); h.position.y = 0.95; g.add(h); }
  else { const hair = mesh(new THREE.SphereGeometry(0.135, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.hair); hair.position.y = 0.84; g.add(hair); }
  return g;
}
export function horse(mat = M.horse) {
  const g = new THREE.Group();
  g.add(mesh(boxGeo(0.34, 0.36, 0.95), mat, 0, 0.72, 0));
  for (const [lx, lz] of [[-0.11, 0.35], [0.11, 0.35], [-0.11, -0.35], [0.11, -0.35]]) g.add(mesh(boxGeo(0.09, 0.55, 0.09), mat, lx, 0.27, lz));
  const neck = mesh(boxGeo(0.18, 0.5, 0.2), mat, 0, 0.98, 0.45); neck.rotation.x = 0.5; g.add(neck);
  g.add(mesh(boxGeo(0.16, 0.18, 0.38), mat, 0, 1.2, 0.62));
  g.add(mesh(boxGeo(0.06, 0.4, 0.06), M.black, 0, 0.72, -0.5));
  return g;
}
export function carriage(bodyMat = M.black, { horses = 2, horseMat = M.horse, driver = true } = {}) {
  const g = new THREE.Group();
  const body = mesh(boxGeo(0.8, 0.7, 1.0), bodyMat, 0, 0.75, 0); g.add(body);
  const roof = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.8, 12, 1, false, 0, Math.PI), bodyMat, 0, 1.1, 0); roof.rotation.z = Math.PI / 2; roof.rotation.y = Math.PI / 2; roof.scale.set(1, 1, 0.45); g.add(roof);
  g.add(mesh(boxGeo(0.82, 0.08, 1.02), M.gold, 0, 1.12, 0));
  for (const [wx, wz, r] of [[-0.45, 0.35, 0.3], [0.45, 0.35, 0.3], [-0.45, -0.35, 0.38], [0.45, -0.35, 0.38]]) {
    const wheel = mesh(new THREE.TorusGeometry(r, 0.04, 6, 16), M.gold, wx, r, wz); wheel.rotation.y = Math.PI / 2; g.add(wheel);
  }
  if (driver) { const p = person(M.redCoat, 'cap'); p.position.set(0, 0.85, 0.75); p.scale.setScalar(0.8); g.add(p); }
  for (let i = 0; i < horses; i++) { const h = horse(horseMat); h.position.set(horses === 1 ? 0 : (i ? 0.25 : -0.25), 0, 1.55); h.scale.setScalar(0.85); g.add(h); }
  return g;
}
export function sheep() {
  const g = new THREE.Group();
  const b = mesh(new THREE.IcosahedronGeometry(0.28, 0), M.sheep, 0, 0.42, 0); b.scale.set(0.9, 0.8, 1.2); g.add(b);
  g.add(mesh(boxGeo(0.14, 0.16, 0.2), M.black, 0, 0.5, 0.35));
  for (const [lx, lz] of [[-0.1, 0.15], [0.1, 0.15], [-0.1, -0.15], [0.1, -0.15]]) g.add(mesh(boxGeo(0.05, 0.25, 0.05), M.black, lx, 0.13, lz));
  return g;
}
export function boat(rowerMat) {
  const g = new THREE.Group();
  g.add(mesh(boxGeo(0.9, 0.3, 2.2), M.boat));
  const bow = mesh(new THREE.ConeGeometry(0.45, 0.8, 4), M.boat, 0, 0, 1.45); bow.rotation.x = Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.scale.set(1, 1, 0.35); g.add(bow);
  const r = person(rowerMat || M.kimono[3], 'straw'); r.position.set(0, 0.15, -0.6); g.add(r);
  return g;
}

// 道に沿って動かすための計算
export function pathPos(pts, u) {
  const segs = []; let total = 0;
  for (let i = 0; i < pts.length - 1; i++) { const l = pts[i].distanceTo(pts[i + 1]); segs.push(l); total += l; }
  let d = (((u % 1) + 1) % 1) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i]) { const f = d / segs[i]; return { p: pts[i].clone().lerp(pts[i + 1], f), dir: pts[i + 1].clone().sub(pts[i]).normalize() }; }
    d -= segs[i];
  }
  return { p: pts[pts.length - 1].clone(), dir: V(0, 0, 1) };
}

const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

// ---------- 表示 ----------
const BUILDERS = {
  himeji: () => import('./castles/himeji.js'),
  neuschwanstein: () => import('./castles/neuschwanstein.js'),
  windsor: () => import('./castles/windsor.js'),
  montsaintmichel: () => import('./castles/montsaintmichel.js'),
  edinburgh: () => import('./castles/edinburgh.js'),
  alhambra: () => import('./castles/alhambra.js'),
  chambord: () => import('./castles/chambord.js'),
  hearst: () => import('./castles/hearst.js'),
  forbiddencity: () => import('./castles/forbiddencity.js'),
  pena: () => import('./castles/pena.js'),
  tsuruga: () => import('./castles/tsuruga.js'),
};

export class CastleView {
  constructor() {
    initAssets();
    // 背景は画面の後ろの画像（朝・夕・夜）を見せるので、3Dの背景はすき通しにする
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.5, 600);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    Object.assign(this.controls, { enableDamping: true, enablePan: false, minDistance: 16, maxDistance: 100, maxPolarAngle: 1.38, autoRotate: true, autoRotateSpeed: 0.35 });
    let idle = null;
    this.controls.addEventListener('start', () => { this.controls.autoRotate = false; clearTimeout(idle); });
    this.controls.addEventListener('end', () => { clearTimeout(idle); idle = setTimeout(() => { this.controls.autoRotate = true; }, 7000); });

    this.hemi = new THREE.HemisphereLight(0xdcefff, 0x5d7a3d, 1.1);
    this.sun = new THREE.DirectionalLight(0xffffff, 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -44, right: 44, top: 44, bottom: -44, near: 1, far: 160 });
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.04;
    this.scene.add(this.hemi, this.sun);
    this.spots = [0, 1, 2].map(() => { const s = new THREE.SpotLight(0xfff0d0, 0, 80, 0.45, 0.6, 1.2); this.scene.add(s, s.target); return s; });
    this.makeSky();
    // 土台（ジオラマの木の台）
    this.scene.add(mesh(boxGeo(68, 3, 68), M.board, 0, -2.6, 0));
    this.scene.add(mesh(boxGeo(69, 0.4, 69), M.darkWood, 0, -4.1, 0));
    this.fx = [];
    this.clock = new THREE.Clock();
    this.time = 'day';
    this.parts = 0;
    this.running = false;
    this.ro = new ResizeObserver(() => this.resize());
  }

  async load(id) {
    if (this.id === id && this.world) return;
    const mod = await BUILDERS[id]();
    this.clearWorld();
    this.id = id;
    setSeed(11);
    const world = new THREE.Group();
    const base = new THREE.Group();
    world.add(base);
    const stages = [];
    for (let i = 0; i < 10; i++) { const g = new THREE.Group(); g.visible = false; stages.push(g); world.add(g); }
    this.updaters = [];
    this.walkers = [];
    this.flags = [];
    const sign = new THREE.Group();
    sign.add(mesh(boxGeo(0.25, 3, 0.25), M.wood, 0, 1.5, 0));
    sign.add(mesh(boxGeo(3.4, 1.6, 0.15), M.sign, 0, 2.6, 0.15));
    sign.add(mesh(new THREE.ConeGeometry(0.5, 1.2, 4), M.norenRed, 0, 3.6, 0));
    world.add(sign);
    this.sign = sign;
    this.world = world;
    this.stages = stages;
    this.focus = V(0, 8, 0);
    const ctx = {
      base, stages, world,
      addUpdater: (stage, fn) => this.updaters.push({ stage, fn }),
      addWalker: (stage, obj, pts, opts = {}) => { this.walkers.push({ stage, obj, pts, u: opts.u ?? rnd(), speed: opts.speed ?? 0.02, lateral: opts.lateral ?? 0, loop: !!opts.loop, bob: opts.bob ?? 0.06, ph: rnd() * 6, yaw: opts.yaw ?? 0 }); },
      setCamera: (pos, target) => { this.camPos = pos; this.camTarget = target; },
      setFocus: (x, y, z, r = 18) => { this.focus = V(x, y, z); this.spotR = r; },
      signAt: (x, y, z) => sign.position.set(x, y, z),
    };
    this.camPos = [38, 30, 50];
    this.camTarget = [0, 6, 2];
    this.spotR = 18;
    mod.build(ctx);
    // 各段階の部品を「下から順」に並べておく（3回に分けて建てるため）
    for (const g of stages) {
      const items = g.children.map(c => { const b = new THREE.Box3().setFromObject(c); return { c, y: b.isEmpty() ? 0 : b.min.y + (b.max.y - b.min.y) * 0.3 }; });
      items.sort((a, b) => a.y - b.y);
      g.userData.order = items.map(it => { it.c.userData.s0y = it.c.scale.y; return it.c; });
    }
    // 旗をなびかせる
    world.traverse(o => { if (o.userData.isFlag) this.flags.push(o); });
    // 鳥・人の動き
    this.updaters.push({ stage: -1, fn: (t, dt) => this.updateWalkers(t, dt) });
    this.scene.add(world);
    world.traverse(o => { if (o.isMesh && o.castShadow === undefined) o.castShadow = true; });
    this.camera.position.set(...this.camPos);
    this.controls.target.set(...this.camTarget);
    this.controls.update();
    this.spots.forEach((s, i) => {
      const a = (i / 3) * Math.PI * 2 + 0.6;
      s.position.set(this.focus.x + Math.cos(a) * this.spotR, 1, this.focus.z + Math.sin(a) * this.spotR);
      s.target.position.copy(this.focus);
    });
    this.parts = -1;
  }
  clearWorld() {
    if (!this.world) return;
    this.scene.remove(this.world);
    this.world.traverse(o => { if (o.geometry && !Object.values(winGeos).includes(o.geometry)) o.geometry.dispose(); });
    this.world = null;
  }

  updateWalkers(t, dt) {
    for (const w of this.walkers) {
      if (!this.stages[w.stage]?.visible) continue;
      w.u += w.speed * dt;
      let u = w.u, back = false;
      if (!w.loop) { u = w.u % 2; if (u > 1) { u = 2 - u; back = true; } }
      const { p, dir } = pathPos(w.pts, u);
      const d = back ? dir.clone().negate() : dir;
      const side = V(-d.z, 0, d.x).multiplyScalar(w.lateral * (back ? -1 : 1));
      w.obj.position.copy(p).add(side);
      w.obj.position.y += Math.abs(Math.sin(t * 8 + w.ph)) * w.bob;
      w.obj.rotation.y = Math.atan2(d.x, d.z) + w.yaw;
    }
    for (const f of this.flags) {
      if (!f.visible) continue;
      const a = f.geometry.attributes.position, base = f.userData.base;
      for (let i = 0; i < a.count; i++) { const x = base[i * 3]; a.array[i * 3 + 2] = Math.sin(t * 3 + x * 5 + f.userData.phase) * 0.12 * x; }
      a.needsUpdate = true;
    }
  }

  makeSky() {
    const sky = stops => {
      const c = document.createElement('canvas'); c.width = 4; c.height = 256;
      const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256);
      stops.forEach(([p, col]) => gr.addColorStop(p, col)); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    };
    this.skies = {
      day: sky([[0, '#5aa9e6'], [0.6, '#bfe3ff'], [1, '#fdf6e3']]),
      evening: sky([[0, '#4a4e8f'], [0.45, '#f08a5d'], [0.8, '#ffc88a'], [1, '#ffe7c2']]),
      night: sky([[0, '#060b1f'], [0.6, '#13204a'], [1, '#2c3a6b']]),
    };
    const N = 500, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3);
    setSeed(3);
    for (let i = 0; i < N; i++) { const th = rnd() * Math.PI * 2, ph = rr(0.05, 1.2); p[i * 3] = Math.cos(th) * Math.cos(ph) * 220; p[i * 3 + 1] = Math.sin(ph) * 220; p[i * 3 + 2] = Math.sin(th) * Math.cos(ph) * 220; }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    this.stars = new THREE.Points(g, new THREE.PointsMaterial({ map: TEX.dot, size: 2.2, transparent: true, depthWrite: false }));
    this.scene.add(this.stars);
  }

  setTime(mode) {
    this.time = mode;
    const done = this.parts >= 30;
    const P = {
      day: { sky: 'day', hemi: [0xdcefff, 0x5d7a3d, 1.1], sun: [0xffffff, 2.6, [30, 45, 25]], win: 0, lan: 0.05, cho: 0.1, spot: 0, stars: false, exp: 1.0, glow: 1 },
      evening: { sky: 'evening', hemi: [0xffd7b0, 0x4a3b5a, 0.7], sun: [0xffa66b, 1.9, [-40, 14, 22]], win: 0.6, lan: 0.8, cho: 0.9, spot: done ? 25 : 0, stars: false, exp: 1.0, glow: 0.6 },
      night: { sky: 'night', hemi: [0x5a6ea8, 0x1a1f33, 0.35], sun: [0x9fb4ff, 0.55, [-20, 40, -30]], win: 2.2, lan: 3, cho: 3, spot: done ? 90 : 0, stars: true, exp: 1.15, glow: 0.25 },
    }[mode];
    this.scene.background = null;
    this.hemi.color.set(P.hemi[0]); this.hemi.groundColor.set(P.hemi[1]); this.hemi.intensity = P.hemi[2];
    this.sun.color.set(P.sun[0]); this.sun.intensity = P.sun[1]; this.sun.position.set(...P.sun[2]);
    M.window.emissiveIntensity = P.win;
    M.lantern.emissiveIntensity = P.lan;
    M.chochin.emissiveIntensity = P.cho;
    for (const k of ['plaster', 'eave']) M[k].emissive.setScalar(0.23 * P.glow);
    for (const k of ['limestone', 'cream']) M[k].emissive.setScalar(0.13 * P.glow);
    M.houseWhite.emissive.setScalar(0.15 * P.glow);
    this.spots.forEach(s => { s.intensity = P.spot; });
    this.stars.visible = false;
    this.renderer.toneMappingExposure = P.exp;
  }

  // n = 建てたパーツ数（0〜30）。1つの段階を3回に分けて、下の部品から順に見せる
  setParts(n, animate) {
    const PER = 3;
    this.parts = n;
    this.previewing = false;
    this.childAnims = [];
    if (this.sign) this.sign.visible = n === 0;
    const newest = n > 0 ? Math.ceil(n / PER) - 1 : -1;
    this.stages.forEach((g, i) => {
      const k = Math.max(0, Math.min(PER, n - i * PER));
      const order = g.userData.order || [];
      g.userData.anim = null;
      if (k === 0) { g.visible = false; return; }
      g.visible = true;
      const isNew = animate && i === newest;
      if (order.length >= PER) {
        g.scale.set(1, 1, 1);
        const cnt = Math.ceil((order.length * k) / PER);
        const prev = isNew ? Math.ceil((order.length * (k - 1)) / PER) : cnt;
        order.forEach((c, j) => {
          c.visible = j < cnt;
          c.scale.y = c.userData.s0y;
          if (c.visible && j >= prev) { c.scale.y = 0.001; this.childAnims.push({ c, t: 0 }); }
        });
      } else {
        order.forEach(c => { c.visible = true; c.scale.y = c.userData.s0y; });
        const to = k / PER;
        if (isNew) { g.userData.anim = { t: 0, from: (k - 1) / PER, to }; g.scale.set(1, Math.max(0.001, (k - 1) / PER), 1); }
        else g.scale.set(1, to, 1);
      }
      if (isNew) this.dust(g);
    });
    M.gold.emissive.set(n >= 30 ? 0x6b4a00 : 0x3a2800);
    this.setTime(this.time);
  }
  // 完成図を見る
  preview(on) {
    if (on) {
      this.previewing = true;
      this.sign.visible = false;
      this.childAnims = [];
      this.stages.forEach(g => {
        g.visible = true; g.scale.set(1, 1, 1); g.userData.anim = null;
        (g.userData.order || []).forEach(c => { c.visible = true; c.scale.y = c.userData.s0y; });
      });
      const keep = this.parts; this.parts = 30; this.setTime(this.time); this.parts = keep;
    } else this.setParts(this.parts, false);
  }

  dust(group) {
    const box = new THREE.Box3().setFromObject(group);
    if (box.isEmpty()) return;
    const c = box.getCenter(V(0, 0, 0)), size = box.getSize(V(0, 0, 0));
    const N = 120, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3), v = [];
    for (let i = 0; i < N; i++) {
      p[i * 3] = c.x + rr(-0.5, 0.5) * size.x; p[i * 3 + 1] = Math.max(0.3, box.min.y + 0.3); p[i * 3 + 2] = c.z + rr(-0.5, 0.5) * size.z;
      v.push([rr(-2, 2), rr(1, 4), rr(-2, 2)]);
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const mat = new THREE.PointsMaterial({ map: TEX.dot, size: 1.4, color: 0xfff3d6, transparent: true, depthWrite: false, opacity: 0.9 });
    const pts = new THREE.Points(g, mat);
    this.scene.add(pts);
    this.fx.push({ life: 1.6, t: 0, update: (dt, f) => {
      for (let i = 0; i < N; i++) { p[i * 3] += v[i][0] * dt; p[i * 3 + 1] += v[i][1] * dt; p[i * 3 + 2] += v[i][2] * dt; }
      g.attributes.position.needsUpdate = true; mat.opacity = 0.9 * (1 - f);
    }, dispose: () => { this.scene.remove(pts); g.dispose(); mat.dispose(); } });
  }
  celebrate() {
    let n = 0;
    const fire = () => { if (n++ > 14) return; this.firework(V(this.focus.x + rr(-14, 14), rr(18, 28), this.focus.z + rr(-10, 10))); setTimeout(fire, rr(250, 600)); };
    fire();
  }
  firework(at) {
    const N = 160, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3), v = [];
    for (let i = 0; i < N; i++) {
      p[i * 3] = at.x; p[i * 3 + 1] = at.y; p[i * 3 + 2] = at.z;
      const u = rr(-1, 1), th = rr(0, Math.PI * 2), s = Math.sqrt(1 - u * u), sp = rr(7, 10);
      v.push([s * Math.cos(th) * sp, u * sp, s * Math.sin(th) * sp]);
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const mat = new THREE.PointsMaterial({ map: TEX.dot, size: 1.1, color: new THREE.Color().setHSL(rnd(), 0.9, 0.62), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const pts = new THREE.Points(g, mat);
    this.scene.add(pts);
    this.fx.push({ life: 2.2, t: 0, update: (dt, f) => {
      for (let i = 0; i < N; i++) { v[i][1] -= 5 * dt; v[i][0] *= 0.985; v[i][2] *= 0.985; p[i * 3] += v[i][0] * dt; p[i * 3 + 1] += v[i][1] * dt; p[i * 3 + 2] += v[i][2] * dt; }
      g.attributes.position.needsUpdate = true; mat.opacity = 1 - f * f;
    }, dispose: () => { this.scene.remove(pts); g.dispose(); mat.dispose(); } });
  }

  attach(container) {
    this.container = container;
    container.appendChild(this.renderer.domElement);
    this.ro.disconnect(); this.ro.observe(container);
    this.resize();
    if (!this.running) { this.running = true; this.clock.getDelta(); this.loop(); }
  }
  detach() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.renderer.domElement.remove();
  }
  resize() {
    if (!this.container) return;
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 1 ? 52 : 38;
    this.camera.updateProjectionMatrix();
  }
  loop() {
    if (!this.running) return;
    this.raf = requestAnimationFrame(() => this.loop());
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    TEX.water.offset.x += dt * 0.01; TEX.water.offset.y += dt * 0.006;
    if (this.stages) {
      for (const g of this.stages) {
        const a = g.userData.anim;
        if (a) {
          a.t += dt / 1.3; const k = Math.min(1, a.t);
          g.scale.set(1, Math.max(0.001, a.from + (a.to - a.from) * easeOutBack(k)), 1);
          if (k >= 1) { g.scale.set(1, a.to, 1); g.userData.anim = null; }
        }
      }
      for (let i = (this.childAnims || []).length - 1; i >= 0; i--) {
        const ca = this.childAnims[i];
        ca.t += dt / 1.1; const k = Math.min(1, ca.t);
        ca.c.scale.y = Math.max(0.001, ca.c.userData.s0y * easeOutBack(k));
        if (k >= 1) { ca.c.scale.y = ca.c.userData.s0y; this.childAnims.splice(i, 1); }
      }
      for (const u of this.updaters) if (u.stage < 0 || this.stages[u.stage].visible) u.fn(t, dt);
    }
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i]; f.t += dt; const k = f.t / f.life;
      if (k >= 1) { f.dispose(); this.fx.splice(i, 1); } else f.update(dt, k);
    }
    this.controls.update(dt);
    this.renderer.render(this.scene, this.camera);
  }
}

// 歩く人たちをまとめて置く
export function crowd(ctx, stage, pts, n, { mats = M.clothes, hats = ['none'], speed = [0.012, 0.025], lateral = 0.6, loop = false, scale = 1 } = {}) {
  for (let i = 0; i < n; i++) {
    const p = person(pick(mats), pick(hats));
    p.scale.setScalar(scale);
    ctx.stages[stage].add(p);
    ctx.addWalker(stage, p, pts, { u: i / n, speed: rr(...speed), lateral: (i % 2 ? 1 : -1) * lateral, loop });
  }
}
// 鳥の群れ
export function birds(ctx, stage, n = 6, { r = [14, 26], h = [20, 26], cx = 0, cz = 0 } = {}) {
  const list = [];
  for (let i = 0; i < n; i++) {
    const bg = new THREE.Group();
    const wl = mesh(boxGeo(0.7, 0.04, 0.22), M.bird, -0.3, 0, 0), wr = mesh(boxGeo(0.7, 0.04, 0.22), M.bird, 0.3, 0, 0);
    bg.add(wl, wr); ctx.stages[stage].add(bg);
    list.push({ g: bg, wl, wr, r: rr(...r), h: rr(...h), sp: rr(0.15, 0.25), ph: rnd() * 6 });
  }
  ctx.addUpdater(stage, t => {
    for (const b of list) {
      const a = t * b.sp + b.ph;
      b.g.position.set(cx + Math.cos(a) * b.r, b.h + Math.sin(t + b.ph) * 0.8, cz + Math.sin(a) * b.r);
      b.g.rotation.y = -a;
      const f = Math.sin(t * 9 + b.ph) * 0.5; b.wl.rotation.z = f; b.wr.rotation.z = -f;
    }
  });
}
// 舞う花びら・葉っぱ
export function petals(ctx, stage, { n = 260, tex = TEX.petal, size = 0.35, color = 0xffffff, area = 30, top = 12 } = {}) {
  const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { p[i * 3] = rr(-area, area); p[i * 3 + 1] = rr(0, top); p[i * 3 + 2] = rr(-area, area); }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  ctx.stages[stage].add(new THREE.Points(g, new THREE.PointsMaterial({ map: tex, size, color, transparent: true, depthWrite: false, alphaTest: 0.1 })));
  ctx.addUpdater(stage, (t, dt) => {
    for (let i = 0; i < n; i++) {
      p[i * 3 + 1] -= dt * 0.7; p[i * 3] += Math.sin(t * 0.8 + i) * dt * 0.6; p[i * 3 + 2] += Math.cos(t * 0.6 + i * 1.3) * dt * 0.3 + dt * 0.2;
      if (p[i * 3 + 1] < 0) { p[i * 3 + 1] = top; p[i * 3] = rr(-area, area); p[i * 3 + 2] = rr(-area, area); }
    }
    g.attributes.position.needsUpdate = true;
  });
}
// 吊りちょうちん・電球の列
export function lightString(g, pts, { mat = M.chochin, size = 0.3, sphere = true, step = 1.4 } = {}) {
  const list = [];
  const b = new Batch();
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], c = pts[i + 1];
    const L = a.distanceTo(c), n = Math.max(1, Math.floor(L / step));
    for (let k = 0; k <= n; k++) { const p = a.clone().lerp(c, k / n); list.push([p.x, p.y - 0.15, p.z]); }
    const mid = a.clone().add(c).multiplyScalar(0.5);
    const ry = Math.atan2(-(c.z - a.z), c.x - a.x);
    b.box('darkWood', L, 0.03, 0.03, mid.x, mid.y, mid.z, ry);
  }
  b.build(g);
  g.add(lanternsMesh(list, { size, mat, sphere }));
}
