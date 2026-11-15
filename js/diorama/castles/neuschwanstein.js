// ノイシュヴァンシュタイン城（ドイツ）
import {
  THREE, M, V, rr, mesh, boxGeo, stoneBaseGeo, Batch, windowsMesh, roundTower, squareTower, gableRoof, coneRoof,
  crenelWall, flagPole, crag, mountain, waterPlane, ground, spruce, roundTree, euroHouse, carriage, boat, crowd,
  birds, petals, ramp, lampPost, lanternsMesh, merlonsRect, TEX,
} from '../engine.js';

export function build(ctx) {
  const [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10] = ctx.stages;
  ground(ctx.base, 64, 64, 0, 0);
  ctx.signAt(4, 0, 4);
  ctx.setCamera([30, 26, 42], [2, 9, -1]);
  ctx.setFocus(4, 12, -2, 16);

  // 1. 山と湖・岩山
  for (const [x, z, r, h] of [[-22, -24, 11, 22], [-4, -27, 12, 27], [14, -25, 11, 23], [27, -20, 8, 16], [-30, -12, 7, 12]]) mountain(g1, { x, z, r, h, mat: M.mountainGrey, snow: true });
  g1.add(mesh(boxGeo(19, 0.06, 12), M.sand, -18, 0.03, -7));
  waterPlane(g1, 18, 11, -18, -7, 0.08);
  const CY = crag(g1, { x: 5, z: -2, rTop: 8, rBot: 11, h: 6, sx: 1.35, mat: M.rock, top: M.grass, jitter: 0.14 });

  // 2. 岩の土台（テラス）
  const TY = CY + 1.2;
  g2.add(mesh(stoneBaseGeo(21, 9.5, 20, 8.6, 1.2, false), M.stoneWarm, 4.5, CY, -2));
  g2.add(mesh(boxGeo(20, 0.1, 8.6), M.gravel, 4.5, TY - 0.04, -2));
  ramp(g2, V(-22, 0.02, 5), V(-9.6, CY + 0.6, -0.5), 2.6, M.gravel);
  g2.add(mesh(boxGeo(3, 0.3, 3), M.gravel, -8.4, CY + 0.45, -0.8));

  // 3. 門（赤レンガ）と城壁
  {
    const wins = [];
    g3.add(mesh(boxGeo(3.6, 3.6, 3.4), M.brick, -4.2, TY + 1.8, -1.2));
    g3.add(mesh(boxGeo(1.6, 2.2, 0.2), M.darkWood, -6.0, TY + 1.1, -1.2).rotateY(Math.PI / 2));
    gableRoof(g3, { x: -4.2, z: -1.2, y: TY + 3.6, w: 3.6, d: 3.4, ry: Math.PI / 2, wall: M.brick, roofMat: M.slate, roofH: 2.0 });
    for (const z of [-2.9, 0.5]) roundTower(g3, { x: -6.0, z, y: TY, r: 0.45, h: 4.6, wall: M.limestone, roof: 'cone', roofMat: M.slate, roofH: 1.6, wins });
    crenelWall(g3, -2.4, 2.1, 14, 2.1, { y: TY, h: 1.2, t: 0.4, wall: M.limestone });
    crenelWall(g3, -2.4, -6.1, 14, -6.1, { y: TY, h: 1.2, t: 0.4, wall: M.limestone });
    crenelWall(g3, 14.3, -6.1, 14.3, 2.1, { y: TY, h: 1.2, t: 0.4, wall: M.limestone });
    g3.add(windowsMesh(wins, { arch: true }));
  }

  // 4. 細い塔
  {
    const wins = [];
    roundTower(g4, { x: 12.3, z: -4.3, y: TY, r: 1.05, h: 10.5, wall: M.limestone, roof: 'cone', roofMat: M.slate, roofH: 3.4, wins, winRows: 4 });
    roundTower(g4, { x: 2.0, z: -4.7, y: TY, r: 0.55, h: 9.6, wall: M.limestone, roof: 'cone', roofMat: M.slate, roofH: 2.2, wins, winRows: 3 });
    roundTower(g4, { x: 9.6, z: 0.4, y: TY, r: 0.5, h: 9.2, wall: M.limestone, roof: 'cone', roofMat: M.slate, roofH: 2.0, wins, winRows: 3 });
    roundTower(g4, { x: 3.0, z: 0.3, y: TY, r: 0.45, h: 8.2, wall: M.limestone, roof: 'cone', roofMat: M.slate, roofH: 1.8, wins });
    const st = squareTower(g4, { x: -0.6, z: -0.6, y: TY, w: 1.9, h: 8.2, wall: M.limestone, roof: 'crenel', wins, winRows: 3 });
    roundTower(g4, { x: -0.6 + 0.75, z: -0.6 + 0.75, y: st, r: 0.3, h: 1.3, wall: M.limestone, roof: 'cone', roofMat: M.slate, roofH: 1.1 });
    g4.add(windowsMesh(wins, { arch: true, w: 0.28, h: 0.5 }));
  }

  // 5. 宮殿（パラス）と騎士の館
  {
    const wins = [];
    g5.add(mesh(boxGeo(9.4, 8.0, 3.4), M.limestone, 7.3, TY + 4.0, -2.4));
    for (let row = 0; row < 4; row++) for (let i = 0; i < 9; i++) {
      const x = 7.3 - 4.2 + i * 1.05, y = TY + 1.4 + row * 1.75;
      wins.push([x, y, -2.4 + 1.72, 0], [x, y, -2.4 - 1.72, 0]);
    }
    g5.add(mesh(boxGeo(5.2, 4.6, 2.6), M.limestone, 0.6, TY + 2.3, -3.4));
    for (let row = 0; row < 2; row++) for (let i = 0; i < 5; i++) wins.push([0.6 - 2.1 + i * 1.05, TY + 1.4 + row * 1.6, -3.4 + 1.32, 0]);
    // 王の部屋のバルコニー
    g5.add(mesh(boxGeo(3.2, 0.15, 0.8), M.limestone, 7.3, TY + 5.3, -0.3));
    g5.add(mesh(boxGeo(3.2, 0.5, 0.08), M.limestone, 7.3, TY + 5.6, 0.1));
    g5.add(windowsMesh(wins, { arch: true, w: 0.34, h: 0.7 }));
  }

  // 6. 青い屋根
  {
    gableRoof(g6, { x: 7.3, z: -2.4, y: TY + 8.0, w: 9.4, d: 3.4, wall: M.limestone, roofMat: M.slate, roofH: 2.6 });
    gableRoof(g6, { x: 0.6, z: -3.4, y: TY + 4.6, w: 5.2, d: 2.6, wall: M.limestone, roofMat: M.slate, roofH: 2.0 });
    // 破風の上の小さな塔
    for (const x of [2.8, 11.8]) { roundTower(g6, { x, z: -0.75, y: TY + 8.0, r: 0.32, h: 1.7, wall: M.limestone, roof: 'cone', roofMat: M.slate, roofH: 1.3 }); }
    for (let i = 0; i < 4; i++) {
      const x = 4.2 + i * 2.1;
      g6.add(mesh(boxGeo(0.7, 0.8, 0.7), M.limestone, x, TY + 8.5, -0.85));
      const c = new THREE.ConeGeometry(0.62, 0.9, 4); c.rotateY(Math.PI / 4);
      g6.add(mesh(c, M.slate, x, TY + 9.35, -0.85));
    }
  }

  // 7. 旗とかざり・マリエン橋
  {
    flagPole(g7, 12.3, TY + 13.9, -4.3, 'de', { h: 1.6, w: 0.9 });
    flagPole(g7, -0.6, TY + 8.6, -0.6, 'de', { h: 1.8, w: 0.9 });
    flagPole(g7, 7.3, TY + 10.6, -2.4, 'de', { h: 1.6, w: 0.9 });
    // 白鳥の像
    const swan = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(0.4, 12, 8), M.white); body.scale.set(0.8, 0.6, 1.3); swan.add(body);
    const neck = mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.7, 8), M.white, 0, 0.45, 0.35); neck.rotation.x = -0.3; swan.add(neck);
    swan.add(mesh(new THREE.ConeGeometry(0.07, 0.25, 6), M.gold, 0, 0.8, 0.5).rotateX(Math.PI / 2));
    swan.position.set(-3.4, TY + 0.2, 1.2);
    g7.add(swan);
    // マリエン橋（谷にかかる鉄の橋）
    g7.add(mesh(new THREE.CylinderGeometry(1.2, 2, 9, 7), M.rockDark, 23, 4.5, -8));
    g7.add(mesh(boxGeo(7.5, 0.25, 1.2), M.iron, 19, 8.6, -6.7).rotateY(0.3));
    for (const dz of [-0.55, 0.55]) g7.add(mesh(boxGeo(7.5, 0.5, 0.05), M.iron, 19, 9.0, -6.7 + dz).rotateY(0.3));
  }

  // 8. 森と村
  {
    const b = new Batch();
    for (let i = 0; i < 70; i++) {
      const a = rr(0, Math.PI * 2), r = rr(15, 30);
      const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.9;
      if (x < -14 && z > 2 && z < 30) continue; // 村
      if (x < -9 && x > -28 && z > -13 && z < -1) continue; // 湖
      if (Math.abs(x) > 31 || Math.abs(z) > 31) continue;
      spruce(b, x, 0, z, rr(0.9, 1.5));
    }
    for (const [x, z, s] of [[18, 6, 1.2], [20, 2, 1.1], [16, 10, 1.3], [-6, 10, 1.1], [-3, 13, 1.0], [24, 12, 1.2]]) spruce(b, x, 0, z, s);
    let r = 0;
    for (const [x, z, ry] of [[-26, 8, 0.3], [-22, 10, 0.2], [-27, 13, -0.1], [-23, 15, 0.4], [-19, 17, 0.1], [-27, 19, 0.3], [-21, 22, -0.2], [-17, 24, 0.5], [-25, 25, 0], [-29, 23, 0.2]]) {
      euroHouse(b, x, z, ry + (r++ % 2) * Math.PI / 2, { walls: ['houseA', 'houseYellow', 'housePink', 'houseWhite'], roof: 'terracotta' });
    }
    for (const [x, z] of [[-14, 18], [-12, 22], [-30, 4], [-16, 28]]) roundTree(b, x, 0, z, 1.1);
    b.build(g8);
    // 村の教会
    const wins = [];
    squareTower(g8, { x: -18, z: 13, w: 1.6, h: 5, wall: M.houseYellow, roof: 'spire', roofMat: M.copper, roofH: 3, wins });
    g8.add(mesh(boxGeo(3.6, 2.4, 2.2), M.houseYellow, -19.8, 1.2, 13));
    gableRoof(g8, { x: -19.8, z: 13, y: 2.4, w: 3.6, d: 2.2, wall: M.houseYellow, roofMat: M.terracotta, roofH: 1.2 });
    g8.add(windowsMesh(wins, { arch: true }));
  }

  // 9. 馬車と人
  {
    const road = [V(-30, 0.05, 28), V(-24, 0.05, 12), V(-22, 0.1, 5), V(-9.6, CY + 0.6, -0.5), V(-7.6, CY + 0.6, -0.9)];
    const c = carriage(M.white, { horseMat: M.horseWhite });
    g9.add(c);
    ctx.addWalker(8, c, road, { speed: 0.01, u: 0.2, bob: 0.02 });
    const c2 = carriage(M.darkWood, { horseMat: M.horse });
    g9.add(c2);
    ctx.addWalker(8, c2, road, { speed: 0.009, u: 0.75, bob: 0.02 });
    crowd(ctx, 8, road, 6, { lateral: 0.9 });
    crowd(ctx, 8, [V(-30, 0, 9), V(-14, 0, 9), V(-14, 0, 27)], 5);
    crowd(ctx, 8, [V(-1.5, TY, 1.2), V(12, TY, 1.2)], 4, { lateral: 0.3 });
    const bt = boat(M.clothes[0]);
    g9.add(bt);
    ctx.addWalker(8, bt, [V(-24, 0.1, -10), V(-12, 0.1, -10), V(-12, 0.1, -4), V(-24, 0.1, -4), V(-24, 0.1, -10)], { speed: 0.008, loop: true, bob: 0.01 });
    birds(ctx, 8, 6, { cx: 4, cz: -2, h: [20, 27] });
  }

  // 10. ライトアップ（道の街灯）
  {
    const list = [];
    for (let i = 0; i <= 6; i++) {
      const p = V(-22, 0.1, 5).lerp(V(-9.6, CY + 0.6, -0.5), i / 6);
      lampPost(g10, list, p.x - 1.4, p.y, p.z - 0.6);
    }
    for (const [x, z] of [[-24, 12], [-24, 18], [-20, 20], [-26, 24]]) lampPost(g10, list, x, 0, z);
    g10.add(lanternsMesh(list, { size: 0.28, sphere: true }));
    petals(ctx, 9, { n: 120, tex: TEX.dot, size: 0.25, color: 0xfff6c8, area: 20, top: 16 });
  }
  void merlonsRect;
}
