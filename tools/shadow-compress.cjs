// かげ あて の 絵（cards/shadow/*.png）を かるく する（色数を へらした PNG・すけ たまま）
// 使い方: node tools/shadow-compress.cjs   （sharp が いる：tools/hf3d で npm install）
const fs = require('fs'), path = require('path');
let sharp;
for (const p of [path.join(__dirname, 'hf3d/node_modules/sharp'), 'sharp']) { try { sharp = require(p); break; } catch (e) {} }
if (!sharp) { console.log('sharp が ありません（cd tools/hf3d && npm install）'); process.exit(1); }
const dir = path.join(__dirname, '../cards/shadow/');
(async () => {
  let a = 0, b = 0;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.png'))) {
    const buf = fs.readFileSync(dir + f); a += buf.length;
    const out = await sharp(buf).png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 }).toBuffer();
    if (out.length < buf.length) { fs.writeFileSync(dir + f, out); b += out.length; } else b += buf.length;
  }
  console.log(Math.round(a / 1024) + 'KB -> ' + Math.round(b / 1024) + 'KB');
})();
