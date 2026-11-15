// 紫禁城（中国・北京）
import {
  THREE, M, V, rr, rnd, mesh, boxGeo, cylGeo, stoneBaseGeo, triPrism, Batch, windowsMesh, roofGeo, eaveGeo, sub,
  flagPole, waterPlane, pitGround, pineTree, roundTree, crowd, birds, hill, lanternsMesh, lightString, columns,
} from '../engine.js';

// 中国式の屋根（反りが大きい）。double=二重の軒
function chineseRoof(g, { x, z, y, w, d, rise = 1.4, ov = 0.9, up = 0.55, double = false, mat = M.roofYellow, hip = true }) {
  let yy = y;
  if (double) {
    g.add(mesh(roofGeo(w + ov * 2, d + ov * 2, w - 0.4, d - 0.4, rise * 0.45, { up, sag: 0.2 }), mat, x, yy, z));
    g.add(mesh(eaveGeo(w + ov * 2, d + ov * 2, w, d, { up, drop: 0.18 }), M.vermilion, x, yy, z));
    g.add(mesh(boxGeo(w - 0.4, 0.9, d - 0.4), M.vermilion, x, yy + rise * 0.45 + 0.4, z));
    yy += rise * 0.45 + 0.8;
    w -= 0.4; d -= 0.4;
  }
  const ridge = hip ? Math.max(0.3, w - d * 0.7) : 0.2;
  g.add(mesh(roofGeo(w + ov * 2, d + ov * 2, ridge, 0.16, rise, { up, sag: 0.22 }), mat, x, yy, z));
  g.add(mesh(eaveGeo(w + ov * 2, d + ov * 2, w, d, { up, drop: 0.18 }), M.vermilion, x, yy, z));
  g.add(mesh(boxGeo(ridge + 0.4, 0.25, 0.3), mat, x, yy + rise, z));
  for (const s of [-1, 1]) g.add(mesh(boxGeo(0.25, 0.45, 0.3), mat, x + s * (ridge / 2 + 0.2), yy + rise + 0.2, z));
  return yy + rise;
}
// 宮殿（赤い柱と壁）
function hall(g, wins, { x, z, y, w, d, h, double = false, rise = 1.4, ov = 0.9 }) {
  g.add(mesh(boxGeo(w - 0.6, h, d - 0.6), M.vermilion, x, y + h / 2, z));
  const pts = [];
  const nx = Math.max(2, Math.round(w / 1.1));
  for (let i = 0; i <= nx; i++) { const px = x - w / 2 + (i * w) / nx; pts.push([px, z + d / 2 - 0.1], [px, z - d / 2 + 0.1]); }
  columns(g, pts, { h, r: 0.14, y, mat: M.vermilion, capital: false });
  g.add(mesh(boxGeo(w, 0.35, d), M.copper, x, y + h - 0.17, z));
  for (let i = 0; i < nx; i++) wins.push([x - w / 2 + (i + 0.5) * (w / nx), y + h * 0.45, z + d / 2 - 0.28, 0]);
  return { top: y + h, w, d, double, rise, ov };
}

