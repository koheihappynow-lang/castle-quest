// EndoGame おてがみ サーバー（Cloudflare Worker ＋ KV）
// こどもの iPad と パパの スマホの あいだで おてがみを あずかる。
// せってい：KV バインディング LETTERS、ひみつの へんすう FAMILY_KEY、ALLOW_ORIGINS（カンマくぎり）
//   GET  /api/msgs?since=ミリ秒   … それ いこうに かわった おてがみ（こえ ぬき）
//   POST /api/msgs {msg, audio?}  … おてがみを ついか／こうしん（audio は data:URL）
//   GET  /api/audio/:id           … こえ（data:URL）
const KEEP_DAYS = 180, MAX_AUDIO = 3_000_000, MAX_INDEX = 1000;
const THREADS = ['santa', 'papa'], FROMS = ['kid', 'papa', 'santa'];

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get('Origin') || '';
    const allowed = (env.ALLOW_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : (allowed[0] || ''),
      'Access-Control-Allow-Headers': 'Content-Type, X-Family-Key',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    };
    const J = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (!url.pathname.startsWith('/api/')) return J({ ok: true, name: 'endogame-letters' });
    if (!env.FAMILY_KEY || !same(req.headers.get('X-Family-Key') || '', env.FAMILY_KEY)) return J({ error: 'unauthorized' }, 401);

    const readIndex = async () => JSON.parse((await env.LETTERS.get('index')) || '[]');

    if (req.method === 'GET' && url.pathname === '/api/msgs') {
      const since = Number(url.searchParams.get('since') || 0);
      const idx = await readIndex();
      return J({ now: Date.now(), msgs: idx.filter(m => (m.u || 0) > since) });
    }
    if (req.method === 'GET' && url.pathname.startsWith('/api/audio/')) {
      const id = decodeURIComponent(url.pathname.slice('/api/audio/'.length));
      const a = await env.LETTERS.get('a:' + id);
      return a ? J({ audio: a }) : J({ error: 'not found' }, 404);
    }
    if (req.method === 'POST' && url.pathname === '/api/msgs') {
      let body; try { body = await req.json(); } catch (e) { return J({ error: 'bad json' }, 400); }
      const m = body?.msg;
      if (!m || typeof m.id !== 'string' || m.id.length > 40 || !THREADS.includes(m.thread) || !FROMS.includes(m.from)) return J({ error: 'bad msg' }, 400);
      const now = Date.now();
      const clean = {
        id: m.id, kidId: String(m.kidId || '').slice(0, 40), kidName: String(m.kidName || '').slice(0, 20),
        thread: m.thread, from: m.from, text: String(m.text || '').slice(0, 500),
        hasAudio: !!m.hasAudio, mime: String(m.mime || '').slice(0, 40), ts: Number(m.ts) || now, heard: !!m.heard, u: now,
      };
      if (body.audio) {
        if (typeof body.audio !== 'string' || !body.audio.startsWith('data:audio/') || body.audio.length > MAX_AUDIO) return J({ error: 'bad audio' }, 400);
        await env.LETTERS.put('a:' + clean.id, body.audio, { expirationTtl: KEEP_DAYS * 86400 });
      }
      const idx = await readIndex();
      const i = idx.findIndex(x => x.id === clean.id);
      if (i >= 0) { const old = idx[i]; idx[i] = { ...old, heard: old.heard || clean.heard, text: clean.text || old.text, hasAudio: old.hasAudio || clean.hasAudio, u: now }; }
      else idx.push(clean);
      idx.sort((a, b) => a.ts - b.ts);
      const cut = Date.now() - KEEP_DAYS * 86400000;
      const kept = idx.filter(x => x.ts > cut).slice(-MAX_INDEX);
      await env.LETTERS.put('index', JSON.stringify(kept));
      return J({ ok: true, u: now });
    }
    return J({ error: 'not found' }, 404);
  },
};
// かぎを くらべる（じかんで ばれないように）
function same(a, b) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
