// エディンバラ城（スコットランド）
import {
  THREE, M, V, rr, rnd, mesh, boxGeo, cylGeo, stoneBaseGeo, Batch, windowsMesh, windowSpots, roundTower, squareTower,
  gableRoof, crenelWall, merlonsRing, merlonsRect, flagPole, crag, ground, roundTree, euroHouse, person, crowd, birds,
  lampPost, lanternsMesh, ramp, sub, TEX,
} from '../engine.js';

export function build(ctx) {
  const [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10] = ctx.stages;
  ground(ctx.base, 64, 64, 0, 0);
  ctx.signAt(-4, 0, 6);
  ctx.setCamera([32, 26, 40], [-2, 9, 0]);
  ctx.setFocus(-4, 13, -1, 16);

  // 1. 火山の岩（キャッスル・ロック）
  const CY = crag(g1, { x: -5, z: -1, rTop: 8.5, rBot: 11.5, h: 9, sx: 1.45, mat: M.rockDark, top: M.grass, jitter: 0.2 });
  crag(g1, { x: 12, z: -1, rTop: 3, rBot: 7, h: 6.5, sx: 1.2, mat: M.rockDark, top: M.grass, jitter: 0.15 });

  // 2. 石の土台と広場（エスプラネード）
  const TY = CY + 0.8;
  g2.add(mesh(stoneBaseGeo(22, 12.5, 21, 11.5, 0.8, false), M.stoneGrey, -5.5, CY, -1));
  g2.add(mesh(boxGeo(21, 0.1, 11.5), M.gravel, -5.5, TY - 0.04, -1));
  g2.add(mesh(boxGeo(6, 0.5, 4.5), M.gravel, 8, CY + 0.25, -1));
  ramp(g2, V(11, CY + 0.3, -1), V(31.5, 1.0, -1), 4, M.paving, 0.6);

  // 3. 半月の砲台（ハーフムーン・バッテリー）
  {
    const g = mesh(new THREE.CylinderGeometry(3.6, 3.9, 4.2, 24, 1, false, 0, Math.PI), M.stoneGrey, 3.2, TY + 2.1, -1);
    g.rotation.y = 0;
    g3.add(g);
    g3.add(mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.12, 24, 1, false, 0, Math.PI), M.gravel, 3.2, TY + 4.2, -1));
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * Math.PI;
      const m = mesh(boxGeo(0.3, 0.38, 0.3), M.stoneGrey, 3.2 + Math.sin(a) * 3.5, TY + 4.4, -1 + Math.cos(a) * 3.5);
      m.rotation.y = a;
      g3.add(m);
    }
    void merlonsRing;
    // 崖ぞいの城壁
    const opt = { y: TY, h: 1.6, t: 0.6, wall: M.stoneGrey };
    crenelWall(g3, -15.5, -6.4, 2.5, -6.4, opt);
    crenelWall(g3, -15.5, 4.4, 1, 4.4, opt);
    crenelWall(g3, -15.8, -6.4, -15.8, 4.4, opt);
  }

  // 4. 門と城壁の建物
  {
    const wins = [];
    const s = sub(g4, 7.6, CY + 0.5, -1, Math.PI / 2);
    s.add(mesh(boxGeo(4.4, 3.4, 2), M.stoneGrey, 0, 1.7, 0));
    s.add(mesh(boxGeo(1.4, 2, 0.1), M.darkWood, 0, 1, 1.02));
    merlonsRect(s, 0, 0, 3.4, 4.4, 2, M.stoneGrey);
    for (const z of [-2.6, 0.6]) roundTower(g4, { x: 7.6, z, y: CY + 0.5, r: 0.6, h: 4.2, wall: M.stoneGrey, roof: 'cone', roofMat: M.slate, roofH: 1.3, wins, winRows: 1 });
    // 兵舎（長い建物）
    g4.add(mesh(boxGeo(10, 3.2, 2.4), M.stoneGrey, -6.5, TY + 1.6, -5));
    windowSpots(wins, -6.5, -5, 10, 2.4, TY + 1.0, 1.0); windowSpots(wins, -6.5, -5, 10, 2.4, TY + 2.3, 1.0);
    gableRoof(g4, { x: -6.5, z: -5, y: TY + 3.2, w: 10, d: 2.4, wall: M.stoneGrey, roofMat: M.slate, roofH: 1.1 });
    g4.add(windowsMesh(wins, { w: 0.28, h: 0.45 }));
  }

  // 5. お城の建物（宮殿・大広間・戦争記念館）
  {
    const wins = [];
    // 王宮（クラウン・スクエアの東）
    g5.add(mesh(boxGeo(4.2, 4.6, 5.6), M.ashlarGrey, -2.6, TY + 2.3, 0.6));
    windowSpots(wins, -2.6, 0.6, 4.2, 5.6, TY + 1.5, 1.1); windowSpots(wins, -2.6, 0.6, 4.2, 5.6, TY + 3.3, 1.1);
    // 大広間（南）
    g5.add(mesh(boxGeo(7, 3.4, 2.6), M.ashlarGrey, -9, TY + 1.7, 2.6));
    windowSpots(wins, -9, 2.6, 7, 2.6, TY + 2.0, 1.2);
    // 戦争記念館（北）
    g5.add(mesh(boxGeo(7, 3.6, 2.6), M.ashlarGrey, -9, TY + 1.8, -1.6));
    windowSpots(wins, -9, -1.6, 7, 2.6, TY + 2.0, 1.3);
    // 聖マーガレット礼拝堂（小さい）
    g5.add(mesh(boxGeo(1.6, 1.4, 1.1), M.ashlarGrey, -14, TY + 0.7, -3.4));
    g5.add(windowsMesh(wins, { arch: true, w: 0.36, h: 0.75 }));
  }

  // 6. 屋根と塔（とんがりの小塔・階段状の切妻）
  {
    gableRoof(g6, { x: -2.6, z: 0.6, y: TY + 4.6, w: 4.2, d: 5.6, ry: Math.PI / 2, wall: M.ashlarGrey, roofMat: M.slate, roofH: 1.8 });
    gableRoof(g6, { x: -9, z: 2.6, y: TY + 3.4, w: 7, d: 2.6, wall: M.ashlarGrey, roofMat: M.slate, roofH: 1.2 });
    gableRoof(g6, { x: -9, z: -1.6, y: TY + 3.6, w: 7, d: 2.6, wall: M.ashlarGrey, roofMat: M.slate, roofH: 1.2 });
    gableRoof(g6, { x: -14, z: -3.4, y: TY + 1.4, w: 1.6, d: 1.1, wall: M.ashlarGrey, roofMat: M.slate, roofH: 0.6 });
    // 王宮の時計塔
    const top = squareTower(g6, { x: -0.3, z: 3.3, y: TY, w: 1.8, h: 6.6, wall: M.ashlarGrey, roof: 'crenel' });
    roundTower(g6, { x: -0.3, z: 3.3, y: top, r: 0.55, h: 0.9, wall: M.ashlarGrey, roof: 'dome', roofMat: M.copper, roofH: 0.9 });
    g6.add(mesh(new THREE.CircleGeometry(0.45, 20), M.white, -0.3, TY + 5.4, 4.21));
    // 小塔
    for (const [x, z] of [[-4.7, 3.4], [-4.7, -2.2], [-12.5, 3.9], [-5.5, 3.9]]) roundTower(g6, { x, z, y: TY + 3, r: 0.38, h: 2.3, wall: M.ashlarGrey, roof: 'cone', roofMat: M.slate, roofH: 1.2 });
    // 階段状の切妻（スコットランド風）
    for (const x of [-12.5, -5.5]) for (let i = 0; i < 4; i++) g6.add(mesh(boxGeo(0.3, 0.3, 2.6 - i * 0.62), M.ashlarGrey, x, TY + 3.55 + i * 0.3, 2.6));
  }

  // 7. 大砲と旗
  {
    const b = new Batch();
    const guns = [];
    for (let i = 0; i < 5; i++) { const a = (-70 + i * 35) * Math.PI / 180; guns.push([3.2 + Math.cos(a) * 3.0, TY + 4.3, -1 + Math.sin(a) * 3.0, a]); }
    for (let x = -14; x <= 0; x += 2.8) guns.push([x, TY, -5.7 - 0.0, -Math.PI / 2]);
    for (const [x, y, z, a] of guns) {
      b.box('darkWood', 0.6, 0.3, 0.8, x, y + 0.15, z, -a + Math.PI / 2);
      const barrel = cylGeo(0.1, 0.14, 1.3, 10); barrel.rotateX(Math.PI / 2);
      const m = new THREE.Matrix4().compose(V(x + Math.cos(a) * 0.3, y + 0.42, z + Math.sin(a) * 0.3), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), -a + Math.PI / 2), V(1, 1, 1));
      b.add(barrel, 'iron', m);
    }
    b.build(g7);
    // モンス・メグ（大きな大砲）
    const mm = mesh(cylGeo(0.35, 0.45, 2.4, 14), M.iron, -14.5, TY + 0.9, 0.5); mm.rotation.z = Math.PI / 2 - 0.15; g7.add(mm);
    flagPole(g7, -2.6, TY + 6.4, 0.6, 'scot', { h: 2.2, w: 1.4 });
    flagPole(g7, 7.6, CY + 3.9, -1, 'uk', { h: 1.8, w: 1.0 });
    // 1時の大砲のけむり
    const puff = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(60 * 3), 3)), new THREE.PointsMaterial({ map: TEX.dot, size: 1.6, color: 0xeeeeee, transparent: true, depthWrite: false, opacity: 0 }));
    g7.add(puff);
    const pp = puff.geometry.attributes.position.array;
    const vel = Array.from({ length: 60 }, () => [rr(0.5, 2), rr(0, 1), rr(-0.8, 0.8)]);
    ctx.addUpdater(6, t => {
      const ph = t % 12;
      if (ph < 3) {
        for (let i = 0; i < 60; i++) { pp[i * 3] = -0.5 + vel[i][0] * ph; pp[i * 3 + 1] = TY + 0.5 + vel[i][1] * ph; pp[i * 3 + 2] = -6.6 + vel[i][2] * ph - ph; }
        puff.geometry.attributes.position.needsUpdate = true;
        puff.material.opacity = 0.8 * (1 - ph / 3);
      } else puff.material.opacity = 0;
    });
  }

  // 8. 古い町並み（ロイヤル・マイル）と庭園
  {
    const b = new Batch();
    for (let x = 14; x <= 30; x += 2.2) {
      const y = CY + 0.3 + ((x - 11) / (31.5 - 11)) * (1.0 - (CY + 0.3));
      euroHouse(b, x, -4.6, 0, { y: Math.max(0, y - 1.2), walls: ['houseGrey', 'houseGrey', 'houseA'], roof: 'slate', floors: 3, w: 2.0, d: 2.2 });
      euroHouse(b, x, 2.6, Math.PI, { y: Math.max(0, y - 1.2), walls: ['houseGrey', 'houseGrey', 'houseA'], roof: 'slate', floors: 3, w: 2.0, d: 2.2 });
    }
    for (let x = -28; x <= 28; x += 3.2) for (const z of [-24, -18]) roundTree(b, x + rr(-0.6, 0.6), 0, z + rr(-1, 1), rr(1, 1.3));
    for (let x = -28; x <= 28; x += 3) euroHouse(b, x, -29, 0, { walls: ['houseGrey', 'houseA'], roof: 'slate', floors: 3 });
    for (let x = -30; x <= 10; x += 3) euroHouse(b, x, 22 + rr(-1, 1), rnd() * 0.3, { walls: ['houseGrey', 'houseA', 'brick'], roof: 'slate' });
    b.build(g8);
    // 聖ジャイルズ大聖堂の王冠の塔
    const top = squareTower(g8, { x: 24, z: 6.5, y: 0, w: 2, h: 6, wall: M.houseGrey, roof: 'crenel' });
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const arc = mesh(boxGeo(0.12, 1.6, 0.12), M.houseGrey, 24 + Math.cos(a) * 0.6, top + 0.6, 6.5 + Math.sin(a) * 0.6); arc.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); g8.add(arc); }
    g8.add(mesh(new THREE.ConeGeometry(0.2, 1.3, 6), M.houseGrey, 24, top + 1.9, 6.5));
    g8.add(mesh(boxGeo(5, 3.5, 3), M.houseGrey, 24, 1.75, 9));
  }

  // 9. バグパイプと人
  {
    const piper = person(M.tartan, 'cap');
    piper.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), M.redCloth, 0.18, 0.6, 0.1));
    for (let i = 0; i < 3; i++) { const d = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 5), M.black, 0.12 + i * 0.06, 0.85, -0.05); d.rotation.z = -0.3; piper.add(d); }
    g9.add(piper);
    ctx.addWalker(8, piper, [V(9, CY + 0.5, -2.2), V(9, CY + 0.5, 0.4)], { speed: 0.02, bob: 0.03 });
    crowd(ctx, 8, [V(30, 1.1, -1), V(11, CY + 0.6, -1)], 9, { lateral: 1.2 });
    crowd(ctx, 8, [V(-4, TY, -3.6), V(2, TY, -3.6), V(2, TY, 2.4)], 4, { lateral: 0.3 });
    const guard = person(M.tartan, 'bearskin'); g9.add(guard); ctx.addWalker(8, guard, [V(9.6, CY + 0.5, -3.4), V(9.6, CY + 0.5, 1.4)], { speed: 0.025 });
    birds(ctx, 8, 7, { h: [20, 26], cx: -4 });
  }

  // 10. 街灯
  {
    const list = [];
    for (let i = 0; i <= 8; i++) { const p = V(11, CY + 0.6, -1).lerp(V(31, 1.0, -1), i / 8); lampPost(g10, list, p.x, p.y, -3); lampPost(g10, list, p.x, p.y, 1); }
    g10.add(lanternsMesh(list, { size: 0.28, sphere: true }));
  }
}

