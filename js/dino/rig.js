// AIで作った 恐竜の 3D（GLB）に、あとから 骨を 入れて 動かす
// 使い方：const dino = await loadGLBDino('assets/dino/trex.glb', TREX_RIG);
// cfg の 座標は「しっぽの先 x=0 → 頭の先 x=length、足の うら y=0、からだの まんなか z=0」に そろえた 単位
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DinoBase } from './dinoBase.js';
import { GrowthLook, addFluffWeights } from './look.js';

const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export async function loadGLBDino(url, cfg) {
  const gltf = await new GLTFLoader().loadAsync(url);
  return new GLBDino(gltf.scene, cfg);
}

// 点 p と 線分 a-b の いちばん 近い ところ（f：0〜1）と きょり
function segInfo(p, a, b) {
  const ab = b.clone().sub(a), t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / ab.lengthSq()));
  return { f: t, d: a.clone().addScaledVector(ab, t).distanceTo(p) };
}
// 折れ線の どの 区間に いちばん 近いか
function polyInfo(p, pts) {
  let best = { i: 0, f: 0, d: Infinity };
  for (let i = 0; i < pts.length - 1; i++) { const s = segInfo(p, pts[i], pts[i + 1]); if (s.d < best.d) best = { i, f: s.f, d: s.d }; }
  return best;
}

// 愛嬌の ある 目（琥珀色・つやつや・白い光）。AIの 目は 小さく くらいので 上に かさねる
const EYE_MAT = { ball: null, pupil: null, hi: null };
function eyeMats() {
  EYE_MAT.ball ||= new THREE.MeshPhysicalMaterial({ color: 0xd8962a, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 });
  EYE_MAT.pupil ||= new THREE.MeshPhysicalMaterial({ color: 0x120b05, roughness: 0.08, clearcoat: 1 });
  EYE_MAT.hi ||= new THREE.MeshBasicMaterial({ color: 0xffffff });
  return EYE_MAT;
}
function makeEye(side, r) {
  const m = eyeMats(), k = r / 0.09;
  const inner = new THREE.Group(); inner.scale.setScalar(k);
  inner.add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 16), m.ball));
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.058, 20, 14), m.pupil); pupil.position.set(0.024, 0.006, side * 0.05); inner.add(pupil);
  const hi = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), m.hi); hi.position.set(0.05, 0.042, side * 0.083); inner.add(hi);
  const hi2 = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), m.hi); hi2.position.set(0.0, -0.026, side * 0.094); inner.add(hi2);
  const eg = new THREE.Group(); eg.add(inner);
  return eg;
}

