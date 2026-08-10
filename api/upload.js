// Media upload: raw body -> Vercel Blob. ?name=<filename> query param.
const { requireAuth, readBody, blobToken } = require('./_lib.js');

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const ALLOWED = /\.(png|jpe?g|gif|webp|avif|svg|mp4|webm|mov|m4v|mp3|wav|pdf|ico)$/i;

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  if (req.method === 'GET') {
    // media library listing
    try {
      const { list } = await import('@vercel/blob');
      const { blobs } = await list({ prefix: 'media/', token: blobToken() });
      return res.status(200).json({
        media: blobs
          .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
          .map((b) => ({ url: b.url, pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt })),
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
  if (req.method === 'DELETE') {
    try {
      const url = new URL(req.url, 'http://x');
      const target = url.searchParams.get('url');
      if (!target) return res.status(400).json({ error: 'missing url' });
      const { del } = await import('@vercel/blob');
      await del(target, { token: blobToken() });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  try {
    const url = new URL(req.url, 'http://x');
    const rawName = url.searchParams.get('name') || 'file';
    const safe = rawName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
    if (!ALLOWED.test(safe)) return res.status(400).json({ error: 'file type not allowed' });

    const body = await readBody(req);
    if (body.length === 0) return res.status(400).json({ error: 'empty body' });
    if (body.length > MAX_BYTES) return res.status(413).json({ error: 'file too large (50MB max)' });

    const { put } = await import('@vercel/blob');
    const key = `media/${Date.now()}-${safe}`;
    const blob = await put(key, body, {
      access: 'public',
      contentType: req.headers['content-type'] || undefined,
      addRandomSuffix: false,
      token: blobToken(),
    });
    return res.status(200).json({ url: blob.url, pathname: blob.pathname });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
