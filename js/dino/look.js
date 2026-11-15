// 育ちぐあいで 見た目を 変える：産毛（ふわふわの毛）と 色
// どの 恐竜の 3D（プログラム製 / AIで作ったGLB）にも あとから つけられる
import * as THREE from 'three';

const NOISE = /* glsl */`
float lkHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float lkNoise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(lkHash(i), lkHash(i + vec3(1,0,0)), f.x), mix(lkHash(i + vec3(0,1,0)), lkHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(lkHash(i + vec3(0,0,1)), lkHash(i + vec3(1,0,1)), f.x), mix(lkHash(i + vec3(0,1,1)), lkHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}`;

// 毛が 最後まで のこる ところほど 1（首の うしろ → せなか → しっぽ → おなか）
// head：頭の向き（+1 = x が 大きい ほうが 頭）、neckX：首の 位置（モデルの 長さに 対する 0〜1）
export function addFluffWeights(geo, { neckX = 0.72, head = 1 } = {}) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox, len = bb.max.x - bb.min.x || 1;
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  const w = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    let u = (pos.getX(i) - bb.min.x) / len; if (head < 0) u = 1 - u;
    const up = nor ? nor.getY(i) : 0.5;
    const top = THREE.MathUtils.smoothstep(up, -0.6, 0.9);
    const neck = Math.exp(-((u - neckX) ** 2) / 0.006);
    w[i] = Math.min(1, top * 0.78 + neck * top * 0.4 + 0.02);
  }
  geo.setAttribute('fluffW', new THREE.BufferAttribute(w, 1));
  return geo;
}

// 体の 色を 変える しかけを マテリアルに 入れる
export function lookMaterial(mat, uniforms) {
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLkPos;\nvarying float vLkTop;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLkPos = position;\nvLkTop = normal.y;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uDark;\nuniform float uSpots;\nuniform float uSpotScale;\nuniform float uFlash;\nvarying vec3 vLkPos;\nvarying float vLkTop;\n${NOISE}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
  {
    vec3 c = diffuseColor.rgb;
    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    vec3 babyC = mix(vec3(lum), c, 0.7) * vec3(1.32, 1.22, 0.98);   // 明るく あたたかい色
    vec3 adultC = c * vec3(0.82, 0.86, 0.78);                       // こく しぶい色
    c = mix(babyC, adultC, uDark);
    float sp = smoothstep(0.62, 0.72, lkNoise(vLkPos * uSpotScale)) * smoothstep(0.1, 0.6, vLkTop);
    c = mix(c, vec3(0.97, 0.93, 0.8), sp * uSpots * 0.75);
    diffuseColor.rgb = mix(c, vec3(1.0, 0.97, 0.85), uFlash);
  }`);
  };
  mat.customProgramCacheKey = () => 'dinoLook';
  mat.needsUpdate = true;
}

// 産毛（殻を 何まいも 重ねて 毛に 見せる）
function shellMaterial(base, uniforms, layer, layers) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, vertexColors: !!base.vertexColors, map: base.map || null, side: THREE.FrontSide });
  const h = layer / layers;
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, uniforms);
    sh.uniforms.uLayer = { value: h };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float fluffW;\nuniform float uLayer;\nuniform float uLen;\nuniform float uFluff;\nvarying vec3 vLkPos;\nvarying float vLkW;')
      .replace('#include <skinning_vertex>', `#include <skinning_vertex>
  vLkPos = position; vLkW = fluffW;
  float lkOn = smoothstep(1.0 - uFluff - 0.08, 1.0 - uFluff + 0.08, fluffW);
  transformed += normalize(objectNormal) * uLayer * uLen * lkOn;
  transformed.y -= uLayer * uLayer * uLen * 0.35 * lkOn;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uLayer;\nuniform float uFluff;\nuniform float uDensity;\nuniform float uDark;\nvarying vec3 vLkPos;\nvarying float vLkW;\n${NOISE}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
  {
    float on = smoothstep(1.0 - uFluff - 0.08, 1.0 - uFluff + 0.08, vLkW);
    vec3 cp = vLkPos * uDensity;
    vec3 cell = floor(cp);
    float hgt = lkHash(cell) * 0.6 + 0.4;                       // 毛ごとの 長さ
    float d = length(fract(cp) - 0.5);
    float r = 0.55 * (1.0 - uLayer / hgt);                        // 先に いくほど 細く
    if (on < 0.5 || uLayer > hgt || d > r) discard;
    vec3 c = diffuseColor.rgb;
    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(lum), c, 0.6) * vec3(1.35, 1.25, 1.0);
    c = mix(c, c * 0.8, uDark);
    diffuseColor.rgb = mix(c * 0.8, c * 1.18 + 0.06, uLayer);   // 根もとは こく、先は 明るく
  }`);
  };
  m.customProgramCacheKey = () => 'dinoFluff';
  return m;
}

// target：毛を はやす メッシュ（SkinnedMesh も OK）。size：毛の ながさ（モデルの 大きさ に あわせる）
export class GrowthLook {
  constructor({ skinMaterials = [], fluffMeshes = [], fluffLen = 0.12, density = 26, spotScale = 3, layers = 10, colorShift = true }) {
    this.u = {
      uDark: { value: 0 }, uSpots: { value: 1 }, uSpotScale: { value: spotScale }, uFlash: { value: 0 },
      uFluff: { value: 1 }, uLen: { value: fluffLen }, uDensity: { value: density },
    };
    if (colorShift) for (const m of skinMaterials) lookMaterial(m, this.u);
    this.shells = [];
    for (const target of fluffMeshes) {
      if (!target.geometry.attributes.fluffW) addFluffWeights(target.geometry);
      for (let i = 1; i <= layers; i++) {
        const mat = shellMaterial(target.material, this.u, i, layers);
        const s = target.isSkinnedMesh ? new THREE.SkinnedMesh(target.geometry, mat) : new THREE.Mesh(target.geometry, mat);
        if (target.isSkinnedMesh) s.bind(target.skeleton, target.bindMatrix);
        s.position.copy(target.position); s.quaternion.copy(target.quaternion); s.scale.copy(target.scale);
        s.frustumCulled = false; s.castShadow = false; s.receiveShadow = true;
        s.renderOrder = i; s.userData.fluffShell = true;
        target.parent.add(s);
        this.shells.push(s);
      }
    }
  }
  // look = { fluff, dark, spots }（dinos.js の lookFor() の 結果）
  set(look) {
    this.u.uFluff.value = look.fluff;
    this.u.uDark.value = look.dark;
    this.u.uSpots.value = look.spots;
    const vis = look.fluff > 0.01;
    for (const s of this.shells) s.visible = vis;
  }
  flash(v) { this.u.uFlash.value = v; }
}
