// 公開の まえに かならず うごかす：node tools/release.cjs
// 1. 画像・3Dモデル・写真の「中身の指紋（ハッシュ）」を asset-hashes.js に かく
//    → 同じ 名前の 絵を さしかえても、iPad が 自動で とりなおす
// 2. 版の 番号を 1つ あげる（sw.js と js/version.js）→ iPad が 新しい 版に 入れかわる
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const DIRS = ['bg', 'cards', 'icons', 'models', 'photos'];
const hashes = {};
const walk = d => { for (const f of fs.readdirSync(path.join(ROOT, d))) { const p = d + '/' + f; const st = fs.statSync(path.join(ROOT, p)); if (st.isDirectory()) walk(p); else if (/\.(jpe?g|png|webp|glb|svg)$/i.test(f)) hashes[p] = crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT, p))).digest('hex').slice(0, 10); } };
DIRS.forEach(d => fs.existsSync(path.join(ROOT, d)) && walk(d));
fs.writeFileSync(path.join(ROOT, 'asset-hashes.js'), '// 自動で つくる ファイル（tools/release.cjs）。画像の 中身の 指紋\nself.ASSET_HASH = ' + JSON.stringify(hashes) + ';\n');
const swPath = path.join(ROOT, 'sw.js');
let sw = fs.readFileSync(swPath, 'utf8');
const n = Number(sw.match(/const VERSION = 'cq-v(\d+)';/)[1]) + (process.argv.includes('--no-bump') ? 0 : 1);
sw = sw.replace(/const VERSION = 'cq-v\d+';/, `const VERSION = 'cq-v${n}';`);
fs.writeFileSync(swPath, sw);
fs.writeFileSync(path.join(ROOT, 'js/version.js'), `// 自動で つくる ファイル（tools/release.cjs）\nexport const APP_VERSION = 'cq-v${n}';\n`);
console.log(`cq-v${n}  assets ${Object.keys(hashes).length}`);
