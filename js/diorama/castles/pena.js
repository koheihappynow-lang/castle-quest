// ペーナ宮殿（ポルトガル・シントラ）
import {
  THREE, M, V, rr, rnd, mesh, boxGeo, cylGeo, stoneBaseGeo, Batch, windowsMesh, windowSpots, roundTower, squareTower,
  merlonsRect, merlonsRing, crenelWall, flagPole, crag, ground, spruce, roundTree, crowd, birds, lampPost, lanternsMesh,
  domeRoof, waterPlane, carriage, sub, mountain,
} from '../engine.js';

export function build(ctx) {
  const [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10] = ctx.stages;
  ground(ctx.base, 64, 64, 0, 0);
  ctx.signAt(0, 0, 0);
  ctx.setCamera([19, 22, 26], [1, 14, 0]);
  ctx.setFocus(0, 16, -1, 14);

  // 1. 山と森の土台（遠くに海）
  ctx.base.add(mesh(boxGeo(64, 0.04, 8), M.sand, 0, 0.02, -28));
  waterPlane(g1, 64, 7, 0, -28.5, 0.06);
  for (const [x, z, r, h] of [[-24, -14, 9, 10], [24, -12, 8, 9], [-22, 20, 8, 8], [22, 22, 9, 9]]) mountain(g1, { x, z, r, h, mat: M.mountain });
  const CY = crag(g1, { x: 0, z: 0, rTop: 8, rBot: 15, h: 10, sx: 1.15, mat: M.mountain, top: M.grass, jitter: 0.12 });

  // 2. 岩の土台
  const TY = CY + 1.2;
  crag(g2, { x: -1, z: 0, y: CY - 0.1, rTop: 6.4, rBot: 7.4, h: 1.3, sx: 1.2, mat: M.rock, top: M.gravel, jitter: 0.08 });
  g2.add(mesh(stoneBaseGeo(9, 6, 8.4, 5.4, 1.0, false), M.stoneGrey, 1, TY, -0.5));
  const UY = TY + 1.0;
  g2.add(mesh(boxGeo(8.4, 0.1, 5.4), M.paving, 1, UY - 0.04, -0.5));

  // 3. 城壁（灰色）と門
  const wins = [];
  {
    const opt = { y: TY, h: 1.6, t: 0.5, wall: M.stoneGrey };
    crenelWall(g3, -8.2, 4.6, 5.8, 4.6, opt);
    crenelWall(g3, -8.2, -4.6, -8.2, 4.6, opt);
    crenelWall(g3, -8.2, -4.6, -2, -4.6, opt);
    for (const [x, z] of [[-8.2, 4.6], [-8.2, -4.6], [5.8, 4.6]]) roundTower(g3, { x, z, y: TY, r: 0.75, h: 2.6, wall: M.stoneGrey, roof: 'crenel', wins, winRows: 1 });
    // 門のアーチ
    g3.add(mesh(boxGeo(2.4, 3.0, 1.2), M.stoneGrey, -4.5, TY + 1.5, 4.6));
    g3.add(mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.25, 16, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2), M.window, -4.5, TY + 1.4, 4.6));
    g3.add(mesh(boxGeo(1.2, 1.4, 1.25), M.window, -4.5, TY + 0.7, 4.6));
    merlonsRect(g3, -4.5, 4.6, TY + 3.0, 2.4, 1.2, M.stoneGrey, 0.26);
  }

  // 4. 時計塔（赤）
  {
    const top = squareTower(g4, { x: -2.8, z: -2.2, y: UY, w: 2, h: 7.5, wall: M.redOchre, roof: 'crenel', wins, winRows: 3 });
    for (const [dx, dz, ry] of [[0, 1.02, 0], [0, -1.02, 0], [1.02, 0, Math.PI / 2], [-1.02, 0, Math.PI / 2]]) {
      const c = mesh(new THREE.CircleGeometry(0.45, 20), M.white, -2.8 + dx, UY + 6.2, -2.2 + dz);
      c.rotation.y = ry + (dz < 0 || dx < 0 ? Math.PI : 0);
      g4.add(c);
    }
    roundTower(g4, { x: -2.8, z: -2.2, y: top, r: 0.6, h: 1.2, wall: M.yellowWall, roof: 'dome', roofMat: M.yellowWall, roofH: 0.9, wins, winRows: 1 });
  }

  // 5. 黄色い宮殿と赤い修道院
  {
    g5.add(mesh(boxGeo(5.8, 3.6, 3.4), M.redOchre, -0.6, UY + 1.8, -1.6));
    merlonsRect(g5, -0.6, -1.6, UY + 3.6, 5.8, 3.4, M.redOchre, 0.26);
    windowSpots(wins, -0.6, -1.6, 5.8, 3.4, UY + 1.2, 1.1); windowSpots(wins, -0.6, -1.6, 5.8, 3.4, UY + 2.6, 1.1);
    g5.add(mesh(boxGeo(5, 4.4, 3.2), M.yellowWall, 2.6, UY + 2.2, 1.0));
    merlonsRect(g5, 2.6, 1.0, UY + 4.4, 5, 3.2, M.yellowWall, 0.26);
    windowSpots(wins, 2.6, 1.0, 5, 3.2, UY + 1.3, 1.1); windowSpots(wins, 2.6, 1.0, 5, 3.2, UY + 3.0, 1.1);
    // 大きな丸い塔（黄）
    g5.add(mesh(cylGeo(1.7, 1.8, 7.6, 24), M.yellowWall, 5.0, UY + 3.8, -1.6));
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + r * 0.4; wins.push([5 + Math.sin(a) * 1.72, UY + 1.6 + r * 2.0, -1.6 + Math.cos(a) * 1.72, a]); }
    merlonsRing(g5, 5.0, -1.6, UY + 7.6, 1.75, M.yellowWall);
    // 小さい塔
    for (const [x, z] of [[0.3, 2.5], [-3.4, 0.2]]) roundTower(g5, { x, z, y: UY, r: 0.5, h: 5.4, wall: M.yellowWall, roof: 'none', wins, winRows: 2 });
    g5.add(windowsMesh(wins, { arch: true, w: 0.32, h: 0.6 }));
  }

  // 6. 丸い屋根
  {
    domeRoof(g6, 5.0, -1.6, UY + 7.6, 1.5, 1.6, M.copper, true);
    g6.add(mesh(cylGeo(1.5, 1.5, 0.4, 24), M.yellowWall, 5.0, UY + 7.8, -1.6));
    domeRoof(g6, 5.0, -1.6, UY + 8.0, 1.45, 1.6, M.copper, true);
    for (const [x, z] of [[0.3, 2.5], [-3.4, 0.2]]) {
      const pts = [[0, 0], [0.55, 0.05], [0.66, 0.3], [0.5, 0.65], [0.2, 0.95], [0.05, 1.15], [0, 1.25]].map(([a, b]) => new THREE.Vector2(a, b));
      g6.add(mesh(new THREE.LatheGeometry(pts, 16), M.copper, x, UY + 5.4, z));
      g6.add(mesh(new THREE.ConeGeometry(0.04, 0.5, 6), M.gold, x, UY + 6.85, z));
    }
    for (const [x, z, w, d] of [[-0.6, -1.6, 5.8, 3.4], [2.6, 1.0, 5, 3.2]]) g6.add(mesh(boxGeo(w - 0.4, 0.15, d - 0.4), M.terracotta, x, (w > 5.5 ? UY + 3.6 : UY + 4.4) + 0.08, z));
  }

  // 7. 旗とかざり（タイルの帯）
  {
    flagPole(g7, -2.8, UY + 9.6, -2.2, 'pt', { h: 1.8, w: 1.0 });
    flagPole(g7, 2.6, UY + 4.6, 1.0, 'pt', { h: 1.6, w: 0.9 });
    g7.add(mesh(boxGeo(5.06, 0.3, 3.26), M.tilePattern, 2.6, UY + 3.9, 1.0));
    g7.add(mesh(cylGeo(1.73, 1.73, 0.3, 24), M.tilePattern, 5.0, UY + 6.8, -1.6));
    // 門の上のトリトン（海の怪物）
    const tr = new THREE.Group();
    tr.add(mesh(new THREE.SphereGeometry(0.5, 10, 8), M.copper, 0, 0, 0));
    tr.add(mesh(new THREE.ConeGeometry(0.25, 0.9, 8), M.copper, 0, -0.6, 0.2).rotateX(0.6));
    tr.position.set(-4.5, TY + 2.4, 5.3);
    g7.add(tr);
    // 戦士の像（となりの岩の上）
    const rock = crag(g7, { x: -11, z: -8, y: 0, rTop: 1.4, rBot: 3, h: 9, mat: M.rock, top: M.rock });
    g7.add(mesh(boxGeo(0.6, 0.5, 0.6), M.stoneGrey, -11, rock + 0.25, -8));
    g7.add(mesh(new THREE.ConeGeometry(0.28, 1.0, 8), M.stoneGrey, -11, rock + 1.0, -8));
    g7.add(mesh(new THREE.SphereGeometry(0.15, 8, 6), M.stoneGrey, -11, rock + 1.6, -8));
  }

  // 8. 森の小道
  {
    const b = new Batch();
    for (let i = 0; i < 120; i++) {
      const a = rr(0, Math.PI * 2), r = rr(9, 31);
      const x = Math.cos(a) * r * 1.0, z = Math.sin(a) * r;
      if (Math.abs(x) > 31 || z > 31 || z < -24) continue;
      const surface = Math.max(0, CY * (1 - Math.max(0, (Math.hypot(x / 1.15, z) - 8) / 7)));
      if (rnd() < 0.55) spruce(b, x, surface - 0.2, z, rr(0.9, 1.4)); else roundTree(b, x, surface - 0.2, z, rr(0.9, 1.3), rnd() < 0.5 ? 'leafDark' : 'leaf');
    }
    b.build(g8);
  }

  // 9. 人と馬車
  {
    const path = [V(28, 0, 26), V(16, 0, 18), V(12, 0, 8), V(9, CY * 0.5, 9), V(6, CY - 0.4, 6.6), V(-4.5, TY, 6.4), V(-4.5, TY, 3.6)];
    crowd(ctx, 8, path, 8, { lateral: 0.5 });
    const c = carriage(M.yellowWall, { horses: 2, horseMat: M.horseWhite });
    g9.add(c);
    ctx.addWalker(8, c, path.slice(0, 3), { speed: 0.012, bob: 0.02 });
    crowd(ctx, 8, [V(-2, UY, 3.5), V(5, UY, 3.5)], 3, { lateral: 0.2 });
    birds(ctx, 8, 7, { h: [22, 28] });
  }

  // 10. 灯り
  {
    const list = [];
    for (const [x, z] of [[-7, 3], [-1, 3.8], [4, 3.8], [-7, -3], [6.5, 3]]) list.push([x, TY + 1.9, z]);
    for (let i = 0; i < 6; i++) { const p = V(28, 0, 26).lerp(V(12, 0, 8), i / 5); lampPost(g10, list, p.x + 1.2, 0, p.z); }
    g10.add(lanternsMesh(list, { size: 0.28, sphere: true }));
  }
  void sub;
}