export function build(ctx) {
  const [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10] = ctx.stages;
  const HW = 14, HD = 19;
  pitGround(ctx.base, HW + 2.6, HD + 2.6);
  ctx.signAt(0, -1, 0);
  ctx.setCamera([32, 28, 42], [0, 4, 0]);
  ctx.setFocus(0, 7, -1, 16);

  // 1. 堀と広場
  g1.add(mesh(boxGeo(HW * 2, 2.2, HD * 2), [M.stone, M.stone, M.paving, M.paving, M.stone, M.stone], 0, 0.1, 0));
  waterPlane(g1, (HW + 2.6) * 2, (HD + 2.6) * 2, 0, 0, -0.45);
  const GY = 1.2;

  // 2. 白い台（大理石の三段の基壇）
  const T = { x: 0, z: -2.5 };
  let ty = GY;
  for (let i = 0; i < 3; i++) {
    const w = 15 - i * 1.4, d = 10 - i * 1.2;
    g2.add(mesh(stoneBaseGeo(w, d, w - 0.3, d - 0.3, 0.7, false), M.marble, T.x, ty, T.z));
    for (let k = 0; k < Math.floor(w / 0.6); k++) for (const s of [-1, 1]) g2.add(mesh(boxGeo(0.1, 0.35, 0.1), M.marble, T.x - w / 2 + 0.3 + k * 0.6, ty + 0.85, T.z + s * (d / 2 - 0.2)));
    ty += 0.7;
  }
  g2.add(mesh(boxGeo(2.4, 0.1, 7), M.marble, T.x, GY + 1.0, T.z + 7.5).rotateX(-0.25));
  for (const [z, w, d] of [[-10.5, 6, 4], [-15, 9, 4.5]]) g2.add(mesh(stoneBaseGeo(w, d, w - 0.3, d - 0.3, 1.0, false), M.marble, 0, GY, z));
  const TT = ty;

  // 3. 赤い壁と門
  const wins = [];
  {
    const b = new Batch();
    const H = 3.2, t = 1.0;
    for (const [x, z, w, d] of [[0, -HD + t / 2, HW * 2, t], [-HW + t / 2, 0, t, HD * 2], [HW - t / 2, 0, t, HD * 2], [-8.5, HD - t / 2, 11, t], [8.5, HD - t / 2, 11, t]]) {
      b.box('vermilion', w, H, d, x, GY + H / 2, z);
      b.box('roofYellow', w + 0.4, 0.3, d + 0.5, x, GY + H + 0.15, z);
    }
    b.build(g3);
    // 午門（南の大きな門）
    const gz = HD - 0.5;
    g3.add(mesh(boxGeo(8, 4.2, 3), M.vermilion, 0, GY + 2.1, gz));
    for (const s of [-1, 1]) g3.add(mesh(boxGeo(1.4, 2.0, 0.1), M.darkWood, s * 2, GY + 1.0, gz + 1.52));
    g3.add(mesh(boxGeo(1.6, 2.4, 0.1), M.darkWood, 0, GY + 1.2, gz + 1.52));
    for (const s of [-1, 1]) g3.add(mesh(boxGeo(2.2, 4.2, 6), M.vermilion, s * 5.1, GY + 2.1, gz + 2.5));
    const top = hall(g3, wins, { x: 0, z: gz, y: GY + 4.2, w: 7, d: 2.6, h: 1.6 });
    chineseRoof(g3, { x: 0, z: gz, y: top.top, w: 7, d: 2.6, double: true, rise: 1.3, ov: 0.6 });
    for (const s of [-1, 1]) { const p = hall(g3, wins, { x: s * 5.1, z: gz + 4.6, y: GY + 4.2, w: 2.2, d: 2.2, h: 1.2 }); chineseRoof(g3, { x: s * 5.1, z: gz + 4.6, y: p.top, w: 2.2, d: 2.2, rise: 1.0, ov: 0.5, hip: false }); }
    // 太和門（中の門）
    const tm = hall(g3, wins, { x: 0, z: 7.5, y: GY, w: 8, d: 3, h: 2.2 });
    chineseRoof(g3, { x: 0, z: 7.5, y: tm.top, w: 8, d: 3, rise: 1.2, ov: 0.7 });
    // 北の門（神武門）
    const nm = hall(g3, wins, { x: 0, z: -HD + 0.5, y: GY + 3.2, w: 6, d: 2.2, h: 1.4 });
    chineseRoof(g3, { x: 0, z: -HD + 0.5, y: nm.top, w: 6, d: 2.2, rise: 1.0, ov: 0.6, double: true });
  }

  // 4. 角の櫓（すみやぐら）
  for (const [x, z] of [[-HW + 0.6, -HD + 0.6], [HW - 0.6, -HD + 0.6], [-HW + 0.6, HD - 0.6], [HW - 0.6, HD - 0.6]]) {
    const y = GY + 3.2;
    g4.add(mesh(boxGeo(2.4, 1.4, 2.4), M.vermilion, x, y + 0.7, z));
    chineseRoof(g4, { x, z, y: y + 1.4, w: 2.4, d: 2.4, rise: 1.0, ov: 0.55, hip: false });
    for (const ry of [0, Math.PI / 2]) {
      const gp = triPrism(1.6, 0.9, 3.6); gp.translate(0, 0, 1.8);
      const m = mesh(gp, M.roofYellow, x, y + 1.6, z); m.rotation.y = ry; g4.add(m);
    }
  }

  // 5. 太和殿の壁と柱 ／ 6. 黄色い屋根
  const main = hall(g5, wins, { x: T.x, z: T.z, y: TT, w: 11, d: 5.6, h: 3.0 });
  const mid = hall(g5, wins, { x: 0, z: -10.5, y: GY + 1.0, w: 3.6, d: 3.6, h: 2.0 });
  const back = hall(g5, wins, { x: 0, z: -15, y: GY + 1.0, w: 7.6, d: 3.6, h: 2.4 });
  for (const s of [-1, 1]) {
    const side = hall(g5, wins, { x: s * 9.6, z: 2, y: GY, w: 2.4, d: 7, h: 1.8 });
    chineseRoof(g6, { x: s * 9.6, z: 2, y: side.top, w: 2.4, d: 7, rise: 0.9, ov: 0.5 });
  }
  g5.add(windowsMesh(wins, { w: 0.5, h: 1.1, mat: M.window }));
  chineseRoof(g6, { x: T.x, z: T.z, y: main.top, w: 11, d: 5.6, double: true, rise: 2.0, ov: 1.0 });
  chineseRoof(g6, { x: 0, z: -10.5, y: mid.top, w: 3.6, d: 3.6, rise: 1.4, ov: 0.6, hip: false });
  chineseRoof(g6, { x: 0, z: -15, y: back.top, w: 7.6, d: 3.6, double: true, rise: 1.4, ov: 0.8 });

  // 7. ライオン・ちょうちん・金水河と橋
  {
    for (const s of [-1, 1]) {
      const l = new THREE.Group();
      l.add(mesh(boxGeo(0.8, 0.6, 0.8), M.marble, 0, 0.3, 0));
      l.add(mesh(boxGeo(0.55, 0.6, 0.7), M.bronze, 0, 0.9, 0));
      l.add(mesh(new THREE.SphereGeometry(0.3, 10, 8), M.bronze, 0, 1.4, 0.15));
      l.position.set(s * 3.2, GY, 9.6);
      g7.add(l);
    }
    for (const s of [-1, 1]) { g7.add(mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.6, 3), M.bronze, s * 5, TT, T.z + 3.2)); }
    // 金水河
    const river = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const x0 = -11 + i * 2, x1 = x0 + 2;
      const zf = x => 11.5 + Math.cos(x * 0.18) * 1.2;
      const seg = mesh(new THREE.PlaneGeometry(2.05, 1.4).rotateX(-Math.PI / 2), M.water, (x0 + x1) / 2, GY + 0.05, zf((x0 + x1) / 2));
      seg.rotation.y = -Math.atan2(zf(x1) - zf(x0), 2); seg.castShadow = false;
      river.add(seg);
    }
    g7.add(river);
    for (const x of [-3, -1.5, 0, 1.5, 3]) g7.add(mesh(boxGeo(1.1, 0.3, 2.2), M.marble, x, GY + 0.2, 11.5 + Math.cos(x * 0.18) * 1.2));
    const list = [];
    for (const x of [-6, -4, 4, 6]) list.push([x, GY + 2.6, 8.7]);
    g7.add(lanternsMesh(list, { size: 0.45, sphere: true, mat: M.chochin }));
    for (const s of [-1, 1]) g7.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6), M.iron, s * 5, GY + 1.3, 8.7));
    flagPole(g7, 0, GY + 0.0, 16, 'cn', { h: 4, w: 1.5 });
  }

  // 8. 景山と緑・胡同（まち）
  {
    const b = new Batch();
    const hz = -26.8, hr = 4.8;
    const hl = hill(g8, 0, hz, hr, 0.7, M.mountain);
    hl.scale.x = 2.4;
    const py = hr * 0.7;
    g8.add(mesh(boxGeo(2, 1.4, 2), M.vermilion, 0, py + 0.5, hz));
    chineseRoof(g8, { x: 0, z: hz, y: py + 1.2, w: 2, d: 2, rise: 1.2, ov: 0.6, hip: false, double: true });
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; pineTree(b, Math.cos(a) * 7.5, py * 0.45, hz + Math.sin(a) * 2.6, 0.75); }
    // 御花園（北の庭）
    for (const [x, z] of [[-6, -16.5], [6, -16.5], [-9, -12], [9, -12], [-10, -16], [10, -16]]) pineTree(b, x, GY, z, 0.8);
    // 胡同（灰色の家）
    for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) {
      const x = sx * (20.5 + j * 5.5), z = -24 + i * 9;
      for (const [dx, dz, w, d] of [[0, -1.6, 4, 1.6], [0, 1.6, 4, 1.6], [-1.6, 0, 1.2, 1.8], [1.6, 0, 1.2, 1.8]]) {
        b.box('houseGrey', w, 1.4, d, x + dx, 0.7, z + dz);
        const r = roofGeo(w + 0.4, d + 0.4, Math.max(0.2, w - d), 0.12, 0.6, { up: 0.12, sag: 0.1, seg: 3, rings: 2 });
        b.geo('roof', r, x + dx, 1.38, z + dz);
      }
      roundTree(b, x, 0, z, 0.7);
    }
    b.build(g8);
  }

  // 9. 人
  {
    crowd(ctx, 8, [V(0, GY, 17), V(0, GY, 9), V(0, GY + 1.9, 2)], 8, { lateral: 1.5 });
    crowd(ctx, 8, [V(-7, GY, 6), V(7, GY, 6)], 6, { lateral: 0.8 });
    crowd(ctx, 8, [V(-31, 0, 22), V(-18, 0, 22), V(-18, 0, -26)], 4);
    birds(ctx, 8, 8, { h: [16, 22] });
  }

  // 10. ちょうちんの列
  {
    lightString(g10, [V(-HW + 1, GY + 3.9, HD - 1.2), V(-5, GY + 3.9, HD - 1.2)], { step: 1.2, size: 0.38 });
    lightString(g10, [V(5, GY + 3.9, HD - 1.2), V(HW - 1, GY + 3.9, HD - 1.2)], { step: 1.2, size: 0.38 });
    lightString(g10, [V(-6, GY + 2.8, 5), V(6, GY + 2.8, 5)], { step: 1.2, size: 0.38 });
  }
  void rr; void rnd; void cylGeo; void sub;
}

