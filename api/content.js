// Slot-content API — the portable integration layer for framework sites (Next.js, etc).
// Pages mark editable regions with data-cpm-slot="name"; the editor saves slot HTML here
// as JSON keyed by page path. Public GET (CORS-enabled) so any front-end can hydrate.
const {
  requireAuth,
  blobReadText,
  blobWriteText,
  blobDelete,
  readBody,
} = require('./_lib.js');

function keyFor(path) {
  // "/about" -> "about", "/" -> "index", strip query/hash, sanitize
  const clean = String(path || '/').split(/[?#]/)[0].replace(/^\/+|\/+$/g, '') || 'index';
  return clean.replace(/[^a-zA-Z0-9/_-]/g, '_').replace(/\//g, '__');
}

module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const path = url.searchParams.get('path');
  const key = keyFor(path);

  // Public read of published content — CORS open so any of your sites can consume it.
  if (req.method === 'GET') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const mode = url.searchParams.get('mode') === 'draft' ? 'draft' : 'published';
    if (mode === 'draft' && !require('./_lib.js').isAuthed(req)) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    try {
      let text = null;
      try {
        text =
          mode === 'draft'
            ? (await blobReadText(`content/draft/${key}.json`)) ||
              (await blobReadText(`content/published/${key}.json`))
            : await blobReadText(`content/published/${key}.json`);
      } catch {}
      text = text || '{}';
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Cache-Control',
        mode === 'published' ? 'public, max-age=0, s-maxage=30, stale-while-revalidate=300' : 'no-store'
      );
      return res.status(200).send(text);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    return res.status(204).end();
  }

  if (!requireAuth(req, res)) return;

  try {
    if (req.method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString() || '{}');
      const { action } = body;
      if (action === 'save') {
        await blobWriteText(`content/draft/${key}.json`, JSON.stringify(body.slots || {}), 'application/json');
        return res.status(200).json({ ok: true, key });
      }
      if (action === 'publish') {
        const data = body.slots != null
          ? JSON.stringify(body.slots)
          : await blobReadText(`content/draft/${key}.json`);
        if (data == null) return res.status(400).json({ error: 'nothing to publish' });
        await blobWriteText(`content/draft/${key}.json`, data, 'application/json');
        await blobWriteText(`content/published/${key}.json`, data, 'application/json');
        return res.status(200).json({ ok: true, key });
      }
      if (action === 'revert') {
        await blobDelete(`content/draft/${key}.json`);
        await blobDelete(`content/published/${key}.json`);
        return res.status(200).json({ ok: true });
      }
      return res.status(400).json({ error: 'unknown action' });
    }
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
