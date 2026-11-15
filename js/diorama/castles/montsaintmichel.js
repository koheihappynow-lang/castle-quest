// モン・サン＝ミシェル（フランス）
import {
  THREE, M, V, rr, rnd, mesh, boxGeo, Batch, windowsMesh, roundTower, squareTower, gableRoof, crenelWall,
  flagPole, crag, waterPlane, ground, roundTree, euroHouse, sheep, crowd, birds, lampPost, lanternsMesh, person,
} from '../engine.js';

export function build(ctx) {
  const [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10] = ctx.stages;
  // ひがた（砂）と、南の陸地
  ctx.base.add(mesh(boxGeo(64, 1, 64), [M.sand, M.sand, M.sand, M.sand, M.sand, M.sand], 0, -0.5, 0));
  ground(ctx.base, 64, 11, 0, 26.5, M.grass, 0.6, 1.6);
  ctx.signAt(0, 0, 0);
  ctx.setCamera([24, 20, 34], [0, 9, 0]);
  ctx.setFocus(0, 14, -1, 16);

  // 1. 砂浜と海（潮が満ちたり引いたりする）
  const sea = waterPlane(g1, 64, 64, 0, 0, 0);
  ctx.addUpdater(0, t => { sea.position.y = -0.45 + 0.9 * (0.5 + 0.5 * Math.sin(t * 0.18)); });
  // 道（堤防）
  g1.add(mesh(boxGeo(2.4, 1.2, 12.5), M.stoneGrey, 0, 0.5, 15.5));
  g1.add(mesh(boxGeo(2.4, 0.06, 12.5), M.gravel, 0, 1.12, 15.5));

  // 2. 岩の島
  const LY = crag(g2, { x: 0, z: -1, rTop: 8, rBot: 10.2, h: 3.4, mat: M.rock, top: M.grass, jitter: 0.12 });
  const SY = crag(g2, { x: 0.5, z: -2.2, y: LY, rTop: 3.4, rBot: 6.6, h: 6.8, mat: M.rock, top: M.grass, jitter: 0.14 });

  // 3. 城壁（島の南がわ）
  {
    const R = 10.6, cx = 0, cz = -1;
    const pts = [];
    for (let a = -15; a <= 195; a += 21) { const r = (a * Math.PI) / 180; pts.push([cx + Math.cos(r) * R, cz + Math.sin(r) * R]); }
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, z1] = pts[i], [x2, z2] = pts[i + 1];
      if (Math.abs((x1 + x2) / 2) < 1.6 && (z1 + z2) / 2 > 0) continue; // 門
      crenelWall(g3, x1, z1, x2, z2, { y: 0, h: 2.6, t: 0.8, wall: M.stoneGrey });
    }
    const wins = [];
    for (const [x, z] of pts.filter((_, i) => i % 2 === 0)) roundTower(g3, { x, z, y: 0, r: 1.0, h: 3.2, wall: M.stoneGrey, roof: 'crenel', wins, winRows: 1 });
    squareTower(g3, { x: 0, z: 9.6, y: 0, w: 2.8, d: 1.6, h: 3.6, wall: M.stoneGrey, roof: 'crenel', wins });
    g3.add(mesh(boxGeo(1.4, 1.8, 0.1), M.darkWood, 0, 0.9, 10.45));
    g3.add(windowsMesh(wins));
  }

  // 4. 坂道の家（グランド・リュ）
  {
    const b = new Batch();
    const cx = 0.5, cz = -2.2;
    for (let i = 0; i < 16; i++) {
      const a = (-10 + i * 13) * Math.PI / 180;
      const r = 6.8 + (i % 2) * 0.4;
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      euroHouse(b, x, z, -a - Math.PI / 2, { y: LY, walls: ['houseGrey', 'houseA', 'houseGrey'], roof: 'slate', floors: 2, w: 1.7, d: 1.6 });
    }
    b.build(g4);
  }

  // 5. 修道院の壁（ラ・メルヴェイユ）
  const TY = SY;
  {
    const wins = [];
    g5.add(mesh(boxGeo(8.5, 8.6, 3), M.stoneGrey, 0.5, LY + 4.3, -6.8));
    for (let i = 0; i < 7; i++) for (let row = 0; row < 4; row++) wins.push([0.5 - 3.6 + i * 1.2, LY + 1.4 + row * 1.9, -6.8 - 1.52, 0]);
    for (let i = 0; i < 9; i++) g5.add(mesh(boxGeo(0.35, 8.6, 0.4), M.stoneGrey, 0.5 - 4.2 + i * 1.05, LY + 4.3, -8.4));
    g5.add(mesh(boxGeo(7.5, 3.2, 2.8), M.stoneGrey, 0.5, TY + 1.6, -2.2));
    g5.add(mesh(boxGeo(2.6, 3.2, 5), M.stoneGrey, 1.3, TY + 1.6, -2.2));
    g5.add(mesh(boxGeo(4, 2.4, 3), M.stoneGrey, -2.5, TY + 1.2, 1.2));
    for (let i = 0; i < 6; i++) wins.push([0.5 - 3 + i * 1.2, TY + 1.8, -2.2 + 1.42, 0], [0.5 - 3 + i * 1.2, TY + 1.8, -2.2 - 1.42, 0]);
    g5.add(windowsMesh(wins, { arch: true, w: 0.35, h: 0.8 }));
  }

  // 6. 屋根と塔（とがった尖塔）
  {
    gableRoof(g6, { x: 0.5, z: -2.2, y: TY + 3.2, w: 7.5, d: 2.8, wall: M.stoneGrey, roofMat: M.slate, roofH: 1.6 });
    gableRoof(g6, { x: 1.3, z: -2.2, y: TY + 3.2, w: 2.6, d: 5, ry: Math.PI / 2, wall: M.stoneGrey, roofMat: M.slate, roofH: 1.6 }).valueOf();
    gableRoof(g6, { x: 0.5, z: -6.8, y: LY + 8.6, w: 8.5, d: 3, wall: M.stoneGrey, roofMat: M.slate, roofH: 1.4 });
    gableRoof(g6, { x: -2.5, z: 1.2, y: TY + 2.4, w: 4, d: 3, wall: M.stoneGrey, roofMat: M.slate, roofH: 1.3 });
    const top = squareTower(g6, { x: 1.3, z: -2.2, y: TY + 3.2, w: 2.0, h: 3.4, wall: M.stoneGrey, roof: 'flat' });
    g6.add(mesh(new THREE.CylinderGeometry(0.75, 1.0, 1.6, 8), M.stoneGrey, 1.3, top + 0.8, -2.2));
    const sp = new THREE.ConeGeometry(0.85, 9, 8);
    g6.add(mesh(sp, M.slate, 1.3, top + 1.6 + 4.5, -2.2));
    for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) g6.add(mesh(new THREE.ConeGeometry(0.18, 1.4, 6), M.stoneGrey, 1.3 + dx, top + 0.7, -2.2 + dz));
    ctx.spireTop = top + 1.6 + 9;
  }

  // 7. 金の天使（聖ミカエル）
  {
    const y = ctx.spireTop;
    const a = new THREE.Group();
    a.add(mesh(new THREE.ConeGeometry(0.22, 0.75, 8), M.gold, 0, 0.37, 0));
    a.add(mesh(new THREE.SphereGeometry(0.12, 8, 6), M.gold, 0, 0.85, 0));
    for (const s of [-1, 1]) { const w = mesh(boxGeo(0.5, 0.5, 0.04), M.gold, s * 0.22, 0.6, -0.08); w.rotation.z = s * 0.5; a.add(w); }
    const sword = mesh(boxGeo(0.04, 0.8, 0.04), M.gold, 0.25, 1.0, 0.05); sword.rotation.z = -0.3; a.add(sword);
    a.position.set(1.3, y, -2.2);
    g7.add(a);
    ctx.addUpdater(6, t => { a.rotation.y = Math.sin(t * 0.3) * 0.2; });
    flagPole(g7, 0, 3.6, 9.6, 'fr', { h: 1.8, w: 1.0 });
    flagPole(g7, -10, 3.2, -2, 'fr', { h: 1.6, w: 0.9 });
  }

  // 8. 陸の畑と木
  {
    const b = new Batch();
    const shades = ['leafB', 'grass', 'leaf'];
    for (let i = 0; i < 9; i++) {
      const x = -28 + i * 7;
      if (Math.abs(x) < 3) continue;
      b.box(shades[i % 3], 6.4, 0.05, 8.6, x, 0.63, 27);
      b.box('leafDark', 6.4, 0.5, 0.35, x, 0.85, 22.7);
    }
    for (const [x, z] of [[-26, 30], [-15, 24], [-6, 29], [8, 30], [17, 24], [27, 29], [22, 31]]) roundTree(b, x, 0.6, z, rr(0.9, 1.2));
    for (const [x, z] of [[-20, 29], [13, 28], [-11, 30]]) euroHouse(b, x, z, rnd() * 3, { y: 0.6, walls: ['houseGrey', 'houseA'], roof: 'slate', floors: 1 });
    // 島の木
    for (const [x, z] of [[-4, -5], [4.5, -5.5], [-5, 1], [5, 1.5]]) roundTree(b, x, LY, z, 0.8);
    b.build(g8);
  }

  // 9. 人とひつじ
  {
    crowd(ctx, 8, [V(0, 1.15, 21.5), V(0, 1.15, 9.8)], 8, { lateral: 0.6 });
    crowd(ctx, 8, [V(-5, LY, 3.6), V(-1, LY, 4.8), V(4, LY, 4), V(6, LY, 0)], 4, { lateral: 0.2 });
    for (let i = 0; i < 9; i++) {
      const s = sheep();
      g9.add(s);
      const x0 = rr(-26, 24), z0 = rr(23, 30);
      ctx.addWalker(8, s, [V(x0, 0.62, z0), V(x0 + rr(2, 4), 0.62, z0 + rr(-1, 1))], { speed: rr(0.01, 0.02), bob: 0.02 });
    }
    const monk = person(M.clothes[7], 'none');
    g9.add(monk);
    ctx.addWalker(8, monk, [V(-2.5, SY, 0), V(3, SY, 0)], { speed: 0.02 });
    birds(ctx, 8, 7, { h: [14, 22] });
  }

  // 10. 灯り
  {
    const list = [];
    for (let z = 10.5; z <= 21; z += 2.6) { lampPost(g10, list, -1.3, 1.15, z); lampPost(g10, list, 1.3, 1.15, z); }
    g10.add(lanternsMesh(list, { size: 0.28, sphere: true }));
  }
}

// ---------- 細部の かざり ----------
import * as E from '../engine.js';
export function details(ctx) {
  const [, , , , , , , g8, , g10] = ctx.stages;
  // 堤防の 旗
  E.bannerRow(g10, E.V(-1.35, 1.15, 11.5), E.V(-1.35, 1.15, 20.5), 4, 'fr', { h: 2.2, w: 0.8 });
  E.bannerRow(g10, E.V(1.35, 1.15, 11.5), E.V(1.35, 1.15, 20.5), 4, 'fr', { h: 2.2, w: 0.8 });
  // 陸がわの 屋台
  E.stall(g8, -4.5, 24.5, 0, 0x2f6fd8, 0.6);
  E.stall(g8, 4.5, 24.5, 0, 0xd94a3a, 0.6);
  E.stall(g8, -8.5, 25.5, 0.2, 0xf2b632, 0.6);
}
