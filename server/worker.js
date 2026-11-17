// EndoGame おてがみ サーバー（Cloudflare Worker ＋ D1（一覧）＋ KV（声・絵・つなぐ ばんごう））
// こどもの iPad と パパの スマホの あいだで おてがみを あずかる。
// せってい：D1 バインディング DB、KV バインディング LETTERS、ひみつの へんすう FAMILY_KEY、ALLOW_ORIGINS（カンマくぎり）
//   GET  /api/msgs?since=ミリ秒   … それ いこうに かわった おてがみ（こえ ぬき）
//   POST /api/msgs {msg, audio?}  … おてがみを ついか／こうしん（audio は data:URL）
//   GET  /api/audio/:id           … こえ（data:URL）
//   GET  /api/image/:id           … 絵（data:URL）
const KEEP_DAYS = 180, MAX_AUDIO = 3_000_000, MAX_IMAGE = 2_000_000;
const THREADS = ['santa', 'papa', 'mama'], FROMS = ['kid', 'papa', 'santa', 'mama'];

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
    // つなぐ ばんごう（6けた）で かぎを もらう：かぎ なしで よべる。10ぷんで きえる・1かい つかうと きえる・まちがいは 1じかん 20かいまで
    if (req.method === 'POST' && url.pathname === '/api/pair/claim') {
      const ip = req.headers.get('CF-Connecting-IP') || 'x', rk = 'r:' + ip;
      const tries = Number((await env.LETTERS.get(rk)) || 0);
      if (tries >= 20) return J({ error: 'too many' }, 429);
      let body; try { body = await req.json(); } catch (e) { return J({ error: 'bad json' }, 400); }
      const code = String(body?.code || '').replace(/\D/g, '');
      if (code.length !== 6) return J({ error: 'bad code' }, 400);
      const ok = await env.LETTERS.get('p:' + code);
      if (!ok) { await env.LETTERS.put(rk, String(tries + 1), { expirationTtl: 3600 }); return J({ error: 'not found' }, 404); }
      await env.LETTERS.delete('p:' + code);
      return J({ key: env.FAMILY_KEY });
    }
    if (!env.FAMILY_KEY || !same(req.headers.get('X-Family-Key') || '', env.FAMILY_KEY)) return J({ error: 'unauthorized' }, 401);
    // つなぐ ばんごうを つくる（かぎを もっている パパの ページから）
    if (req.method === 'POST' && url.pathname === '/api/pair') {
      const a = new Uint32Array(1); crypto.getRandomValues(a);
      const code = String(a[0] % 1000000).padStart(6, '0');
      await env.LETTERS.put('p:' + code, '1', { expirationTtl: 600 });
      return J({ code, expires: Date.now() + 600000 });
    }

    // おてがみの 一覧は D1（つねに 最新）。声・絵は KV（1かい かいたら かわらない）
    const row2msg = r => ({ id: r.id, kidId: r.kidId, kidName: r.kidName, thread: r.thread, from: r.frm, text: r.text || '', hasAudio: !!r.hasAudio, hasImage: !!r.hasImage, mime: r.mime || '', device: r.device || '', ts: r.ts, heard: !!r.heard, u: r.u, ...(r.kind ? { kind: r.kind } : {}), ...(r.deleted ? { deleted: true } : {}) });
    // いちどだけ：KV の 一覧を D1 に うつす
    if (req.method === 'POST' && url.pathname === '/api/migrate-kv') {
      const idx = JSON.parse((await env.LETTERS.get('index')) || '[]');
      let n = 0;
      for (const m of idx) {
        await env.DB.prepare('INSERT OR IGNORE INTO msgs (id,kidId,kidName,thread,frm,text,hasAudio,hasImage,mime,device,kind,ts,heard,deleted,u) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
          .bind(m.id, m.kidId || '', m.kidName || '', m.thread, m.from, m.text || '', m.hasAudio ? 1 : 0, m.hasImage ? 1 : 0, m.mime || '', m.device || '', m.kind || null, m.ts || 0, m.heard ? 1 : 0, m.deleted ? 1 : 0, m.u || Date.now()).run();
        n++;
      }
      return J({ ok: true, migrated: n });
    }
    // おてがみを けす：{ ids: [...] }。ほかの 端末も けせるように「けした しるし」を のこす
    if (req.method === 'POST' && url.pathname === '/api/delete') {
      let body; try { body = await req.json(); } catch (e) { return J({ error: 'bad json' }, 400); }
      const ids = Array.isArray(body?.ids) ? body.ids.filter(x => typeof x === 'string').slice(0, 500) : [];
      const now = Date.now();
      for (const id of ids) {
        await env.DB.prepare("UPDATE msgs SET deleted = 1, text = '', hasAudio = 0, hasImage = 0, u = ? WHERE id = ?").bind(now, id).run();
        await env.LETTERS.delete('a:' + id); await env.LETTERS.delete('i:' + id);
      }
      return J({ ok: true, deleted: ids.length, u: now });
    }
    if (req.method === 'GET' && url.pathname === '/api/msgs') {
      const since = Number(url.searchParams.get('since') || 0);
      const { results } = await env.DB.prepare('SELECT * FROM msgs WHERE u > ? ORDER BY ts LIMIT 2000').bind(since).all();
      return J({ now: Date.now(), msgs: results.map(row2msg) });
    }
    if (req.method === 'GET' && url.pathname.startsWith('/api/audio/')) {
      const id = decodeURIComponent(url.pathname.slice('/api/audio/'.length));
      const a = await env.LETTERS.get('a:' + id);
      return a ? J({ audio: a }) : J({ error: 'not found' }, 404);
    }
    if (req.method === 'GET' && url.pathname.startsWith('/api/image/')) {
      const id = decodeURIComponent(url.pathname.slice('/api/image/'.length));
      const a = await env.LETTERS.get('i:' + id);
      return a ? J({ image: a }) : J({ error: 'not found' }, 404);
    }
    if (req.method === 'POST' && url.pathname === '/api/msgs') {
      let body; try { body = await req.json(); } catch (e) { return J({ error: 'bad json' }, 400); }
      const m = body?.msg;
      if (!m || typeof m.id !== 'string' || m.id.length > 40 || !THREADS.includes(m.thread) || !FROMS.includes(m.from)) return J({ error: 'bad msg' }, 400);
      const now = Date.now();
      const old = await env.DB.prepare('SELECT deleted FROM msgs WHERE id = ?').bind(m.id).first();
      if (old?.deleted) return J({ ok: true, u: now, deleted: true });   // けした ものは もどさない
      if (body.audio) {
        if (typeof body.audio !== 'string' || !body.audio.startsWith('data:audio/') || body.audio.length > MAX_AUDIO) return J({ error: 'bad audio' }, 400);
        await env.LETTERS.put('a:' + m.id, body.audio, { expirationTtl: KEEP_DAYS * 86400 });
      }
      if (body.image) {
        if (typeof body.image !== 'string' || !body.image.startsWith('data:image/') || body.image.length > MAX_IMAGE) return J({ error: 'bad image' }, 400);
        await env.LETTERS.put('i:' + m.id, body.image, { expirationTtl: KEEP_DAYS * 86400 });
      }
      const kind = ['greet', 'thanks', 'papaPhoto', 'papaIcon', 'mamaPhoto', 'mamaIcon'].includes(m.kind) ? m.kind : null;
      await env.DB.prepare(`INSERT INTO msgs (id,kidId,kidName,thread,frm,text,hasAudio,hasImage,mime,device,kind,ts,heard,deleted,u) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,0,?)
        ON CONFLICT(id) DO UPDATE SET heard = MAX(heard, excluded.heard), text = CASE WHEN excluded.text <> '' THEN excluded.text ELSE text END,
          hasAudio = MAX(hasAudio, excluded.hasAudio), hasImage = MAX(hasImage, excluded.hasImage), u = excluded.u`)
        .bind(m.id, String(m.kidId || '').slice(0, 40), String(m.kidName || '').slice(0, 20), m.thread, m.from, String(m.text || '').slice(0, 500),
          m.hasAudio ? 1 : 0, m.hasImage ? 1 : 0, String(m.mime || '').slice(0, 40), String(m.device || '').slice(0, 30), kind, Number(m.ts) || now, m.heard ? 1 : 0, now).run();
      // ふるい もの（180日）は ときどき けす
      if (Math.random() < 0.02) await env.DB.prepare('DELETE FROM msgs WHERE ts < ?').bind(now - KEEP_DAYS * 86400000).run();
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