// ---------- 細部の かざり ----------
import * as E from '../engine.js';
export function details(ctx) {
  const [, , , , , g6, g7] = ctx.stages;
  // 屋根の すみの かざり（走獣）
  E.roofGuardians(g6, 0, -2.5, 6.3, 13, 7.6, 0.9, 0.55, 5);
  E.roofGuardians(g6, 0, -15, 4.6, 9.2, 5.2, 0.6, 0.55, 3);
  // 空の たこ
  E.kites(ctx, 8, [[-12, 21, -22, 0xd83b2f], [10, 22, -24, 0xffd23f], [2, 24, -28, 0x2f6fd8]]);
  // 青銅の 香炉と 鶴
  for (const s of [-1, 1]) {
    g7.add(E.mesh(new E.THREE.CylinderGeometry(0.35, 0.28, 0.5, 8), E.M.bronze, s * 3.5, 3.55, 1.6));
    g7.add(E.mesh(new E.THREE.ConeGeometry(0.3, 0.4, 8), E.M.bronze, s * 3.5, 4.0, 1.6));
    const crane = new E.THREE.Group();
    crane.add(E.mesh(new E.THREE.SphereGeometry(0.2, 8, 6), E.M.bronze, 0, 0.55, 0));
    const nk = E.mesh(new E.THREE.CylinderGeometry(0.03, 0.04, 0.6, 6), E.M.bronze, 0, 0.95, 0.08); nk.rotation.x = 0.2; crane.add(nk);
    crane.add(E.mesh(new E.THREE.CylinderGeometry(0.025, 0.025, 0.4, 5), E.M.bronze, 0, 0.2, 0));
    crane.position.set(s * 5.2, 3.3, 1.2);
    g7.add(crane);
  }
}
