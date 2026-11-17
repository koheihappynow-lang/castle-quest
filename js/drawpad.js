// おえかき（こども・パパ きょうつう）：openDrawPad({ title }) → 絵の Blob（やめたら null）
const COLORS = ['#222222', '#e8322f', '#ff8a1a', '#ffd23f', '#3ddc84', '#2f7fe8', '#9b5cff', '#ff7ab6', '#8a5a2b', '#ffffff'];
const SIZES = [[6, '・'], [14, '●'], [28, '⬤']];

export function openDrawPad({ title = 'えを かこう', sendLabel = '📮 おくる' } = {}) {
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.className = 'dp-wrap';
    wrap.innerHTML = `
      <div class="dp-box">
        <div class="dp-top"><b>🎨 ${title}</b><button class="dp-x" data-dp="cancel" aria-label="やめる">✕</button></div>
        <div class="dp-canvas"><canvas width="800" height="600"></canvas></div>
        <div class="dp-tools">
          <div class="dp-colors">${COLORS.map((c, i) => `<button class="dp-col ${i === 0 ? 'on' : ''}" data-col="${c}" style="background:${c}" aria-label="いろ"></button>`).join('')}</div>
          <div class="dp-sizes">${SIZES.map(([s, l], i) => `<button class="dp-size ${i === 1 ? 'on' : ''}" data-size="${s}">${l}</button>`).join('')}
            <button class="dp-btn" data-dp="eraser">🧽 けしごむ</button><button class="dp-btn" data-dp="undo">↩️ もどす</button><button class="dp-btn" data-dp="clear">🗑️ ぜんぶ けす</button></div>
        </div>
        <div class="dp-bottom"><button class="btn ghost" data-dp="cancel">やめる</button><button class="btn primary big" data-dp="send">${sendLabel}</button></div>
      </div>`;
    document.body.appendChild(wrap);
    const cv = wrap.querySelector('canvas'), g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.lineCap = 'round'; g.lineJoin = 'round';
    let color = COLORS[0], size = SIZES[1][0], eraser = false, drawing = false, last = null, drew = false;
    const hist = [];
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
    cv.addEventListener('pointerdown', e => {
      e.preventDefault(); cv.setPointerCapture(e.pointerId);
      hist.push(g.getImageData(0, 0, cv.width, cv.height)); if (hist.length > 20) hist.shift();
      drawing = true; last = pos(e);
      g.fillStyle = eraser ? '#fff' : color; g.beginPath(); g.arc(last[0], last[1], (eraser ? size * 1.6 : size) / 2, 0, 7); g.fill(); drew = true;
    });
    cv.addEventListener('pointermove', e => {
      if (!drawing) return; e.preventDefault();
      const p = pos(e);
      g.strokeStyle = eraser ? '#fff' : color; g.lineWidth = eraser ? size * 1.6 : size;
      g.beginPath(); g.moveTo(last[0], last[1]); g.lineTo(p[0], p[1]); g.stroke(); last = p;
    });
    const end = () => { drawing = false; };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    const done = v => { wrap.remove(); resolve(v); };
    wrap.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.col) { color = t.dataset.col; eraser = false; wrap.querySelectorAll('.dp-col').forEach(b => b.classList.toggle('on', b === t)); wrap.querySelector('[data-dp=eraser]').classList.remove('on'); }
      if (t.dataset.size) { size = Number(t.dataset.size); wrap.querySelectorAll('.dp-size').forEach(b => b.classList.toggle('on', b === t)); }
      const a = t.dataset.dp;
      if (a === 'eraser') { eraser = !eraser; t.classList.toggle('on', eraser); }
      if (a === 'undo' && hist.length) g.putImageData(hist.pop(), 0, 0);
      if (a === 'clear') { hist.push(g.getImageData(0, 0, cv.width, cv.height)); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); }
      if (a === 'cancel') done(null);
      if (a === 'send') { if (!drew) { t.textContent = 'なにか かいてね'; setTimeout(() => { t.textContent = sendLabel; }, 1200); return; } cv.toBlob(b => done(b), 'image/jpeg', 0.85); }
    });
  });
}

// 絵を 大きく みる
export function showBig(url) {
  const w = document.createElement('div');
  w.className = 'dp-wrap dp-view';
  w.innerHTML = `<img src="${url}" alt=""><button class="dp-x" aria-label="とじる">✕</button>`;
  w.onclick = () => w.remove();
  document.body.appendChild(w);
}

// スタイル（1かいだけ）
if (!document.getElementById('dp-style')) {
  const st = document.createElement('style'); st.id = 'dp-style';
  st.textContent = `
  .dp-wrap { position: fixed; inset: 0; z-index: 1000; background: rgba(20,24,40,.6); display: flex; align-items: center; justify-content: center; padding: 10px; }
  .dp-box { background: #fffaf0; border-radius: 24px; padding: 12px; width: min(100%, 900px); max-height: 100%; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 10px 40px rgba(0,0,0,.4); font-family: inherit; }
  .dp-top { display: flex; align-items: center; justify-content: space-between; font-size: 1.3rem; color: #4a2b10; }
  .dp-x { border: 0; background: #eee; border-radius: 50%; width: 44px; height: 44px; font-size: 1.2rem; cursor: pointer; }
  .dp-canvas { background: #f4ecd8; border-radius: 16px; border: 3px solid #e8d6b0; overflow: hidden; touch-action: none; }
  .dp-canvas canvas { display: block; width: min(100%, calc(58vh * 4 / 3)); aspect-ratio: 4 / 3; height: auto; margin: 0 auto; touch-action: none; cursor: crosshair; }
  .dp-tools { display: flex; flex-direction: column; gap: 8px; }
  .dp-colors, .dp-sizes { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; }
  .dp-col { width: 44px; height: 44px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 0 2px #ccc; cursor: pointer; }
  .dp-col.on { box-shadow: 0 0 0 4px #2f7fe8; transform: scale(1.12); }
  .dp-size, .dp-btn { border: 2px solid #ddd; background: #fff; border-radius: 14px; min-width: 48px; height: 44px; padding: 0 10px; font-size: 1rem; font-family: inherit; cursor: pointer; }
  .dp-size.on, .dp-btn.on { border-color: #2f7fe8; background: #e6f1ff; }
  .dp-bottom { display: flex; justify-content: center; gap: 14px; }
  .dp-view { flex-direction: column; } .dp-view img { max-width: 96vw; max-height: 86vh; border-radius: 16px; background: #fff; box-shadow: 0 10px 40px rgba(0,0,0,.4); }
  .dp-view .dp-x { position: absolute; top: 16px; right: 16px; }`;
  document.head.appendChild(st);
}