export class GLBDino extends DinoBase {
  constructor(scene, cfg) {
    super(cfg);
    this.cfgRig = cfg;
    const L = cfg.length || 10;
    // 1. 向きと 大きさを そろえる
    scene.updateMatrixWorld(true);
    const norm = new THREE.Matrix4().makeRotationY(cfg.yaw || 0);
    const box = new THREE.Box3();
    const parts = [];
    scene.traverse(o => {
      if (!o.isMesh) return;
      const g = o.geometry.clone();
      g.applyMatrix4(o.matrixWorld); g.applyMatrix4(norm);
      g.deleteAttribute('skinIndex'); g.deleteAttribute('skinWeight');
      g.computeBoundingBox(); box.union(g.boundingBox);
      parts.push({ g, mat: o.material });
    });
    const s = L / (box.max.x - box.min.x);
    const fix = new THREE.Matrix4().makeScale(s, s, s).premultiply(new THREE.Matrix4().makeTranslation(-box.min.x * s, -box.min.y * s, -((box.min.z + box.max.z) / 2) * s));
    for (const p of parts) { p.g.applyMatrix4(fix); if (!p.g.attributes.normal) p.g.computeVertexNormals(); }

    // 2. 骨を つくる
    const sp = cfg.spine.map(q => V(q[0], q[1]));
    const H = cfg.hip, K = sp.length;
    const bones = sp.map(() => new THREE.Bone());
    sp.forEach((p, i) => {
      const par = i === H ? null : i < H ? i + 1 : i - 1;
      if (par === null) bones[i].position.copy(p);
      else { bones[i].position.copy(p).sub(sp[par]); bones[par].add(bones[i]); }
    });
    const all = [...bones];
    const addBone = (parentIdx, parentPos, pos) => { const b = new THREE.Bone(); b.position.copy(pos).sub(parentPos); (typeof parentIdx === 'number' ? all[parentIdx] : parentIdx).add(b); all.push(b); return all.length - 1; };
    // 足（左右）
    const legDefs = [];
    for (const side of [-1, 1]) {
      // cfg.legsLR = { L: {hip,knee,ankle,toe}, R: {...} }（z は +が L）／ cfg.legs = 左右おなじ
      const c = cfg.legsLR ? cfg.legsLR[side > 0 ? 'L' : 'R'] : cfg.legs;
      const zOf = q => (cfg.legsLR ? (q[2] ?? c.hip[2]) : c.hip[2] * side);
      const pts = [V(c.hip[0], c.hip[1], zOf(c.hip)), V(c.knee[0], c.knee[1], zOf(c.knee)), V(c.ankle[0], c.ankle[1], zOf(c.ankle)), V(c.toe[0], c.toe[1], zOf(c.toe))];
      const iHip = addBone(H, sp[H], pts[0]);
      const iKnee = addBone(all[iHip], pts[0], pts[1]);
      const iAnk = addBone(all[iKnee], pts[1], pts[2]);
      const iFoot = addBone(all[iAnk], pts[2], pts[3]);
      legDefs.push({ side, pts, idx: [iHip, iKnee, iAnk, iFoot] });
    }
    // うで（あれば）
    const armDefs = [];
    if (cfg.arms) {
      const c = cfg.arms, near = polyInfo(V(c.shoulder[0], c.shoulder[1]), sp).i + 1;
      for (const side of [-1, 1]) {
        const z = c.shoulder[2] * side;
        const pts = [V(c.shoulder[0], c.shoulder[1], z), V(c.hand[0], c.hand[1], z)];
        const iSh = addBone(near, sp[near], pts[0]);
        armDefs.push({ side, pts, idx: [iSh] });
      }
    }
    // あご（あれば）
    let jawIdx = -1;
    const headPos = sp[K - 1];
    if (cfg.jaw) jawIdx = addBone(K - 1, headPos, V(cfg.jaw.pivot[0], cfg.jaw.pivot[1]));

    // 3. 皮ふの どこが どの 骨に ついていくか（近い 骨ほど 強く）
    // こしが まんなか（原点）に くるように ずらす
    const inner = new THREE.Group(); inner.position.x = -sp[H].x; this.group.add(inner);
    inner.add(bones[H]);
    this.group.updateMatrixWorld(true);
    const skeleton = new THREE.Skeleton(all);   // 骨の 位置が きまってから 作る
    this.meshes = [];
    for (const { g, mat } of parts) {
      const pos = g.attributes.position, n = pos.count;
      const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
      const v = new THREE.Vector3();
      for (let k = 0; k < n; k++) {
        v.fromBufferAttribute(pos, k);
        const flat = V(v.x, v.y);
        const spi = polyInfo(flat, sp);
        const ws = [];
        const f = sstep(0, 1, spi.f);
        let spineW = 1;
        // 足
        for (const L2 of legDefs) {
          if (v.z * L2.side < -0.05 || v.y > L2.pts[0].y + (cfg.legTop ?? 0.25)) continue;
          const li = polyInfo(v, L2.pts);
          const dSpine = spi.d;
          const w = sstep(0.9, 0.45, li.d / Math.max(0.001, dSpine));
          if (w <= 0) continue;
          const seg = li.i, lf = li.f;
          const a = L2.idx[seg], b = L2.idx[Math.min(3, seg + 1)];
          const blend = sstep(0.75, 1, lf);
          ws.push([a, w * (1 - blend)], [b, w * blend]);
          spineW = Math.min(spineW, 1 - w);
        }
        // うで
        for (const A of armDefs) {
          if (v.z * A.side < 0) continue;
          const ai = segInfo(v, A.pts[0], A.pts[1]);
          const w = sstep(0.8, 0.4, ai.d / Math.max(0.001, spi.d));
          if (w <= 0) continue;
          ws.push([A.idx[0], w]); spineW = Math.min(spineW, 1 - w);
        }
        // あご
        if (jawIdx >= 0) {
          const j = cfg.jaw, x0 = j.pivot[0], y0 = j.pivot[1], x1 = j.tip[0], y1 = j.tip[1];
          if (v.x > x0 - 0.05) {
            const lineY = y0 + (y1 - y0) * Math.min(1, Math.max(0, (v.x - x0) / (x1 - x0)));
            const w = sstep(0.04, -0.04, v.y - lineY) * sstep(x0 - 0.05, x0 + 0.15, v.x);
            if (w > 0) { ws.push([jawIdx, w * spineW]); spineW *= 1 - w; }
          }
        }
        ws.push([Math.min(K - 1, spi.i), spineW * (1 - f)], [Math.min(K - 1, spi.i + 1), spineW * f]);
        ws.sort((a, b) => b[1] - a[1]);
        const top = ws.slice(0, 4), sum = top.reduce((s2, x) => s2 + x[1], 0) || 1;
        top.forEach(([bi, w], m) => { si[k * 4 + m] = bi; sw[k * 4 + m] = w / sum; });
      }
      g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
      g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
      const mm = mat.clone();
      if (mm.isMeshStandardMaterial) { mm.metalness = 0; mm.metalnessMap = null; mm.roughness = cfg.roughness ?? 0.85; mm.roughnessMap = null; if (cfg.tint) mm.color.setRGB(...cfg.tint); else mm.color.multiplyScalar(cfg.bright ?? 1); }
      const m = new THREE.SkinnedMesh(g, mm);
      m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
      inner.add(m);
      this.meshes.push(m);
    }
    this.group.updateMatrixWorld(true);
    for (const m of this.meshes) m.bind(skeleton, m.matrixWorld);

    // 4. 動きの 役わり（DinoBase が つかう）
    this.bones = bones;
    const neckFrom = cfg.neckFrom ?? K - 3;
    const neck = []; for (let i = neckFrom; i < K; i++) neck.push(i);
    const tail = []; for (let i = H - 1; i >= 0; i--) tail.push(i);
    this.rig = { hip: H, hipRestY: sp[H].y, neck, yaw: neck.slice(-2), tail };
    this.head = bones[K - 1];
    this.jaw = jawIdx >= 0 ? all[jawIdx] : null;
    this.jawMul = cfg.jawMul ?? 0.5;   // 1まいの 皮ふ なので、口は 大きく 開けすぎない
    this.legs = legDefs.map(d => ({ hip: all[d.idx[0]], knee: all[d.idx[1]], ank: all[d.idx[2]], foot: all[d.idx[3]], s: d.side }));
    this.arms = armDefs.map(d => ({ sh: all[d.idx[0]] }));
    this.snoutLocal = V(cfg.snout[0], cfg.snout[1]).sub(headPos);
    this.anchors = { head: this.head, neck: bones[cfg.neckFrom ?? K - 3], back: bones[Math.min(K - 1, H + 1)] };
    // 目（cfg.eyes = { pos: [x, y, z], r }）。DinoBase が まばたき・にっこりを する
    this.eyes = [];
    if (cfg.eyes) {
      const [ex, ey, ez] = cfg.eyes.pos;
      for (const side of [-1, 1]) {
        const eg = makeEye(side, cfg.eyes.r);
        eg.position.set(ex, ey, ez * side).sub(headPos);
        eg.traverse(o => { if (o.isMesh) o.castShadow = false; });
        this.head.add(eg);
        this.eyes.push(eg);
      }
    }
    this.accFit = cfg.acc || {};
    // 5. 産毛と 色
    if (cfg.fluff !== false) {
      // 毛は 大きな 部品（体・頭）だけに はやす（歯や つめには はやさない）
      const maxV = Math.max(...this.meshes.map(m => m.geometry.attributes.position.count));
      const big = this.meshes.filter(m => m.geometry.attributes.position.count >= maxV * 0.15);
      for (const m of big) addFluffWeights(m.geometry, { neckX: cfg.neckX ?? 0.75 });
      this.look = new GrowthLook({ colorShift: cfg.colorShift ?? false, skinMaterials: this.meshes.map(m => m.material), fluffMeshes: big, fluffLen: cfg.fluffLen ?? 0.14, density: cfg.fluffDensity ?? 46, spotScale: cfg.spotScale ?? 2.6, layers: 12 });
    }
  }
}

