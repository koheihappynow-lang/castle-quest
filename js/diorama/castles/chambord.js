// シャンボール城（フランス）
import {
  THREE, M, V, rr, rnd, mesh, boxGeo, cylGeo, stoneBaseGeo, Batch, windowsMesh, windowSpots, ringWindows, roundTower,
  gableRoof, coneRoof, domeRoof, hipHall, flagPole, waterPlane, ground, spruce, roundTree, carriage, horse, person, crowd,
  birds, lampPost, lanternsMesh, roofGeo, sub,
} from '../engine.js';

export function build(ctx) {
  const [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10] = ctx.stages;
  ground(ctx.base, 64, 64, 0, 0);
  ctx.signAt(0, 0, 0);
  ctx.setCamera([30, 26, 40], [0, 6, 0]);
  ctx.setFocus(0, 9, -2, 18);

  const W = 30, D = 20, CX = 0, CZ = -2;
  // 1. 森と川（コソン川・堀）
  g1.add(mesh(boxGeo(W + 8, 0.06, D + 8), M.sand, CX, 0.02, CZ));
  waterPlane(g1, W + 7, D + 7, CX, CZ, 0.06);
  waterPlane(g1, 64, 5, 0, 19, 0.06);
  g1.add(mesh(boxGeo(64, 0.04, 6), M.sand, 0, 0.02, 19));

  // 2. 堀と土台
  const TY = 0.9;
  g2.add(mesh(stoneBaseGeo(W + 0.6, D + 0.6, W, D, TY, false), M.ashlarWarm, CX, 0, CZ));
  g2.add(mesh(boxGeo(W, 0.1, D), M.gravel, CX, TY - 0.04, CZ));
  // 南の橋
  g2.add(mesh(boxGeo(3, 0.5, 4.5), M.ashlarWarm, CX, 0.4, CZ + D / 2 + 2.2));

  // 3. まわりの建物（翼）と四すみの塔
  const wins = [];
  {
    const hw = W / 2, hd = D / 2;
    for (const [x, z, w, d, ry] of [[CX, CZ - hd + 1.3, W - 4, 2.6, 0], [CX - hw + 1.3, CZ, D - 4, 2.6, Math.PI / 2], [CX + hw + -1.3, CZ, D - 4, 2.6, Math.PI / 2], [CX - 9, CZ + hd - 1, 8, 2, 0], [CX + 9, CZ + hd - 1, 8, 2, 0]]) {
      const s = sub(g3, x, TY, z, ry);
      s.add(mesh(boxGeo(w, 3, d), M.ashlarWarm, 0, 1.5, 0));
      gableRoof(s, { x: 0, z: 0, y: 3, w, d, wall: M.ashlarWarm, roofMat: M.slate, roofH: d * 0.7, ov: 0.2 });
      const local = []; windowSpots(local, 0, 0, w, d, 1.0, 1.3); windowSpots(local, 0, 0, w, d, 2.2, 1.3);
      for (const [lx, ly, lz, lr] of local) { const p = V(lx, ly, lz).applyAxisAngle(V(0, 1, 0), ry).add(V(x, TY, z)); wins.push([p.x, p.y, p.z, lr + ry]); }
    }
    for (const [x, z] of [[CX - hw, CZ - hd], [CX + hw, CZ - hd], [CX - hw, CZ + hd], [CX + hw, CZ + hd]]) {
      roundTower(g3, { x, z, y: TY, r: 2.0, h: 4.2, wall: M.ashlarWarm, roof: 'cone', roofMat: M.slate, roofH: 3.2, overhang: 1.05, wins, winRows: 2 });
    }
    // 南の門
    g3.add(mesh(boxGeo(3.4, 3.8, 1.6), M.ashlarWarm, CX, TY + 1.9, CZ + hd - 1));
    g3.add(mesh(boxGeo(1.4, 2.2, 0.1), M.darkWood, CX, TY + 1.1, CZ + hd - 0.18));
  }

  // 4. 天守（ドンジョン）の4つの丸い塔
  const K = { x: CX, z: CZ - 2.6, s: 11 };
  const towers = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => [K.x + a * K.s / 2, K.z + b * K.s / 2]);
  {
    for (const [x, z] of towers) {
      g4.add(mesh(cylGeo(2.6, 2.7, 8.4, 28), M.ashlarWarm, x, TY + 4.2, z));
      for (let row = 0; row < 3; row++) ringWindows(wins, x, z, 2.6, TY + 1.6 + row * 2.6, 8, row * 0.2);
      for (let row = 1; row < 3; row++) g4.add(mesh(cylGeo(2.72, 2.72, 0.18, 28), M.ashlarWarm, x, TY + row * 2.75, z));
    }
  }

  // 5. 大きな本体（天守のまんなか）
  {
    g5.add(mesh(boxGeo(K.s, 8.4, K.s), M.ashlarWarm, K.x, TY + 4.2, K.z));
    for (let row = 0; row < 3; row++) windowSpots(wins, K.x, K.z, K.s, K.s, TY + 1.6 + row * 2.6, 1.4);
    for (let row = 1; row < 3; row++) g5.add(mesh(boxGeo(K.s + 0.12, 0.18, K.s + 0.12), M.ashlarWarm, K.x, TY + row * 2.75, K.z));
    g5.add(windowsMesh(wins, { arch: true, w: 0.42, h: 0.9 }));
  }

  // 6. 青い屋根
  const RY = TY + 8.4;
  {
    g6.add(mesh(roofGeo(K.s + 0.6, K.s + 0.6, K.s - 3, K.s - 3, 1.6, { up: 0, sag: 0 }), M.slate, K.x, RY, K.z));
    g6.add(mesh(boxGeo(K.s - 3, 0.12, K.s - 3), M.gravel, K.x, RY + 1.6, K.z));
    for (const [x, z] of towers) coneRoof(g6, x, z, RY, 2.85, 4.6, M.slate, { seg: 28, finial: false });
  }

  // 7. えんとつとランタン塔（二重らせん階段の上）
  {
    const b = new Batch();
    for (const [x, z] of towers) {
      // 塔の屋根の上の小さなランタンと えんとつ
      b.geo('ashlarWarm', cylGeo(0.45, 0.5, 1.6, 10), x, RY + 3.4, z);
      b.geo('slate', new THREE.ConeGeometry(0.55, 1.3, 10), x, RY + 4.85, z);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + 0.4;
        b.box('ashlarWarm', 0.4, 2.6, 0.4, x + Math.cos(a) * 1.3, RY + 2.0, z + Math.sin(a) * 1.3);
        b.box('slate', 0.55, 0.2, 0.55, x + Math.cos(a) * 1.3, RY + 3.35, z + Math.sin(a) * 1.3);
      }
      // 屋根窓
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        b.box('ashlarWarm', 0.7, 1.0, 0.5, x + Math.cos(a) * 2.2, RY + 1.2, z + Math.sin(a) * 2.2, -a + Math.PI / 2);
      }
    }
    // 本体の屋上のえんとつ
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const x = K.x + Math.cos(a) * 3.6, z = K.z + Math.sin(a) * 3.6;
      b.box('ashlarWarm', 0.45, 2.2 + (i % 3) * 0.4, 0.45, x, RY + 2.6, z);
      b.box('slate', 0.6, 0.2, 0.6, x, RY + 3.8 + (i % 3) * 0.4, z);
    }
    b.build(g7);
    // まんなかのランタン塔
    const ly = RY + 1.6;
    g7.add(mesh(cylGeo(1.6, 1.7, 3.2, 8), M.ashlarWarm, K.x, ly + 1.6, K.z));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g7.add(mesh(boxGeo(0.25, 3.4, 0.25), M.ashlarWarm, K.x + Math.cos(a) * 1.75, ly + 1.7, K.z + Math.sin(a) * 1.75)); }
    g7.add(mesh(cylGeo(1.1, 1.2, 2.0, 8), M.ashlarWarm, K.x, ly + 4.2, K.z));
    domeRoof(g7, K.x, K.z, ly + 5.2, 1.15, 1.2, M.slate, false);
    g7.add(mesh(cylGeo(0.4, 0.45, 1.2, 8), M.ashlarWarm, K.x, ly + 7.0, K.z));
    g7.add(mesh(new THREE.ConeGeometry(0.5, 1.2, 8), M.slate, K.x, ly + 8.2, K.z));
    // 金のユリの紋章
    const fl = new THREE.Group();
    fl.add(mesh(boxGeo(0.12, 0.8, 0.12), M.gold, 0, 0.4, 0));
    for (const s of [-1, 1]) { const p = mesh(boxGeo(0.1, 0.5, 0.1), M.gold, s * 0.18, 0.55, 0); p.rotation.z = s * 0.6; fl.add(p); }
    fl.position.set(K.x, ly + 8.8, K.z);
    g7.add(fl);
    flagPole(g7, CX, TY + 3.8, CZ + D / 2 - 1, 'fr', { h: 1.8, w: 1.1 });
  }

  // 8. 庭（フランス式）と森
  {
    const b = new Batch();
    for (let i = -2; i <= 2; i++) for (let j = 0; j < 2; j++) {
      if (i === 0) continue;
      const x = i * 5.2, z = 15 + j * 0;
      void z;
    }
    // 北の庭（パルテール）
    for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) {
      const x = -13 + i * 5.2, z = -18.5 - j * 4;
      b.box('grass', 4.2, 0.15, 3.2, x, 0.08, z);
      b.box('leafDark', 4.2, 0.35, 0.25, x, 0.2, z - 1.5);
      b.box('leafDark', 4.2, 0.35, 0.25, x, 0.2, z + 1.5);
      b.geo('leafDark', new THREE.ConeGeometry(0.4, 1.2, 8), x, 0.6, z);
    }
    // 森
    for (let i = 0; i < 90; i++) {
      const x = rr(-31, 31), z = rr(-31, 31);
      if (Math.abs(x) < 20 && z > -26 && z < 14) continue;
      if (z > 15.5 && z < 22.5) continue;
      if (Math.abs(x) < 3 && z > 10) continue;
      if (rnd() < 0.5) spruce(b, x, 0, z, rr(1, 1.4)); else roundTree(b, x, 0, z, rr(1, 1.4));
    }
    b.box('gravel', 3, 0.05, 22, 0, 0.03, 21);
    b.build(g8);
    g8.add(mesh(boxGeo(3.4, 0.4, 6), M.ashlarWarm, 0, 0.3, 19));
  }

  // 9. 馬と馬車（狩り）
  {
    const road = [V(0, 0.1, 31), V(0, 0.55, 19), V(0, TY, 9.5), V(0, TY, 5)];
    const c = carriage(M.darkWood, { horses: 2 });
    g9.add(c);
    ctx.addWalker(8, c, road, { speed: 0.012, bob: 0.02 });
    for (let i = 0; i < 4; i++) {
      const h = horse(i % 2 ? M.horse : M.horseWhite);
      const rider = person(M.redCoat, 'cap'); rider.position.y = 0.75; rider.scale.setScalar(0.85); h.add(rider);
      g9.add(h);
      ctx.addWalker(8, h, [V(-30, 0, 26), V(-16, 0, 25), V(-16, 0, -24), V(-30, 0, -24), V(-30, 0, 26)], { loop: true, u: i * 0.04, speed: 0.012, bob: 0.08 });
    }
    crowd(ctx, 8, [V(-14, TY, 5.5), V(14, TY, 5.5)], 6, { lateral: 0.4 });
    birds(ctx, 8, 6, { h: [18, 24] });
  }

  // 10. 灯り
  {
    const list = [];
    for (let z = 22; z <= 30; z += 2.6) { lampPost(g10, list, -1.8, 0, z); lampPost(g10, list, 1.8, 0, z); }
    for (let x = -13; x <= 13; x += 3.25) list.push([x, TY + 0.5, CZ + D / 2 + 0.4]);
    g10.add(lanternsMesh(list, { size: 0.28, sphere: true }));
  }
  void hipHall;
}