// ---------- 細部の かざり ----------
import * as E from '../engine.js';
export function details(ctx) {
  const [g1, , , , , , g7, g8] = ctx.stages;
  const TY = 11.2;
  // 山を ただよう きり
  const n = 40, p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const a = E.rr(0, Math.PI * 2), r = E.rr(9, 16); p[i * 3] = Math.cos(a) * r; p[i * 3 + 1] = E.rr(2, 8); p[i * 3 + 2] = Math.sin(a) * r; }
  const g = new E.THREE.BufferGeometry(); g.setAttribute('position', new E.THREE.BufferAttribute(p, 3));
  const mist = new E.THREE.Points(g, new E.THREE.PointsMaterial({ map: E.TEX.dot, size: 9, color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false }));
  g1.add(mist);
  ctx.addUpdater(0, t => { mist.rotation.y = t * 0.01; });
  // 城壁の 旗
  E.flagPole(g7, -8.2, TY + 2.7, 4.6, 'pt', { h: 1.6, w: 0.8 });
  E.flagPole(g7, 5.8, TY + 2.7, 4.6, 'pt', { h: 1.6, w: 0.8 });
  E.flagPole(g7, -8.2, TY + 2.7, -4.6, 'pt', { h: 1.6, w: 0.8 });
  // ふもとの 屋台
  E.stall(g8, 22, 23, 0.6, 0xe0a526);
  E.stall(g8, 18, 26, 0.6, 0xc23b30);
}