// ---------- プログラム製ティラノを「GLBのかわり」に使って 骨入れを ためす ----------
// （本物の GLB が とどくまでの テスト用）
export function bakeStatic(obj) {
  const scene = new THREE.Group();
  obj.updateMatrixWorld(true);
  obj.traverse(o => {
    if (!o.isMesh || o.userData.fluffShell) return;
    const g = o.geometry.clone();
    g.deleteAttribute('skinIndex'); g.deleteAttribute('skinWeight'); g.deleteAttribute('fluffW');
    g.applyMatrix4(o.matrixWorld);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: !!g.attributes.color, color: g.attributes.color ? 0xffffff : (o.material.color?.getHex() ?? 0xffffff), roughness: 0.7 }));
    scene.add(m);
  });
  return scene;
}
// プログラム製ティラノの 骨の 位置（しっぽの先 x=0）
export const PROTO_TREX_RIG = {
  length: 10.29, hip: 7, neckFrom: 10,
  spine: [[0, 1.85], [0.9, 2.0], [1.8, 2.2], [2.7, 2.4], [3.6, 2.56], [4.5, 2.68], [5.4, 2.76], [6.2, 2.8], [7.0, 2.78], [7.75, 2.72], [8.35, 2.8], [8.75, 3.02], [9.05, 3.22]],
  legs: { hip: [6.25, 2.45, 0.5], knee: [6.63, 1.4], ankle: [6.13, 0.5], toe: [6.31, 0.08] },
  arms: { shoulder: [8.0, 2.37, 0.42], hand: [8.4, 1.95] },
  jaw: { pivot: [9.03, 2.99], tip: [10.15, 2.88] },
  snout: [10.15, 2.8],
  neckX: 0.9,
  scale: [0.17, 0.58], headScale: [1, 1], eyeScale: [1, 1],
};

