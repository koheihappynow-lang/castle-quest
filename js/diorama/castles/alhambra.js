// アルハンブラ宮殿（スペイン）
import {
  THREE, M, V, rr, rnd, mesh, boxGeo, cylGeo, stoneBaseGeo, Batch, windowsMesh, windowSpots, squareTower, hipHall,
  crenelWall, merlonsRect, flagPole, crag, mountain, waterPlane, ground, cypress, orangeTree, roundTree, whiteHouse,
  columns, crowd, birds, hill, lampPost, lanternsMesh, sub,
} from '../engine.js';

export function build(ctx) {
  const [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10] = ctx.stages;
  ground(ctx.base, 64, 64, 0, 0, M.grass);
  ctx.signAt(0, 0, 8);
  ctx.setCamera([28, 24, 40], [0, 6, -2]);
  ctx.setFocus(0, 8, -3, 18);

  // 1. 丘とシエラ・ネバダ山脈
  for (const [x, z, r, h] of [[-24, -26, 10, 15], [-8, -28, 11, 19], [10, -27, 12, 21], [26, -24, 9, 15]]) mountain(g1, { x, z, r, h, mat: M.mountainGrey, snow: true });
  const CY = crag(g1, { x: 0, z: -4, rTop: 8, rBot: 11, h: 4, sx: 1.9, mat: M.mountain, top: M.gravel, jitter: 0.1 });

  // 2. 赤い土台
  const W = 30, D = 11, TY = CY + 0.8;
  g2.add(mesh(stoneBaseGeo(W + 1, D + 1, W, D, 0.8, false), M.ochre, 0, CY, -4));
  g2.add(mesh(boxGeo(W, 0.1, D), M.gravel, 0, TY - 0.04, -4));

  // 3. 城壁
  const hx = W / 2 - 0.3, z1 = -4 - D / 2 + 0.3, z2 = -4 + D / 2 - 0.3;
  const opt = { y: TY, h: 2.4, t: 0.6, wall: M.ochre };
  crenelWall(g3, -hx, z1, hx, z1, opt);
  crenelWall(g3, -hx, z2, -3, z2, opt);
  crenelWall(g3, -0.6, z2, hx, z2, opt);
  crenelWall(g3, -hx, z1, -hx, z2, opt);
  crenelWall(g3, hx, z1, hx, z2, opt);
  crenelWall(g3, -7, z1, -7, z2, opt);

  // 4. 四角い塔（ベラの塔・コマレスの塔など）
  {
    const wins = [];
    squareTower(g4, { x: -13.4, z: z2 - 0.6, y: TY, w: 3.2, h: 6.5, wall: M.ochre, roof: 'crenel', wins, winRows: 2 });
    squareTower(g4, { x: -9.8, z: z1 + 0.6, y: TY, w: 2.4, h: 5.2, wall: M.ochre, roof: 'crenel', wins });
    squareTower(g4, { x: -1, z: z1 + 0.4, y: TY, w: 4, d: 3.6, h: 7.2, wall: M.ochre, roof: 'crenel', wins, winRows: 3 });
    for (const x of [4.5, 9, 13.5]) squareTower(g4, { x, z: z1 + 0.2, y: TY, w: 2, h: 4, wall: M.ochre, roof: 'crenel', wins });
    for (const x of [-11, 6, 11]) squareTower(g4, { x, z: z2 - 0.2, y: TY, w: 1.8, h: 3.6, wall: M.ochre, roof: 'crenel', wins });
    // ベラの塔の鐘
    g4.add(mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.5, 10), M.bronze, -13.4, TY + 7.3, z2 - 0.6));
    g4.add(mesh(boxGeo(0.1, 1.0, 0.1), M.iron, -13.4, TY + 7.1, z2 - 0.6));
    g4.add(windowsMesh(wins, { arch: true, w: 0.36, h: 0.7 }));
  }

  // 5. 宮殿（ナスル朝宮殿・カルロス5世宮殿）
  {
    const wins = [];
    // コマレス宮（アラヤネスの中庭のまわり）
    g5.add(mesh(boxGeo(2.2, 3.2, 6), M.cream, -3.6, TY + 1.6, -5));
    g5.add(mesh(boxGeo(2.2, 3.2, 6), M.cream, 1.6, TY + 1.6, -5));
    g5.add(mesh(boxGeo(7.4, 3.2, 1.8), M.cream, -1, TY + 1.6, -1.2));
    // ライオン宮
    g5.add(mesh(boxGeo(7, 2.8, 1.6), M.cream, 7.2, TY + 1.4, -7.4));
    g5.add(mesh(boxGeo(7, 2.8, 1.6), M.cream, 7.2, TY + 1.4, -1.8));
    // カルロス5世宮殿（四角い建物）
    g5.add(mesh(boxGeo(5.2, 3.6, 5.2), M.limestone, -4.5, TY + 1.8, 3.6 - 3.6));
    windowSpots(wins, -4.5, 0, 5.2, 5.2, TY + 1.2, 1.1); windowSpots(wins, -4.5, 0, 5.2, 5.2, TY + 2.7, 1.1);
    g5.add(mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.12, 24), M.gravel, -4.5, TY + 3.62, 0));
    windowSpots(wins, -1, -1.2, 7.4, 1.8, TY + 2.0, 1.2);
    g5.add(windowsMesh(wins, { arch: true, w: 0.36, h: 0.7 }));
  }

  // 6. 屋根と中庭（アラヤネスの池）
  {
    for (const [x, z, w, d] of [[-3.6, -5, 2.2, 6], [1.6, -5, 2.2, 6], [-1, -1.2, 7.4, 1.8]]) hipHall(g6, { x, z, y: TY + 3.2, w, d, h: 0.01, wall: M.cream, roofMat: M.terracotta, rise: 0.6, ov: 0.3 });
    for (const z of [-7.4, -1.8]) hipHall(g6, { x: 7.2, z, y: TY + 2.8, w: 7, d: 1.6, h: 0.01, wall: M.cream, roofMat: M.terracotta, rise: 0.5, ov: 0.3 });
    // 池と生け垣
    g6.add(mesh(boxGeo(2.4, 0.12, 5.4), M.marble, -1, TY + 0.06, -5));
    g6.add(mesh(new THREE.PlaneGeometry(1.4, 4.8).rotateX(-Math.PI / 2), M.pool, -1, TY + 0.14, -5));
    const b = new Batch();
    for (const s of [-1, 1]) b.box('leafDark', 0.35, 0.5, 4.8, -1 + s * 0.95, TY + 0.25, -5);
    b.build(g6);
    columns(g6, [-2.2, -1.6, -1.0, -0.4, 0.2].map(x => [x, -2.3]), { h: 1.6, r: 0.08, y: TY });
  }

  // 7. ライオンの噴水とアーチの回廊
  {
    const cx = 7.2, cz = -4.6;
    g7.add(mesh(boxGeo(6.2, 0.1, 3.8), M.marble, cx, TY + 0.05, cz));
    const pts = [];
    for (let i = 0; i <= 8; i++) { const x = cx - 2.9 + i * 0.725; pts.push([x, cz - 1.7], [x, cz + 1.7]); }
    for (let i = 1; i < 4; i++) { const z = cz - 1.7 + i * 0.85; pts.push([cx - 2.9, z], [cx + 2.9, z]); }
    columns(g7, pts, { h: 1.6, r: 0.07, y: TY });
    g7.add(mesh(boxGeo(6.2, 0.3, 0.5), M.tilePattern, cx, TY + 1.8, cz - 1.7));
    g7.add(mesh(boxGeo(6.2, 0.3, 0.5), M.tilePattern, cx, TY + 1.8, cz + 1.7));
    // 噴水と12ひきのライオン
    g7.add(mesh(cylGeo(0.9, 0.9, 0.35, 16), M.marble, cx, TY + 0.2, cz));
    g7.add(mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.05, 16), M.pool, cx, TY + 0.38, cz));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const l = new THREE.Group();
      l.add(mesh(boxGeo(0.16, 0.18, 0.3), M.marble, 0, 0.09, 0));
      l.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), M.marble, 0, 0.22, 0.12));
      l.position.set(cx + Math.cos(a) * 0.55, TY + 0.4, cz + Math.sin(a) * 0.55);
      l.rotation.y = -a + Math.PI / 2;
      g7.add(l);
    }
    g7.add(mesh(cylGeo(0.15, 0.2, 0.6, 10), M.marble, cx, TY + 0.7, cz));
    g7.add(mesh(new THREE.CylinderGeometry(0.45, 0.2, 0.15, 14), M.marble, cx, TY + 1.05, cz));
    const jet = mesh(new THREE.ConeGeometry(0.06, 0.5, 8), M.pool, cx, TY + 1.35, cz); jet.castShadow = false; g7.add(jet);
    ctx.addUpdater(6, t => { jet.scale.y = 1 + Math.sin(t * 6) * 0.15; });
    flagPole(g7, -13.4, TY + 7.8, z2 - 0.6, 'es', { h: 1.8, w: 1.1 });
    flagPole(g7, -1, TY + 7.6, z1 + 0.4, 'es', { h: 1.6, w: 0.9 });
  }

  // 8. 白い町（アルバイシン）と木・ヘネラリフェの庭
  {
    const b = new Batch();
    hill(g8, -6, 20, 11, 0.36, M.mountain);
    for (let i = 0; i < 46; i++) {
      const a = rr(0, Math.PI * 2), r = Math.sqrt(rnd()) * 9.5;
      const x = -6 + Math.cos(a) * r, z = 20 + Math.sin(a) * r * 0.85;
      if (z > 30.5 || x < -31) continue;
      const rr2 = Math.hypot(x + 6, z - 20);
      const y = Math.sqrt(Math.max(0, 1 - (rr2 / 11) ** 2)) * 11 * 0.36 - 0.3;
      whiteHouse(b, x, z, rnd() * 3, { y, tiled: rnd() < 0.7 });
    }
    for (let i = 0; i < 14; i++) cypress(b, rr(-20, 8), 0, rr(9, 13), rr(0.8, 1.2));
    // ヘネラリフェの庭（東）
    g8.add(mesh(boxGeo(1.2, 0.1, 10), M.marble, 22, 0.05, -4));
    g8.add(mesh(new THREE.PlaneGeometry(0.8, 9.6).rotateX(-Math.PI / 2), M.pool, 22, 0.12, -4));
    for (let z = -8.5; z <= 0.5; z += 1.5) { cypress(b, 20.4, 0, z, 0.8); cypress(b, 23.6, 0, z, 0.8); }
    for (const [x, z] of [[18, 6], [26, 6], [18, -12], [26, -12], [28, -2], [16, 2]]) orangeTree(b, x, 0, z, 1.0);
    for (let i = 0; i < 18; i++) roundTree(b, rr(-30, 30), 0, rr(-18, -12), rr(0.9, 1.3));
    b.build(g8);
  }

  // 9. 人
  {
    crowd(ctx, 8, [V(-2, TY, 3.6), V(13, TY, 3.6), V(13, TY, -1)], 7, { lateral: 0.5 });
    crowd(ctx, 8, [V(-1.8, 0, 7.5), V(-1.8, 0, 2), V(-1.8, CY, -0.5)], 4);
    crowd(ctx, 8, [V(20, 0, 4), V(20, 0, -10), V(24, 0, -10), V(24, 0, 4)], 4, { loop: true, lateral: 0.2 });
    birds(ctx, 8, 6, { h: [14, 20] });
  }

  // 10. 灯り
  {
    const list = [];
    for (let x = -13; x <= 13; x += 2.6) { list.push([x, TY + 2.7, z2 + 0.1]); list.push([x, TY + 2.7, z1 - 0.1]); }
    for (const [x, z] of [[-1.8, 6], [-1.8, 3], [18, 6], [26, 6]]) lampPost(g10, list, x, 0, z);
    g10.add(lanternsMesh(list, { size: 0.26, sphere: true }));
  }
  void merlonsRect; void sub;
}
