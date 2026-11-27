// 「暁の砦」3D版（試作）を つくる：node tools/toride3d-build.cjs
// toride.html（tools/toride-build.cjs が つくる）に、3Dで 見せる 層（tools/toride3d-layer.js）を かさねて toride3d.html に する。
// 戦いの 計算は toride.html と 同じ。絵を かく ところだけ three.js に 入れかえる。
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
let h = fs.readFileSync(path.join(ROOT, 'toride.html'), 'utf8');
const layer = fs.readFileSync(path.join(__dirname, 'toride3d-layer.js'), 'utf8');
const rep = (a, b) => { if (!h.includes(a)) throw new Error('toride.html に 見つからない: ' + a.slice(0, 60)); h = h.replace(a, b); };

rep('<title>暁の砦</title>', '<title>暁の砦 3D（試作）</title>');
rep('<script>\nconst $=', `<script type="importmap">
{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js", "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/" } }
</script>
<script type="module">
import * as E3 from './js/diorama/engine.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const THREE = E3.THREE;
const $=`);
rep('function draw(){', 'function draw2d(){');
rep('function fit(){', 'function fit2d(){');
rep('function toCanvas(e){', 'function toCanvas2d(e){');
rep('fit();showCard();loadArt();requestAnimationFrame(loop);', '');
// 指で 動かす 向きを、カメラの 向きに 合わせる
rep('if(k[0]||k[1]){ix=k[0];iy=k[1]}', 'if(k[0]||k[1]){ix=k[0];iy=k[1]}{const r=camRot(ix,iy);ix=r[0];iy=r[1]}');
rep('scaled(s.foe,64)', 'scaled(s.foe,112)');
rep('<canvas id="cv" width="720" height="1280"></canvas>', `<canvas id="gl"></canvas><canvas id="cv"></canvas>
  <div id="camui" hidden><button type="button" data-c="l" aria-label="左に 回す">⟲</button><button type="button" data-c="r" aria-label="右に 回す">⟳</button><button type="button" data-c="in" aria-label="近づく">＋</button><button type="button" data-c="out" aria-label="はなれる">－</button></div>`);
rep('#ov{', `#stage{padding-bottom:0}
#gl,#cv{position:absolute;inset:0;width:100%;height:100%;border-radius:0}
#cv{background:none}
#camui{position:absolute;right:8px;bottom:10px;display:grid;grid-template-columns:repeat(2,48px);gap:8px}
#camui button{width:48px;height:48px;border-radius:50%;background:rgba(14,23,41,.72);color:var(--washi);font-size:22px;border:1px solid rgba(235,226,205,.5);touch-action:none}
#ov{`);
rep('スマホは 画面{がめん}を なぞる、', '指{ゆび}2本{にほん}で 回{まわ}す・つまむ（または 右下{みぎした}の ボタン）で、見{み}る 向{む}きが かわる。スマホは 画面{がめん}を なぞる、');
rep('<span class="brand">暁の砦<small>会津</small></span>', '<span class="brand">暁の砦<small>3D 試作</small></span>');
const i = h.lastIndexOf('</script>');
h = h.slice(0, i) + layer + '\n' + h.slice(i);
fs.writeFileSync(path.join(ROOT, 'toride3d.html'), h);
console.log('toride3d.html', h.length, 'bytes');
