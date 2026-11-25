// 「暁の砦」を EndoGame に 入れる：node tools/toride-build.cjs <元の フォルダ>
// 元の フォルダ＝ index.html と img/ が ある 場所（Claude の アーティファクトと 同じ もの）
// ・toride.html を つくる（もどる ボタン、時間の きまり、こどもごとの セーブを 足す）
// ・絵を cards/toride-*.jpg|png に コピーする（release.cjs が 指紋を つける）
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = process.argv[2];
if (!SRC || !fs.existsSync(path.join(SRC, 'index.html'))) { console.error('使い方: node tools/toride-build.cjs <index.html と img/ の ある フォルダ>'); process.exit(1); }
let h = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
const need = (a) => { if (!h.includes(a)) throw new Error('元の ファイルに 見つからない: ' + a); };
const rep = (a, b) => { need(a); h = h.split(a).join(b); };

// 絵の 場所
const used = new Set();
h = h.replace(/img\/(?=[a-z'])/g, 'cards/toride-');
for (const f of fs.readdirSync(path.join(SRC, 'img'))) {
  if (f === 'map.jpg' || !/\.(jpg|png)$/.test(f)) continue;   // map.jpg は もう 使って いない
  fs.copyFileSync(path.join(SRC, 'img', f), path.join(ROOT, 'cards', 'toride-' + f)); used.add(f);
}
// こどもごとに セーブを 分ける
rep("const SAVE='akatsuki-save-v3';", "const SAVE='akatsuki-save-v3'+(()=>{try{const d=JSON.parse(localStorage.getItem('castleQuest.v1'));return d&&d.activeId?':'+d.activeId:''}catch(e){return''}})();");
// もどる ボタン
rep('<header id="hud">', '<header id="hud">\n  <a class="back" href="./#games" aria-label="EndoGame に もどる">⬅ もどる</a>');
rep('.brand{', '.back{display:inline-flex;align-items:center;min-height:36px;padding:0 12px;border-radius:999px;background:var(--ai-lift);color:var(--washi);font-weight:700;font-size:14px;text-decoration:none;white-space:nowrap}\n.brand{');
rep('.brand{font-family:var(--brush);font-size:20px;letter-spacing:.08em;margin-right:auto}', '.brand{font-family:var(--brush);font-size:20px;letter-spacing:.08em;margin-right:auto}\n[hidden]{display:none!important}');

// 時間の きまり（ぶーぶーラリーと 同じ もの）
const rally = fs.readFileSync(path.join(ROOT, 'rally.html'), 'utf8');
const a = rally.indexOf('/* ================= EndoGame の 時間の きまり'), b = rally.indexOf('/* ================= loop');
if (a < 0 || b < 0) throw new Error('rally.html に 時間の きまりが 見つからない');
rep('</script>', '\n' + rally.slice(a, b).trim() + '\n</script>');

const cut = h.indexOf('</style>') + 8;
let head = h.slice(0, cut).replace(/<meta name="claude:[^>]*>\n?/g, '');
const out = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#0e1729">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png?v=2">
<style>:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;-webkit-user-select:none;user-select:none;touch-action:manipulation}</style>
${head}
</head>
<body>
${h.slice(cut).trim()}
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'toride.html'), out);
console.log('toride.html', out.length, 'bytes / 絵', [...used].join(' '));
