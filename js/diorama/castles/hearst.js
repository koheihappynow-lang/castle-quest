// ハースト・キャッスル（アメリカ・カリフォルニア）
import {
  THREE, M, V, rr, rnd, mesh, boxGeo, cylGeo, stoneBaseGeo, triPrism, Batch, windowsMesh, windowSpots, squareTower, hipHall,
  domeRoof, columns, flagPole, crag, waterPlane, ground, palm, cypress, orangeTree, roundTree, horse, person, crowd, birds,
  hill, lampPost, lanternsMesh, sub, ramp,
} from '../engine.js';

export function build(ctx) {
  const [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10] = ctx.stages;
  // 東は陸、西は太平洋
  ground(ctx.base, 50, 64, 7, 0);
  ctx.base.add(mesh(boxGeo(14, 1, 64), M.sand, -25, -0.9, 0));
  ctx.signAt(2, 0, 2);
  ctx.setCamera([20, 17, 28], [1, 8, -1]);
  ctx.setFocus(3, 10, -2, 16);

  // 1. 丘と海
  waterPlane(g1, 14, 64, -25, 0, -0.35);
  g1.add(mesh(boxGeo(3, 0.6, 64), M.sand, -18.5, -0.3, 0));
  for (const [x, z, r] of [[22, -22, 9], [24, 18, 10], [-6, 24, 8], [-8, -24, 8]]) hill(g1, x, z, r, 0.45, M.straw);
  const CY = crag(g1, { x: 3, z: -1, rTop: 9.5, rBot: 14, h: 5, sx: 1.25, mat: M.straw, top: M.grass, jitter: 0.08 });

  // 2. テラス
  const TY = CY + 0.6;
  g2.add(mesh(stoneBaseGeo(20, 16, 19, 15, 0.6, false), M.ashlarWarm, 4, CY, -1));
  g2.add(mesh(boxGeo(19, 0.1, 15), M.paving, 4, TY - 0.04, -1));
  g2.add(mesh(stoneBaseGeo(8.5, 15, 8, 14.5, 0.4, false), M.ashlarWarm, -6.5, CY, -1));
  g2.add(mesh(boxGeo(8, 0.1, 14.5), M.paving, -6.5, CY + 0.36, -1));
  ramp(g2, V(28, 0.05, 10), V(13, TY, 3), 2.4, M.gravel);

  // 3. ネプチューン・プール
  const PY = CY + 0.4;
  {
    const px = -6.5, pz = -1;
    g3.add(mesh(boxGeo(5.2, 0.14, 11.5), M.marble, px, PY + 0.06, pz));
    const pool = mesh(new THREE.PlaneGeometry(3.6, 10).rotateX(-Math.PI / 2), M.pool, px, PY + 0.15, pz); pool.castShadow = false; g3.add(pool);
    // 神殿の正面（柱と三角屋根）
    const tz = pz - 6.2;
    g3.add(mesh(boxGeo(4.4, 0.4, 2.2), M.marble, px, PY + 0.2, tz));
    columns(g3, [-1.8, -0.6, 0.6, 1.8].map(x => [px + x, tz + 0.8]), { h: 2.8, r: 0.16, y: PY + 0.4 });
    g3.add(mesh(boxGeo(4.4, 0.4, 2.2), M.marble, px, PY + 3.4, tz));
    const ped = triPrism(4.4, 1.0, 2.2); ped.translate(0, 0, 1.1);
    g3.add(mesh(ped, M.marble, px, PY + 3.6, tz));
    // まわりの回廊（柱）
    const pts = [];
    for (let i = 0; i < 9; i++) { const z = pz - 4.5 + i * 1.1; pts.push([px - 2.5, z], [px + 2.5, z]); }
    columns(g3, pts, { h: 1.6, r: 0.1, y: PY + 0.1 });
    // 白い像
    for (const z of [pz - 3, pz + 1, pz + 4.6]) for (const s of [-1, 1]) {
      g3.add(mesh(boxGeo(0.4, 0.5, 0.4), M.marble, px + s * 2.0, PY + 0.4, z));
      g3.add(mesh(new THREE.ConeGeometry(0.18, 0.7, 8), M.marble, px + s * 2.0, PY + 1.0, z));
      g3.add(mesh(new THREE.SphereGeometry(0.11, 8, 6), M.marble, px + s * 2.0, PY + 1.42, z));
    }
  }

  // 4. ゲストハウス
  const wins = [];
  {
    for (const [x, z, w, d] of [[11, -6, 3.6, 3.0], [11, 4, 3.6, 3.0], [-0.5, 5.2, 3.0, 2.6]]) {
      hipHall(g4, { x, z, y: TY, w, d, h: 2.4, wall: M.cream, roofMat: M.terracotta, rise: 0.8, ov: 0.35, wins, winRows: 2 });
    }
  }

  // 5. おおきな館（カサ・グランデ）
  const HX = 3.2, HZ = -2.5;
  {
    g5.add(mesh(boxGeo(7.4, 6.6, 5.6), M.cream, HX, TY + 3.3, HZ));
    g5.add(mesh(boxGeo(4.2, 7.4, 1.4), M.cream, HX, TY + 3.7, HZ + 3.3));
    for (let row = 0; row < 3; row++) windowSpots(wins, HX, HZ, 7.4, 5.6, TY + 1.4 + row * 1.9, 1.2);
    for (let row = 0; row < 3; row++) for (const dx of [-1.3, 0, 1.3]) wins.push([HX + dx, TY + 1.5 + row * 2.1, HZ + 4.02, 0]);
    g5.add(mesh(boxGeo(1.4, 2.2, 0.1), M.darkWood, HX, TY + 1.1, HZ + 4.03));
    g5.add(windowsMesh(wins, { arch: true, w: 0.42, h: 0.85 }));
  }

  // 6. 屋根と鐘の塔（2本）
  {
    hipHall(g6, { x: HX, z: HZ, y: TY + 6.6, w: 7.4, d: 5.6, h: 0.01, wall: M.cream, roofMat: M.terracotta, rise: 1.2, ov: 0.4 });
    for (const dx of [-1.6, 1.6]) {
      const x = HX + dx, z = HZ + 3.3;
      const tw = [];
      const top = squareTower(g6, { x, z, y: TY + 7.4, w: 1.5, h: 2.6, wall: M.cream, roof: 'flat', wins: tw, winRows: 1 });
      g6.add(mesh(boxGeo(1.2, 1.2, 1.2), M.cream, x, top + 0.6, z));
      for (const [ax, az, r] of [[0, 0.61, 0], [0, -0.61, 0], [0.61, 0, Math.PI / 2], [-0.61, 0, Math.PI / 2]]) tw.push([x + ax, top + 0.6, z + az, r]);
      g6.add(mesh(cylGeo(0.5, 0.55, 0.5, 8), M.cream, x, top + 1.45, z));
      domeRoof(g6, x, z, top + 1.7, 0.55, 0.9, M.copper, true);
      g6.add(windowsMesh(tw, { arch: true, w: 0.36, h: 0.75 }));
    }
  }

  // 7. かざり・柱・旗
  {
    columns(g7, [[HX - 1.8, HZ + 4.3], [HX + 1.8, HZ + 4.3]], { h: 2.4, r: 0.13, y: TY, mat: M.marble });
    g7.add(mesh(boxGeo(4.4, 0.25, 0.6), M.marble, HX, TY + 2.55, HZ + 4.2));
    flagPole(g7, 9, TY, 1, 'us', { h: 3, w: 1.4 });
    const b = new Batch();
    for (let i = 0; i < 14; i++) b.box('marble', 0.18, 0.7, 0.18, -2.5 + i * 0.8, TY + 0.35, 6.9);
    b.box('marble', 11, 0.12, 0.25, 2.7, TY + 0.75, 6.9);
    b.build(g7);
  }

  // 8. ヤシと庭
  {
    const b = new Batch();
    for (const [x, z] of [[-1.5, 2], [8, 1], [-1.5, -6], [8, -7], [13, 0], [6, 5.5]]) palm(b, x, TY, z, 0.9);
    for (let z = -7; z <= 5; z += 2.2) { cypress(b, -11, CY + 0.4, z, 0.8); }
    for (const [x, z] of [[1, 5.6], [5.5, -7.5], [12.5, -1.5]]) orangeTree(b, x, TY, z, 0.8);
    for (let i = 0; i < 22; i++) {
      const x = rr(-14, 31), z = rr(-31, 31);
      if (Math.hypot((x - 3) / 1.25, z + 1) < 15) continue;
      roundTree(b, x, 0, z, rr(0.8, 1.2), rnd() < 0.5 ? 'leafDark' : 'leaf');
    }
    // 花壇
    for (let i = 0; i < 40; i++) b.geo(['redCloth', 'yellowWall', 'housePink'][i % 3], new THREE.SphereGeometry(0.12, 6, 4), rr(-2.5, 12), TY + 0.12, rr(5.8, 6.6));
    b.build(g8);
  }

  // 9. シマウマと人
  {
    for (let i = 0; i < 7; i++) {
      const z = horse(M.zebra);
      z.scale.setScalar(0.9);
      g9.add(z);
      const cx = rr(18, 28), cz = rr(-20, 20);
      ctx.addWalker(8, z, [V(cx, 0, cz), V(cx + rr(-3, 3), 0, cz + rr(2, 4))], { speed: rr(0.01, 0.02), bob: 0.02 });
    }
    crowd(ctx, 8, [V(-2, TY, 6.2), V(12, TY, 6.2)], 5, { lateral: 0.3 });
    crowd(ctx, 8, [V(-8.5, PY + 0.1, -5), V(-8.5, PY + 0.1, 4)], 3, { lateral: 0.2 });
    const rider = horse(M.horse); const p = person(M.clothes[0], 'straw'); p.position.y = 0.75; p.scale.setScalar(0.85); rider.add(p);
    g9.add(rider);
    ctx.addWalker(8, rider, [V(28, 0.05, 10), V(13, TY, 3)], { speed: 0.015, bob: 0.06 });
    birds(ctx, 8, 6, { h: [16, 22], cx: -10 });
  }

  // 10. 灯り
  {
    const list = [];
    for (let i = 0; i <= 5; i++) { const q = V(28, 0.05, 10).lerp(V(13, TY, 3), i / 5); lampPost(g10, list, q.x, q.y, q.z + 1.6); }
    for (const z of [-5, -1, 3]) { list.push([-9.2, PY + 1.8, z]); list.push([-3.8, PY + 1.8, z]); }
    g10.add(lanternsMesh(list, { size: 0.28, sphere: true }));
  }
  void sub;
}
