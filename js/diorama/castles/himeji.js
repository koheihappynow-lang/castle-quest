// 姫路城（日本）
import {
  THREE, M, V, rnd, rr, mesh, boxGeo, roofGeo, eaveGeo, stoneBaseGeo, triPrism, Batch, windowSpots, windowsMesh,
  buildKeep, shachihoko, placeGable, pineTree, sakuraTree, stoneLantern, lanternsMesh, machiya, person, boat,
  hill, waterPlane, birds, petals, lightString, pick,
} from '../engine.js';

// お堀の穴があいた地面（日本のお城で共通）
export function moatGround(base, inner = 17) {
  const out = 32, w = out - inner;
  for (const [gw, gd, x, z] of [[64, w, 0, -(inner + w / 2)], [64, w, 0, inner + w / 2], [w, inner * 2, -(inner + w / 2), 0], [w, inner * 2, inner + w / 2, 0]]) {
    base.add(mesh(boxGeo(gw, 1, gd), [M.stone, M.stone, M.grass, M.grass, M.stone, M.stone], x, -0.5, z));
  }
  base.add(mesh(boxGeo(inner * 2, 0.3, inner * 2), M.mud, 0, -1.15, 0));
}

export function build(ctx) {
  const [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10] = ctx.stages;
  moatGround(ctx.base);
  ctx.signAt(0, -1, 0);
  ctx.setCamera([34, 27, 44], [0, 7, 2]);
  ctx.setFocus(1.5, 12, -0.5);

  // 1. 土地とお堀
  g1.add(mesh(boxGeo(26, 2.5, 26), [M.stone, M.stone, M.grass, M.grass, M.stone, M.stone], 0, 0.25, 0));
  waterPlane(g1, 34, 34, 0, 0, -0.45);
  for (const [x, z, r] of [[-21, -26, 7], [-4, -27.5, 6], [14, -26.5, 7.5], [27, -22, 5]]) hill(g1, x, z, r);

  // 2. 石垣
  const PY = 1.5;
  const plat = { x: 0, z: -1.5, wb: 18.5, db: 15.5, wt: 15.5, dt: 12.5, h: 3.6 };
  const PT = PY + plat.h;
  g2.add(mesh(stoneBaseGeo(plat.wb, plat.db, plat.wt, plat.dt, plat.h), M.stone, plat.x, PY, plat.z));
  g2.add(mesh(boxGeo(plat.wt, 0.1, plat.dt), M.gravel, plat.x, PT - 0.04, plat.z));
  for (const [x, z] of [[-11, -11], [11, -11], [-11, 10], [11, 10]]) {
    g2.add(mesh(stoneBaseGeo(3.6, 3.6, 2.9, 2.9, 1.4), M.stone, x, PY, z));
    g2.add(mesh(boxGeo(2.9, 0.1, 2.9), M.gravel, x, PY + 1.36, z));
  }
  g2.add(mesh(boxGeo(3, 0.06, 7.5), M.gravel, 0, PY + 0.03, 8.6));

  // 3. 塀・門・橋
  {
    const b = new Batch();
    const E = 12.4, H = 1.15, gate = 2.6;
    const holes = [];
    for (const [x1, z1, x2, z2] of [[-E, -E, E, -E], [E, -E, E, E], [-E, -E, -E, E], [-E, E, -gate, E], [gate, E, E, E]]) {
      const L = Math.hypot(x2 - x1, z2 - z1), ry = Math.atan2(-(z2 - z1), x2 - x1);
      const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
      b.box('plaster', L, H, 0.32, cx, PY + H / 2, cz, ry);
      const cap = triPrism(0.8, 0.32, L + 0.1); cap.rotateY(Math.PI / 2); cap.translate((L + 0.1) / 2, 0, 0);
      b.geo('roof', cap, cx, PY + H, cz, ry);
      const n = Math.floor(L / 1.4);
      for (let i = 0; i < n; i++) { const f = (i + 0.5) / n; holes.push([x1 + (x2 - x1) * f, PY + H * 0.55, z1 + (z2 - z1) * f, ry, i % 2]); }
    }
    for (const [x, y, z, ry, tri] of holes) {
      const out = V(0, 0, 1).applyAxisAngle(V(0, 1, 0), ry).multiplyScalar(0.17);
      if (tri) b.geo('darkWood', new THREE.CylinderGeometry(0.09, 0.09, 0.05, 3).rotateX(Math.PI / 2), x + out.x, y, z + out.z, ry);
      else b.box('darkWood', 0.16, 0.16, 0.05, x + out.x, y, z + out.z, ry);
    }
    b.box('darkWood', 0.5, 2.3, 0.5, -gate + 0.2, PY + 1.15, E);
    b.box('darkWood', 0.5, 2.3, 0.5, gate - 0.2, PY + 1.15, E);
    b.box('darkWood', 4.6, 1.9, 0.18, 0, PY + 0.95, E - 0.1);
    b.box('plaster', 6.4, 1.5, 2.2, 0, PY + 3.0, E);
    b.build(g3);
    g3.add(mesh(roofGeo(7.6, 3.4, 4.6, 0.2, 1.1, { up: 0.3 }), M.roof, 0, PY + 3.72, E));
    g3.add(mesh(eaveGeo(7.6, 3.4, 6.4, 2.2, { up: 0.3 }), M.eave, 0, PY + 3.72, E));
    g3.add(mesh(boxGeo(5.0, 0.2, 0.3), M.roof, 0, PY + 4.82, E));
    const gw = []; windowSpots(gw, 0, E, 6.4, 2.2, PY + 3.0, 1.2); g3.add(windowsMesh(gw));
    const bridge = new THREE.Group();
    const L = Math.hypot(4.6, PY) + 0.4;
    bridge.position.set(0, PY / 2 - 0.05, 15.2);
    bridge.rotation.x = Math.atan2(PY, 4.6);
    bridge.add(mesh(boxGeo(3, 0.25, L), M.wood));
    for (const sx of [-1.45, 1.45]) {
      bridge.add(mesh(boxGeo(0.12, 0.12, L), M.wood, sx, 0.75, 0));
      for (let i = 0; i < 5; i++) bridge.add(mesh(boxGeo(0.16, 0.8, 0.16), M.darkWood, sx, 0.35, -L / 2 + 0.2 + i * (L - 0.4) / 4));
    }
    g3.add(bridge);
    for (const sx of [-1.2, 1.2]) g3.add(mesh(boxGeo(0.3, 2.2, 0.3), M.darkWood, sx, -0.6, 15.2));
  }

  // 4. 櫓と小天守
  const smallKeeps = [
    { x: -4.9, z: 1.9, tiers: [{ w: 3.7, d: 3.4, h: 1.5 }, { w: 3.0, d: 2.8, h: 1.3 }, { w: 2.4, d: 2.2, h: 1.2 }] },
    { x: -4.9, z: -4.9, tiers: [{ w: 3.4, d: 3.2, h: 1.5 }, { w: 2.8, d: 2.6, h: 1.3 }, { w: 2.2, d: 2.0, h: 1.1 }] },
    { x: 2.7, z: -5.6, tiers: [{ w: 3.7, d: 3.0, h: 1.5 }, { w: 3.0, d: 2.4, h: 1.3 }, { w: 2.3, d: 1.8, h: 1.1 }] },
  ];
  const ridgeSpots = [];
  for (const k of smallKeeps) {
    const r = buildKeep({ x: k.x, z: k.z, y: PT, tiers: k.tiers, ov: 0.55, rise: 0.55, up: 0.25, winScale: 0.8, topRise: 1.0 });
    g4.add(r.walls, r.roofs);
    ridgeSpots.push({ x: k.x, z: k.z, ...r.info.ridge, s: 0.7 });
  }
  for (const [x, z] of [[-11, -11], [11, -11], [-11, 10], [11, 10]]) {
    const r = buildKeep({ x, z, y: PY + 1.4, tiers: [{ w: 2.7, d: 2.5, h: 1.3 }, { w: 2.0, d: 1.8, h: 1.0 }], ov: 0.45, rise: 0.45, up: 0.22, winScale: 0.75, topRise: 0.8 });
    g4.add(r.walls, r.roofs);
  }

  // 5・6. 大天守
  const MK = { x: 2.6, z: 1.0 };
  const mainTiers = [{ w: 8.6, d: 7.2, h: 2.3 }, { w: 7.7, d: 6.3, h: 1.9 }, { w: 6.8, d: 5.4, h: 1.8 }, { w: 5.8, d: 4.6, h: 1.7 }, { w: 4.6, d: 3.7, h: 1.7 }];
  const main = buildKeep({ x: MK.x, z: MK.z, y: PT, tiers: mainTiers, ov: 0.9, rise: 0.8, up: 0.42, topRise: 1.7 });
  g5.add(main.walls);
  g5.add(mesh(boxGeo(mainTiers[0].w + 0.06, 0.35, mainTiers[0].d + 0.06), M.darkWood, MK.x, PT + 0.18, MK.z));
  g6.add(main.roofs);
  for (const wt of [{ x: -4.9, z: -1.5, w: 2.3, d: 3.2 }, { x: -1.3, z: -5.2, w: 4.0, d: 2.3 }, { x: 2.7, z: -3.5, w: 2.3, d: 1.6 }, { x: -2.4, z: 2.0, w: 1.6, d: 2.3 }]) {
    const h = 2.0;
    g6.add(mesh(boxGeo(wt.w, h, wt.d), M.plaster, wt.x, PT + h / 2, wt.z));
    const longX = wt.w >= wt.d, wo = wt.w + 1.0, dO = wt.d + 1.0;
    const ri = longX ? [Math.max(0.3, wt.w - wt.d * 0.6), 0.16] : [0.16, Math.max(0.3, wt.d - wt.w * 0.6)];
    g6.add(mesh(roofGeo(wo, dO, ri[0], ri[1], 0.9, { up: 0.2 }), M.roof, wt.x, PT + h - 0.04, wt.z));
    g6.add(mesh(eaveGeo(wo, dO, wt.w, wt.d, { up: 0.2 }), M.eave, wt.x, PT + h - 0.04, wt.z));
    const ws = []; windowSpots(ws, wt.x, wt.z, wt.w, wt.d, PT + h * 0.55, 1.0); g6.add(windowsMesh(ws, { w: 0.26, h: 0.33 }));
  }

  // 7. かざり
  const T = main.info;
  placeGable(g7, { w: 3.0, h: 0.9, curved: true }, MK.x, MK.z, T[0], T[1], 0.9, 'pz');
  for (const f of ['px', 'nx', 'nz']) placeGable(g7, { w: 2.8, h: 1.15 }, MK.x, MK.z, T[0], T[1], 0.9, f);
  placeGable(g7, { w: 2.0, h: 0.95 }, MK.x, MK.z, T[1], T[2], 0.9, 'pz', -1.5);
  placeGable(g7, { w: 2.0, h: 0.95 }, MK.x, MK.z, T[1], T[2], 0.9, 'pz', 1.5);
  placeGable(g7, { w: 2.2, h: 1.0 }, MK.x, MK.z, T[1], T[2], 0.9, 'nz');
  placeGable(g7, { w: 3.2, h: 1.3 }, MK.x, MK.z, T[2], T[3], 0.9, 'pz');
  placeGable(g7, { w: 2.4, h: 1.1 }, MK.x, MK.z, T[2], T[3], 0.9, 'px');
  placeGable(g7, { w: 2.4, h: 1.1 }, MK.x, MK.z, T[2], T[3], 0.9, 'nx');
  placeGable(g7, { w: 2.4, h: 0.75, curved: true }, MK.x, MK.z, T[3], T[4], 0.9, 'pz');
  placeGable(g7, { w: 2.0, h: 0.9 }, MK.x, MK.z, T[3], T[4], 0.9, 'nz');
  const R = T.ridge;
  g7.add(shachihoko(MK.x - R.half, R.y, MK.z, -1, 1.2), shachihoko(MK.x + R.half, R.y, MK.z, 1, 1.2));
  for (const s of ridgeSpots) g7.add(shachihoko(s.x - s.half, s.y, s.z, -1, s.s), shachihoko(s.x + s.half, s.y, s.z, 1, s.s));
  {
    const b = new Batch();
    const lan = [];
    for (const [x, z, s] of [[-9, 6, 1.1], [8.5, 7.5, 1.0], [-10, -2, 0.9], [10, -3, 1.0], [-7.5, 10, 0.85], [7, 10.5, 0.8], [9.6, 2.5, 0.8]]) pineTree(b, x, PY, z, s);
    for (const [x, z, s] of [[-24, -14, 1.3], [-19, -20, 1.1], [-28, -19, 1.2], [22, -14, 1.2], [26, -19, 1.3], [18, -21, 1.0], [-10, -21, 1.1], [6, -21.5, 1.2]]) pineTree(b, x, 0, z, s);
    for (const z of [10.6, 8.6, 6.6]) { stoneLantern(b, lan, -1.9, PY, z); stoneLantern(b, lan, 1.9, PY, z); }
    b.build(g7);
    g7.add(lanternsMesh(lan, { size: 0.32 }));
    for (const [x, z] of [[-3.6, 11.4], [3.6, 11.4], [-1.8, 18.2], [1.8, 18.2], [-11.8, 3], [11.8, 3]]) {
      const y = z > 13 ? 0 : PY;
      g7.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 6), M.darkWood, x, y + 1.6, z));
      const geo = new THREE.PlaneGeometry(0.62, 1.9, 6, 1); geo.translate(0.31, 0, 0);
      const f = mesh(geo, M.nobori, x + 0.04, y + 2.0, z);
      f.rotation.y = rnd() * 6; f.userData.base = geo.attributes.position.array.slice(); f.userData.phase = rnd() * 6; f.userData.isFlag = true;
      g7.add(f);
    }
  }

  // 8. 城下町と桜
  {
    const b = new Batch();
    b.box('gravel', 3.2, 0.04, 14.6, 0, 0.02, 24.6);
    b.box('gravel', 60, 0.04, 2.6, 0, 0.025, 24.2);
    b.box('gravel', 2.6, 0.04, 14, -24.2, 0.02, -2);
    b.box('gravel', 2.6, 0.04, 14, 24.2, 0.02, -2);
    let v = 0;
    for (const sx of [-1, 1]) for (const z of [19.0, 21.5, 27.4, 29.9]) machiya(b, sx * 3.25, z, sx < 0 ? Math.PI / 2 : -Math.PI / 2, v++);
    for (const sx of [-1, 1]) for (let i = 0; i < 9; i++) { const x = sx * (4.9 + i * 2.9); machiya(b, x, 21.25, 0, v++); machiya(b, x, 27.2, Math.PI, v++); }
    for (const sx of [-1, 1]) for (const z of [-9, 5]) {
      const x = sx * 27.5;
      b.box('houseA', 5, 1.7, 4, x, 0.85, z);
      const pr = triPrism(4, 1.0, 5); pr.rotateY(Math.PI / 2); pr.translate(2.5, 0, 0);
      b.geo('houseA', pr, x, 1.7, z);
      for (const sgn of [-1, 1]) b.box('roof', 5.6, 0.12, Math.hypot(2, 1) + 0.5, x, 2.25, z + sgn * 1.0, 0, null, sgn * Math.atan2(1, 2));
      b.box('roof', 5.7, 0.16, 0.2, x, 2.74, z);
      b.box('plaster', 0.3, 1.0, 7, x - sx * 3.6, 0.5, z);
      b.box('roof', 0.7, 0.12, 7.2, x - sx * 3.6, 1.06, z);
    }
    for (let i = -14; i <= 14; i += 3.5) {
      if (Math.abs(i) > 2.5) sakuraTree(b, i, 0, 18.4, rr(0.85, 1.05));
      sakuraTree(b, i, 0, -18.4, rr(0.85, 1.05)); sakuraTree(b, 18.4, 0, i, rr(0.85, 1.05)); sakuraTree(b, -18.4, 0, i, rr(0.85, 1.05));
    }
    for (const [x, z] of [[-30, 30], [30, 30], [-30, 18.5], [30, 18.5], [-6, 31], [6, 31], [-21, 13], [21, 13], [-13, -24], [12, -24]]) sakuraTree(b, x, 0, z, rr(0.9, 1.2));
    for (const [x, z] of [[-9, 8.5], [9.5, 6], [-10.5, -8], [-8, 3], [10.5, -7]]) sakuraTree(b, x, PY, z, 0.8);
    b.build(g8);
    petals(ctx, 7);
  }

  // 9. かごと人
  {
    const mainPath = [V(0, 0, 31), V(0, 0, 17.6), V(0, PY, 12.9), V(0, PY, 6.2)];
    const cross = [V(-29, 0, 24.2), V(29, 0, 24.2)];
    for (let i = 0; i < 6; i++) { const p = person(pick(M.kimono), i % 3 === 0 ? 'straw' : 'none'); g9.add(p); ctx.addWalker(8, p, mainPath, { u: i / 6, speed: rr(0.018, 0.03), lateral: i % 2 ? 0.7 : -0.7 }); }
    for (let i = 0; i < 8; i++) { const p = person(pick(M.kimono), i % 3 === 1 ? 'straw' : 'none'); g9.add(p); ctx.addWalker(8, p, cross, { u: i / 8, speed: rr(0.012, 0.02), lateral: i % 2 ? 0.6 : -0.6 }); }
    const kago = new THREE.Group();
    const c1 = person(M.kimono[0], 'straw'), c2 = person(M.kimono[0], 'straw');
    c1.position.z = 1.1; c2.position.z = -1.1;
    const pole = mesh(new THREE.CylinderGeometry(0.04, 0.04, 3, 6), M.darkWood, 0, 1.05, 0); pole.rotation.x = Math.PI / 2;
    kago.add(c1, c2, pole, mesh(boxGeo(0.8, 0.75, 1.0), M.houseC, 0, 0.62, 0), mesh(roofGeo(1.1, 1.3, 0.2, 0.9, 0.25, { up: 0.08 }), M.roof, 0, 1.0, 0));
    g9.add(kago);
    ctx.addWalker(8, kago, [V(0, 0, 30), V(0, 0, 17.6), V(0, PY, 12.9), V(0, PY, 7)], { u: 0.3, speed: 0.012 });
    const bt = boat(M.kimono[3]);
    g9.add(bt);
    const Rr = 15;
    ctx.addWalker(8, bt, [V(-Rr, -0.35, Rr), V(Rr, -0.35, Rr), V(Rr, -0.35, -Rr), V(-Rr, -0.35, -Rr), V(-Rr, -0.35, Rr)], { speed: 0.006, loop: true, bob: 0.02 });
    birds(ctx, 8);
  }

  // 10. ちょうちん
  {
    const pts = [];
    for (const sx of [-1.9, 1.9]) lightString(g10, [V(sx, 2.4, 18), V(sx, 2.4, 30.6)], { step: 1.4 });
    for (const sz of [22.8, 25.6]) { lightString(g10, [V(-28, 2.3, sz), V(-2.6, 2.3, sz)], { step: 2.2 }); lightString(g10, [V(2.6, 2.3, sz), V(28, 2.3, sz)], { step: 2.2 }); }
    void pts;
  }
}