// ---------- AIで 作った ティラノ（TRELLIS.2） ----------
export const TREX_ADULT_RIG = {
  length: 10.29, yaw: Math.PI / 2, hip: 6, neckFrom: 8,
  spine: [[0.1, 2.57], [1.0, 2.72], [2.0, 2.72], [3.0, 2.64], [4.0, 2.6], [5.1, 2.62], [6.4, 2.75], [7.3, 2.85], [8.0, 3.05], [8.45, 3.35], [8.85, 3.45]],
  legsLR: {
    L: { hip: [6.3, 2.4, 0.55], knee: [5.95, 1.55, 0.6], ankle: [5.3, 1.1, 0.6], toe: [5.25, 0.15, 0.62] },
    R: { hip: [6.6, 2.4, -0.5], knee: [6.75, 1.6, -0.55], ankle: [6.38, 0.95, -0.58], toe: [6.72, 0.15, -0.62] },
  },
  legTop: 0.15,
  arms: { shoulder: [7.85, 2.5, 0.42], hand: [8.25, 1.85] },
  jaw: { pivot: [8.9, 3.05], tip: [10.2, 3.02] }, jawMul: 0.45,
  snout: [10.25, 3.05],
  neckX: 0.8, fluffLen: 0.1, tint: [1.6, 1.45, 1.22],
  eyes: { pos: [9.4, 3.71, 0.22], r: 0.13 },
  scale: [0.17, 0.58], headScale: [1, 1], eyeScale: [1, 1],
  acc: { head: { pos: [-0.25, 0.0, 0], scale: 1.35 }, neck: { pos: [0, 0, 0], scale: 1.15 }, back: { pos: [0, 0.35, 0], scale: 1.1 } },
};
export const TREX_BABY_RIG = {
  length: 10, yaw: Math.PI / 2, hip: 5, neckFrom: 7,
  spine: [[0.1, 2.78], [1.2, 2.86], [2.4, 2.74], [3.5, 2.66], [4.6, 2.62], [5.6, 2.75], [6.4, 3.1], [7.0, 3.6], [7.4, 4.0], [7.8, 4.3]],
  legsLR: {
    L: { hip: [5.5, 2.6, 0.8], knee: [5.3, 1.6, 0.85], ankle: [4.65, 0.9, 0.9], toe: [4.75, 0.15, 0.95] },
    R: { hip: [5.8, 2.6, -0.85], knee: [5.75, 1.6, -0.9], ankle: [5.4, 0.9, -0.95], toe: [5.7, 0.15, -1.0] },
  },
  legTop: 0.1,
  arms: { shoulder: [6.9, 3.2, 0.55], hand: [7.3, 2.3] },
  jaw: { pivot: [8.2, 3.9], tip: [9.9, 3.85] }, jawMul: 0.35,
  snout: [9.95, 3.9],
  neckX: 0.7, fluffLen: 0.14, tint: [1.3, 1.22, 1.1],
  eyes: { pos: [8.62, 4.57, 0.5], r: 0.27 },
  scale: [0.2, 0.4], headScale: [1, 1], eyeScale: [1, 1],
  acc: { head: { pos: [-0.5, 0.05, 0], scale: 2.1 }, neck: { pos: [0, -0.1, 0], scale: 1.8 }, back: { pos: [0, 0.6, 0], scale: 1.6 } },
};