// ---------- 細部の かざり ----------
import * as E from '../engine.js';
export function details(ctx) {
  const [, , , , , , , g8, g9, g10] = ctx.stages;
  const CY = 9;
  // ロイヤル・マイルの 旗
  for (let x = 15; x <= 29; x += 3.5) {
    const y = Math.max(0, CY + 0.3 + ((x - 11) / 20.5) * (1 - (CY + 0.3)) - 1.2);
    E.flagPole(g10, x, y + 2.2, -3.4, 'scot', { h: 1.2, w: 0.7 });
  }
  // 庭園の 市場
  E.stall(g8, -12, -13.5, 0, 0xc23b30);
  E.stall(g8, -7.5, -13.5, 0, 0x2f5a3a);
  E.stall(g8, -3, -13.5, 0, 0x2f6fd8);
  // バグパイプの 楽隊
  for (let i = 0; i < 3; i++) {
    const p = E.person(E.M.tartan, 'bearskin');
    p.add(E.mesh(new E.THREE.SphereGeometry(0.14, 8, 6), E.M.redCloth, 0.18, 0.6, 0.1));
    g9.add(p);
    ctx.addWalker(8, p, [E.V(28, 1.4, -1.6 + i * 0.6), E.V(14, CY - 0.6, -1.6 + i * 0.6)], { u: i * 0.02, speed: 0.012 });
  }
}
