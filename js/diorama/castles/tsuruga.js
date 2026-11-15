// 鶴ヶ城（福島県会津若松市）ちょうげきレア
import {
  THREE, M, V, rr, rnd, mesh, boxGeo, roofGeo, eaveGeo, stoneBaseGeo, triPrism, Batch, windowSpots, windowsMesh,
  buildKeep, shachihoko, placeGable, pineTree, sakuraTree, machiya, person, crowd, waterPlane, hill, birds, petals,
  lightString, pick,
} from '../engine.js';
import { moatGround } from './himeji.js';

export function build(ctx) {
  const [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10] = ctx.stages;
  moatGround(ctx.base);
  ctx.signAt(0, -1, 0);
  ctx.setCamera([32, 25, 42], [0, 7, 1]);
  ctx.setFocus(-1, 11, -2, 15);

  // 1. 土地とお堀
  g1.add(mesh(boxGeo(26, 2.5, 26), [M.stone, M.stone, M.grass, M.grass, M.stone, M.stone], 0, 0.25, 0));
  waterPlane(g1, 34, 34, 0, 0, -0.45);
  for (const [x, z, r] of [[-20, -26, 7], [0, -27.5, 6], [18, -26, 7], [28, -20, 5]]) hill(g1, x, z, r);
  const PY = 1.5;

  // 2. 石垣（天守台）
  const K = { x: -1, z: -2 };
  const KT = PY + 4.2;
  g2.add(mesh(stoneBaseGeo(12, 11, 9.6, 8.8, 4.2), M.stoneWarm, K.x, PY, K.z));
  g2.add(mesh(boxGeo(9.6, 0.1, 8.8), M.gravel, K.x, KT - 0.04, K.z));
  g2.add(mesh(stoneBaseGeo(9, 4, 8, 3.2, 2.4), M.stoneWarm, K.x + 7, PY, K.z + 2));
  g2.add(mesh(boxGeo(3, 0.06, 9), M.gravel, 0, PY + 0.03, 8));

  // 3. 赤い橋（廊下橋）と塀
  {
    const b = new Batch();
    const E = 12.4, H = 1.1;
    for (const [x1, z1, x2, z2] of [[-E, -E, E, -E], [E, -E, E, E], [-E, -E, -E, E], [-E, E, -2.4, E], [2.4, E, E, E]]) {
      const L = Math.hypot(x2 - x1, z2 - z1), ry = Math.atan2(-(z2 - z1), x2 - x1);
      const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
      b.box('plaster', L, H, 0.3, cx, PY + H / 2, cz, ry);
      const cap = triPrism(0.8, 0.3, L + 0.1); cap.rotateY(Math.PI / 2); cap.translate((L + 0.1) / 2, 0, 0);
      b.geo('roofRed', cap, cx, PY + H, cz, ry);
    }
    b.build(g3);
    // 屋根つきの赤い橋
    const br = new THREE.Group();
    const L = Math.hypot(4.6, PY) + 0.4;
    br.position.set(0, PY / 2 - 0.05, 15.2);
    br.rotation.x = Math.atan2(PY, 4.6);
    br.add(mesh(boxGeo(3, 0.25, L), M.vermilion));
    for (const sx of [-1.45, 1.45]) {
      br.add(mesh(boxGeo(0.12, 0.12, L), M.vermilion, sx, 0.75, 0));
      for (let i = 0; i < 6; i++) br.add(mesh(boxGeo(0.16, 0.85, 0.16), M.vermilion, sx, 0.35, -L / 2 + 0.2 + i * (L - 0.4) / 5));
    }
    g3.add(br);
    for (const sx of [-1.2, 1.2]) g3.add(mesh(boxGeo(0.3, 2.2, 0.3), M.vermilion, sx, -0.6, 15.2));
    // 門
    g3.add(mesh(boxGeo(5.4, 1.4, 2), M.plaster, 0, PY + 2.6, E));
    for (const sx of [-2.2, 2.2]) g3.add(mesh(boxGeo(0.45, 2.2, 0.45), M.darkWood, sx, PY + 1.1, E));
    g3.add(mesh(roofGeo(6.4, 3, 4, 0.2, 1.0, { up: 0.3 }), M.roofRed, 0, PY + 3.28, E));
    g3.add(mesh(eaveGeo(6.4, 3, 5.4, 2, { up: 0.3 }), M.eave, 0, PY + 3.28, E));
  }

  // 4. 櫓（走長屋・鉄門）
  {
    const wins = [];
    const x = K.x + 7, z = K.z + 2, y = PY + 2.4;
    g4.add(mesh(boxGeo(8, 1.6, 3.2), M.plaster, x, y + 0.8, z));
    windowSpots(wins, x, z, 8, 3.2, y + 0.85, 1.0);
    g4.add(mesh(roofGeo(9, 4.2, 6, 0.2, 1.0, { up: 0.25 }), M.roofRed, x, y + 1.58, z));
    g4.add(mesh(eaveGeo(9, 4.2, 8, 3.2, { up: 0.25 }), M.eave, x, y + 1.58, z));
    const r = buildKeep({ x: x + 3.2, z, y: y, tiers: [{ w: 2.6, d: 2.6, h: 1.4 }, { w: 2.0, d: 2.0, h: 1.1 }], ov: 0.45, rise: 0.45, up: 0.22, winScale: 0.75, topRise: 0.8, roofMat: M.roofRed });
    g4.add(r.walls, r.roofs);
    for (const [cx, cz] of [[-11, -11], [11, -11], [-11, 10]]) {
      g4.add(mesh(stoneBaseGeo(3.4, 3.4, 2.8, 2.8, 1.2), M.stoneWarm, cx, PY, cz));
      const t = buildKeep({ x: cx, z: cz, y: PY + 1.2, tiers: [{ w: 2.5, d: 2.3, h: 1.3 }, { w: 1.9, d: 1.7, h: 1.0 }], ov: 0.45, rise: 0.45, up: 0.22, winScale: 0.75, topRise: 0.8, roofMat: M.roofRed });
      g4.add(t.walls, t.roofs);
    }
    g4.add(windowsMesh(wins, { w: 0.26, h: 0.33 }));
  }

  // 5・6. 天守（白い壁・赤い瓦）
  const tiers = [{ w: 8.4, d: 7.6, h: 2.2 }, { w: 7.4, d: 6.6, h: 1.8 }, { w: 6.4, d: 5.6, h: 1.7 }, { w: 5.3, d: 4.6, h: 1.6 }, { w: 4.1, d: 3.6, h: 1.6 }];
  const main = buildKeep({ x: K.x, z: K.z, y: KT, tiers, ov: 0.85, rise: 0.75, up: 0.4, topRise: 1.6, roofMat: M.roofRed });
  g5.add(main.walls);
  g5.add(mesh(boxGeo(tiers[0].w + 0.05, 0.6, tiers[0].d + 0.05), M.darkWood, K.x, KT + 0.3, K.z));
  g6.add(main.roofs);

  // 7. しゃちほこと破風
  {
    const T = main.info;
    placeGable(g7, { w: 2.6, h: 1.05, roofMat: M.roofRed }, K.x, K.z, T[0], T[1], 0.85, 'pz');
    placeGable(g7, { w: 2.6, h: 1.05, roofMat: M.roofRed }, K.x, K.z, T[0], T[1], 0.85, 'nz');
    placeGable(g7, { w: 2.4, h: 1.0, roofMat: M.roofRed }, K.x, K.z, T[1], T[2], 0.85, 'px');
    placeGable(g7, { w: 2.4, h: 1.0, roofMat: M.roofRed }, K.x, K.z, T[1], T[2], 0.85, 'nx');
    placeGable(g7, { w: 2.2, h: 0.9, roofMat: M.roofRed }, K.x, K.z, T[2], T[3], 0.85, 'pz');
    placeGable(g7, { w: 2.0, h: 0.75, curved: true, roofMat: M.roofRed }, K.x, K.z, T[3], T[4], 0.85, 'pz');
    const R = T.ridge;
    g7.add(shachihoko(K.x - R.half, R.y, K.z, -1, 1.15), shachihoko(K.x + R.half, R.y, K.z, 1, 1.15));
    const b = new Batch();
    for (const [x, z, s] of [[-9.5, 6, 1.0], [9, 9, 0.9], [-10, -7, 0.9], [9.5, -8, 1.0]]) pineTree(b, x, PY, z, s);
    b.build(g7);
  }

  // 8. 桜（たくさん）と茶室（麟閣）
  {
    const b = new Batch();
    for (let i = -14; i <= 14; i += 2.6) {
      if (Math.abs(i) > 2.5) sakuraTree(b, i, 0, 18.4, rr(0.9, 1.15));
      sakuraTree(b, i, 0, -18.4, rr(0.9, 1.15)); sakuraTree(b, 18.4, 0, i, rr(0.9, 1.15)); sakuraTree(b, -18.4, 0, i, rr(0.9, 1.15));
    }
    for (const [x, z] of [[-8, 9], [5, 9.5], [9.5, 4], [-9.8, 2], [-6, -9.5], [5, -10], [10, -3], [-3, 10.5], [-10.5, -3.5]]) sakuraTree(b, x, PY, z, rr(0.85, 1.0));
    for (let i = 0; i < 22; i++) { const x = rr(-30, 30), z = rr(20, 31); if (Math.abs(x) < 3) continue; sakuraTree(b, x, 0, z, rr(0.9, 1.25)); }
    for (let i = 0; i < 10; i++) { const x = (i % 2 ? 1 : -1) * rr(20, 30), z = rr(-14, 18); sakuraTree(b, x, 0, z, rr(0.9, 1.2)); }
    // 茶室
    const tx = -24, tz = -8;
    b.box('houseB', 3.6, 1.4, 2.8, tx, 0.7, tz);
    b.geo('straw', roofGeo(4.6, 3.8, 1.6, 0.2, 1.6, { up: 0.05, sag: 0.05 }), tx, 1.38, tz);
    b.box('gravel', 4, 0.04, 6, tx, 0.02, tz + 3.5);
    for (let i = 0; i < 5; i++) b.box('stone', 0.5, 0.06, 0.5, tx + rr(-0.4, 0.4), 0.05, tz + 2 + i * 0.9);
    b.build(g8);
    petals(ctx, 7, { n: 320 });
  }

  // 9. 赤べこと人・起き上がり小法師
  {
    // 大きな赤べこ
    const cow = new THREE.Group();
    cow.add(mesh(boxGeo(1.4, 1.0, 2.4), M.redCloth, 0, 1.0, 0));
    for (const [lx, lz] of [[-0.45, 0.8], [0.45, 0.8], [-0.45, -0.8], [0.45, -0.8]]) cow.add(mesh(boxGeo(0.3, 0.6, 0.3), M.redCloth, lx, 0.3, lz));
    const head = mesh(boxGeo(0.9, 0.85, 0.9), M.redCloth, 0, 1.45, 1.55);
    cow.add(head);
    for (const s of [-1, 1]) cow.add(mesh(new THREE.ConeGeometry(0.08, 0.35, 6), M.black, s * 0.35, 1.95, 1.55));
    for (const [sx, sy, sz] of [[0.71, 1.1, 0.3], [-0.71, 1.0, -0.4], [0.71, 0.9, -0.7]]) cow.add(mesh(new THREE.CircleGeometry(0.18, 12), M.black, sx, sy, sz).rotateY(Math.PI / 2 * Math.sign(sx)));
    cow.add(mesh(boxGeo(1.6, 0.4, 2.8), M.wood, 0, 0.2 - 0.2, 0));
    cow.position.set(-6.5, 0, 24.5);
    cow.rotation.y = 0.6;
    g9.add(cow);
    ctx.addUpdater(8, t => { head.rotation.x = Math.sin(t * 2.4) * 0.18; head.position.y = 1.45 + Math.sin(t * 2.4) * 0.05; });
    // 起き上がり小法師
    for (let i = 0; i < 5; i++) {
      const o = new THREE.Group();
      o.add(mesh(new THREE.SphereGeometry(0.28, 10, 8), M.redCloth, 0, 0.28, 0));
      o.add(mesh(new THREE.SphereGeometry(0.18, 10, 8), M.white, 0, 0.6, 0.02));
      o.position.set(5 + i * 0.75, 0, 24);
      g9.add(o);
      ctx.addUpdater(8, t => { o.rotation.z = Math.sin(t * 3 + i) * 0.25; });
    }
    // 町家と人
    const b = new Batch();
    let v = 0;
    for (const sx of [-1, 1]) for (const z of [19.2, 21.7, 27.4, 29.9]) machiya(b, sx * 3.25, z, sx < 0 ? Math.PI / 2 : -Math.PI / 2, v++);
    b.box('gravel', 3.2, 0.04, 14.6, 0, 0.02, 24.6);
    b.build(g9);
    crowd(ctx, 8, [V(0, 0, 31), V(0, 0, 17.6), V(0, PY, 12.9), V(0, PY, 6.5)], 9, { mats: M.kimono, hats: ['none', 'straw'] });
    crowd(ctx, 8, [V(-14, 0, 20), V(14, 0, 20)], 5, { mats: M.kimono });
    birds(ctx, 8);
  }

  // 10. ちょうちん
  for (const sx of [-1.9, 1.9]) lightString(g10, [V(sx, 2.4, 18), V(sx, 2.4, 30.6)], { step: 1.3 });
  lightString(g10, [V(-17.2, 2.3, -14), V(-17.2, 2.3, 14)], { step: 2 });
  lightString(g10, [V(17.2, 2.3, -14), V(17.2, 2.3, 14)], { step: 2 });
  void rnd; void person; void pick;
}

// ---------- 細部の かざり ----------
import * as E from '../engine.js';
export function details(ctx) {
  const [g1, , g3, , , , , , g9, g10] = ctx.stages;
  E.lilyPads(g1, 0, -15, 26, 2.6, 22, -0.43);
  E.lilyPads(g1, -15, 0, 2.6, 26, 18, -0.43);
  // 赤い橋の ちょうちん
  const lan = [];
  for (const z of [13.6, 15.2, 16.8]) for (const x of [-1.5, 1.5]) lan.push([x, 1.9, z]);
  g3.add(E.lanternsMesh(lan, { size: 0.32, sphere: true, mat: E.M.chochin }));
  // 番兵
  for (const x of [-3.2, 3.2]) { const p = E.person(E.M.kimono[1], 'straw'); p.position.set(x, 1.5, 13.3); g9.add(p); }
  E.bannerRow(g10, E.V(-1.75, 0, 19.2), E.V(-1.75, 0, 30.5), 4, 'jp', { h: 2.4, w: 0.6 });
  E.kites(ctx, 8, [[-15, 21, -16, 0xd83b2f], [15, 23, -20, 0xffc83a]]);
}
