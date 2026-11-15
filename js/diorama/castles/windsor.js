// ウィンザー城（イギリス）
import {
  THREE, M, V, rr, mesh, boxGeo, stoneBaseGeo, Batch, windowsMesh, windowSpots, roundTower, squareTower, gableRoof,
  crenelWall, merlonsRect, flagPole, crag, waterPlane, ground, roundTree, euroHouse, carriage, person, crowd, birds,
  hill, lampPost, lanternsMesh, sub,
} from '../engine.js';

export function build(ctx) {
  const [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10] = ctx.stages;
  ground(ctx.base, 64, 64, 0, 0);
  ctx.signAt(0, 0, 4);
  ctx.setCamera([30, 28, 44], [0, 4, 0]);
  ctx.setFocus(0, 8, -1, 18);

  // 1. 丘とテムズ川
  const CY = crag(g1, { x: 0, z: -1, rTop: 14, rBot: 17, h: 2.4, sx: 1.6, mat: M.grass, top: M.grass, jitter: 0.04 });
  g1.add(mesh(boxGeo(64, 0.06, 7.5), M.sand, 0, 0.03, -26.5));
  waterPlane(g1, 64, 6, 0, -26.5, 0.08);

  // 2. 石の土台
  const W = 40, D = 17, TY = CY + 0.9;
  g2.add(mesh(stoneBaseGeo(W + 0.8, D + 0.8, W, D, 0.9, false), M.stoneGrey, 0, CY, -1));
  g2.add(mesh(boxGeo(W, 0.1, D), M.gravel, 0, TY - 0.04, -1));
  g2.add(mesh(boxGeo(16, 0.12, 13), M.grass, 13, TY + 0.02, -1));

  // 3. 城壁
  const hx = W / 2 - 0.4, z1 = -1 - D / 2 + 0.4, z2 = -1 + D / 2 - 0.4;
  const opt = { y: TY, h: 2.6, t: 0.9, wall: M.ashlarGrey };
  crenelWall(g3, -hx, z1, hx, z1, opt);
  crenelWall(g3, -hx, z2, -9, z2, opt);
  crenelWall(g3, -6, z2, hx, z2, opt);
  crenelWall(g3, -hx, z1, -hx, z2, opt);
  crenelWall(g3, hx, z1, hx, z2, opt);
  // まん中の小山（モット）
  hill(g3, 0, -1, 4.6, 0.55, M.grass, TY);

  // 4. 四角い塔・門・上の区画の建物
  {
    const wins = [];
    for (const x of [-15, -3, 4, 10, 16]) for (const z of [z1, z2]) if (!(z === z2 && x === -3)) squareTower(g4, { x, z, y: TY, w: 2.2, h: 4.2, wall: M.ashlarGrey, roof: 'crenel', wins });
    for (const [x, z] of [[-hx, z1], [hx, z1], [-hx, z2], [hx, z2]]) roundTower(g4, { x, z, y: TY, r: 1.5, h: 4.4, wall: M.ashlarGrey, roof: 'crenel', wins });
    // ヘンリー8世門
    for (const x of [-9.4, -5.6]) roundTower(g4, { x, z: z2 + 0.3, y: TY, r: 1.0, h: 4.6, wall: M.ashlarGrey, roof: 'crenel', wins });
    g4.add(mesh(boxGeo(3, 3.6, 1.8), M.ashlarGrey, -7.5, TY + 1.8, z2 + 0.3));
    merlonsRect(g4, -7.5, z2 + 0.3, TY + 3.6, 3, 1.8, M.ashlarGrey);
    g4.add(mesh(boxGeo(1.4, 2, 0.1), M.darkWood, -7.5, TY + 1, z2 + 1.25));
    // 上の区画（王の住まい）
    for (const [x, z, w, d] of [[13, z1 + 2, 14, 3.2], [13, z2 - 2, 14, 3.2], [19, -1, 3.2, 10]]) {
      g4.add(mesh(boxGeo(w, 4.2, d), M.ashlarGrey, x, TY + 2.1, z));
      merlonsRect(g4, x, z, TY + 4.2, w, d, M.ashlarGrey, 0.28);
      windowSpots(wins, x, z, w, d, TY + 1.4, 1.1);
      windowSpots(wins, x, z, w, d, TY + 3.0, 1.1);
    }
    g4.add(windowsMesh(wins, { arch: true, w: 0.32, h: 0.6 }));
  }

  // 5. ラウンド・タワー
  {
    const wins = [];
    roundTower(g5, { x: 0, z: -1, y: TY + 2.2, r: 3.4, h: 5.2, wall: M.ashlarGrey, roof: 'crenel', corbel: true, wins, winRows: 2, seg: 28 });
    // 旗の塔
    squareTower(g5, { x: 2.1, z: -1.8, y: TY + 7.6, w: 1.2, h: 1.6, wall: M.ashlarGrey, roof: 'crenel' });
    g5.add(windowsMesh(wins, { arch: true, w: 0.36, h: 0.7 }));
  }

  // 6. 聖ジョージ礼拝堂（ゴシック）
  {
    const wins = [];
    const cx = -13, cz = -1.5;
    g6.add(mesh(boxGeo(10, 4.2, 3.6), M.limestone, cx, TY + 2.1, cz));
    g6.add(mesh(boxGeo(2.4, 3.4, 6.4), M.limestone, cx + 1.5, TY + 1.7, cz));
    gableRoof(g6, { x: cx, z: cz, y: TY + 4.2, w: 10, d: 3.6, wall: M.limestone, roofMat: M.slate, roofH: 1.0 });
    for (let i = 0; i < 9; i++) {
      const x = cx - 4.5 + i * 1.12;
      for (const s of [-1, 1]) {
        g6.add(mesh(boxGeo(0.25, 4.8, 0.3), M.limestone, x, TY + 2.4, cz + s * 1.85));
        g6.add(mesh(new THREE.ConeGeometry(0.16, 0.8, 4), M.limestone, x, TY + 5.2, cz + s * 1.85));
      }
      wins.push([x + 0.56, TY + 2.6, cz + 1.82, 0], [x + 0.56, TY + 2.6, cz - 1.82, 0]);
    }
    // 大きなステンドグラスの窓
    wins.push([cx - 5.02, TY + 2.6, cz, Math.PI / 2]);
    g6.add(windowsMesh(wins, { arch: true, w: 0.55, h: 2.2 }));
    g6.add(windowsMesh([[cx - 5.03, TY + 2.6, cz, Math.PI / 2]], { arch: true, w: 1.8, h: 2.8 }));
  }

  // 7. 旗とかざり
  flagPole(g7, 2.1, TY + 9.2, -1.8, 'royal', { h: 2.4, w: 1.6 });
  for (const [x, z] of [[-hx, z1], [hx, z2], [16, z1], [-15, z2]]) flagPole(g7, x, TY + 4.8, z, 'uk', { h: 1.6, w: 0.9 });
  {
    const b = new Batch();
    for (const [x, z] of [[10, 1.5], [13, -3.5], [16, 1.5], [8, -3.5]]) b.geo('leafDark', new THREE.SphereGeometry(0.5, 8, 6), x, TY + 0.5, z);
    b.build(g7);
  }

  // 8. 並木道（ロングウォーク）と町
  {
    const b = new Batch();
    b.box('gravel', 3, 0.05, 23, 13, 0.03, 20.5);
    for (let z = 10.5; z <= 31; z += 2.6) { roundTree(b, 10.6, 0, z, 1.05); roundTree(b, 15.4, 0, z, 1.05); }
    b.box('gravel', 30, 0.05, 2.6, -15, 0.03, 13.5);
    for (let x = -30; x <= -2; x += 2.6) {
      euroHouse(b, x, 16.5, 0, { walls: ['brick', 'houseGrey', 'houseA', 'brick'], roof: 'slate' });
      if (x < -6) euroHouse(b, x, 10.4, Math.PI, { walls: ['brick', 'houseGrey', 'houseA'], roof: 'slate' });
    }
    for (let x = -28; x <= -6; x += 3) euroHouse(b, x, 21.5, 0, { walls: ['brick', 'houseGrey'], roof: 'slate' });
    for (const [x, z] of [[-26, -18], [-20, -19], [22, -18], [28, -17], [26, 6], [29, 12], [-29, 3], [-27, 27], [24, 26]]) roundTree(b, x, 0, z, rr(1, 1.4));
    b.build(g8);
  }

  // 9. 兵隊さんと馬車
  {
    for (let i = 0; i < 6; i++) {
      const p = person(M.redCoat, 'bearskin');
      g9.add(p);
      ctx.addWalker(8, p, [V(-14, TY, 3.6), V(6, TY, 3.6)], { u: i * 0.035, speed: 0.012, bob: 0.03 });
    }
    const coach = carriage(M.gold, { horses: 2, horseMat: M.horseWhite });
    g9.add(coach);
    ctx.addWalker(8, coach, [V(13, 0.05, 31), V(13, 0.05, 9)], { speed: 0.012, u: 0.4, bob: 0.02 });
    crowd(ctx, 8, [V(-30, 0, 13.5), V(0, 0, 13.5)], 7);
    crowd(ctx, 8, [V(12, 0, 31), V(12, 0, 10)], 4, { lateral: 0.6 });
    birds(ctx, 8, 6, { h: [16, 22] });
  }

  // 10. 街灯
  {
    const list = [];
    for (let z = 11; z <= 30; z += 4) { lampPost(g10, list, 11.8, 0, z); lampPost(g10, list, 14.2, 0, z); }
    for (let x = -28; x <= -4; x += 4) lampPost(g10, list, x, 0, 12.4);
    g10.add(lanternsMesh(list, { size: 0.28, sphere: true }));
  }
  void sub;
}

// ---------- 細部の かざり ----------
import * as E from '../engine.js';
export function details(ctx) {
  const [, , , , , , g7, g8, g9, g10] = ctx.stages;
  const TY = 3.3;
  // テムズ川の 白鳥と ボート
  E.swans(ctx, 7, [E.V(-28, 0, -27.5), E.V(28, 0, -27.5), E.V(28, 0, -25.5), E.V(-28, 0, -25.5), E.V(-28, 0, -27.5)], 5, 0.12);
  const bt = E.boat(E.M.clothes[0]); g9.add(bt);
  ctx.addWalker(8, bt, [E.V(-30, 0.1, -26.3), E.V(30, 0.1, -26.3)], { speed: 0.008, bob: 0.01 });
  // 石の 橋
  const br = new E.THREE.Group();
  br.add(E.mesh(E.boxGeo(3.2, 0.5, 8.5), E.M.stoneWarm, 0, 1.2, 0));
  for (const z of [-3.6, -1.2, 1.2, 3.6]) br.add(E.mesh(E.boxGeo(3.2, 1.3, 0.5), E.M.stoneWarm, 0, 0.5, z));
  for (const s of [-1, 1]) br.add(E.mesh(E.boxGeo(0.2, 0.4, 8.5), E.M.stoneWarm, s * 1.5, 1.6, 0));
  br.position.set(-12, 0, -26.5); g8.add(br);
  // 衛兵の 小屋
  E.sentryBox(g7, -10.2, TY, 8.6, 0);
  E.sentryBox(g7, -4.8, TY, 8.6, 0);
  // ロングウォークの 旗
  E.bannerRow(g10, E.V(11.6, 0, 11), E.V(11.6, 0, 30), 5, 'uk', { h: 2.6, w: 0.9 });
  E.bannerRow(g10, E.V(14.4, 0, 11), E.V(14.4, 0, 30), 5, 'uk', { h: 2.6, w: 0.9 });
}
