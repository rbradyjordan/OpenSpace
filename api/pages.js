// Page CRUD: list, read (draft/published), save draft, publish, revert, create, delete.
const fs = require('fs');
const path = require('path');
const {
  requireAuth,
  blobFind,
  blobReadText,
  blobWriteText,
  blobDelete,
  readBody,
  PAGE_NAME_RE,
} = require('./_lib.js');

const STATIC_DIR = process.cwd();

function staticPages() {
  try {
    return fs
      .readdirSync(STATIC_DIR)
      .filter((f) => f.endsWith('.html') && !f.startsWith('_'));
  } catch {
    return [];
  }
}

function readStatic(page) {
  try {
    return fs.readFileSync(path.join(STATIC_DIR, page), 'utf8');
  } catch {
    return null;
  }
}

const HISTORY_KEEP = 25;
const HISTORY_MIN_GAP_MS = 60 * 1000; // don't snapshot more than once a minute

async function snapshotHistory(page, html) {
  try {
    const { blobFind: find, blobWriteText: write, blobDelete: del } = require('./_lib.js');
    const blobs = await find(`pages/history/${page}/`);
    const versions = blobs
      .map((b) => ({ pathname: b.pathname, ts: Number(b.pathname.split('/').pop()) }))
      .filter((v) => !isNaN(v.ts))
      .sort((a, b) => b.ts - a.ts);
    if (versions[0] && Date.now() - versions[0].ts < HISTORY_MIN_GAP_MS) return;
    await write(`pages/history/${page}/${Date.now()}`, html);
    for (const v of versions.slice(HISTORY_KEEP - 1)) await del(v.pathname);
  } catch {
    // history is best-effort; never block a save on it
  }
}

const BLANK_PAGE = (title) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="">
<link rel="icon" href="https://images.squarespace-cdn.com/content/v1/61e1f4ef472914681c085004/2f42db79-b863-46e9-80b9-02c55d834649/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600;1,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<section style="padding:6rem 6vw;text-align:center">
  <h1 style="font-weight:700;font-style:italic;font-size:3rem">${title}</h1>
  <p style="margin-top:1.5rem">Start editing this page.</p>
</section>
</body>
</html>`;

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  const url = new URL(req.url, 'http://x');

  try {
    if (req.method === 'GET') {
      const page = url.searchParams.get('page');
      const historyOf = url.searchParams.get('history');

      if (historyOf && PAGE_NAME_RE.test(historyOf)) {
        const blobs = await blobFind(`pages/history/${historyOf}/`);
        const versions = blobs
          .map((b) => ({ ts: Number(b.pathname.split('/').pop()), size: b.size }))
          .filter((v) => !isNaN(v.ts))
          .sort((a, b) => b.ts - a.ts);
        return res.status(200).json({ versions });
      }

      if (!page) {
        // list all pages with status; Blob may not be connected yet — degrade gracefully
        let drafts = [], published = [];
        try {
          drafts = await blobFind('pages/draft/');
          published = await blobFind('pages/published/');
        } catch {}
        const names = new Set(staticPages());
        drafts.forEach((b) => names.add(b.pathname.replace('pages/draft/', '')));
        published.forEach((b) => names.add(b.pathname.replace('pages/published/', '')));
        const items = [...names].sort().map((name) => ({
          name,
          isStatic: staticPages().includes(name),
          hasDraft: drafts.some((b) => b.pathname === `pages/draft/${name}`),
          hasPublished: published.some((b) => b.pathname === `pages/published/${name}`),
          draftUpdated:
            drafts.find((b) => b.pathname === `pages/draft/${name}`)?.uploadedAt || null,
        }));
        return res.status(200).json({ pages: items });
      }

      if (!PAGE_NAME_RE.test(page)) return res.status(400).json({ error: 'bad page name' });
      const mode = url.searchParams.get('mode') || 'draft';
      let html = null;
      try {
        if (mode === 'draft') {
          html =
            (await blobReadText(`pages/draft/${page}`)) ||
            (await blobReadText(`pages/published/${page}`));
        } else {
          html = await blobReadText(`pages/published/${page}`);
        }
      } catch {
        // Blob not configured — editing still works from the static files
      }
      if (html == null) html = readStatic(page);
      if (html === null) return res.status(404).json({ error: 'not found' });
      // preview=1: page is being viewed at the /api/pages URL — repoint relative assets
      if (url.searchParams.get('preview') === '1') {
        html = html.replace(/<head([^>]*)>/i, '<head$1><base href="/">');
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send(html);
    }

    if (req.method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString() || '{}');
      const { action, page } = body;
      if (!PAGE_NAME_RE.test(page || '')) return res.status(400).json({ error: 'bad page name' });

      if (action === 'save') {
        const html = String(body.html || '');
        await blobWriteText(`pages/draft/${page}`, html);
        await snapshotHistory(page, html);
        return res.status(200).json({ ok: true });
      }

      if (action === 'publish') {
        const draft =
          body.html != null ? String(body.html) : await blobReadText(`pages/draft/${page}`);
        if (draft == null) return res.status(400).json({ error: 'nothing to publish' });
        await blobWriteText(`pages/draft/${page}`, draft);
        await blobWriteText(`pages/published/${page}`, draft);
        await snapshotHistory(page, draft);
        return res.status(200).json({ ok: true });
      }

      if (action === 'restore') {
        const ts = Number(body.ts);
        if (!ts) return res.status(400).json({ error: 'missing ts' });
        const html = await blobReadText(`pages/history/${page}/${ts}`);
        if (html == null) return res.status(404).json({ error: 'version not found' });
        await blobWriteText(`pages/draft/${page}`, html);
        return res.status(200).json({ ok: true });
      }

      if (action === 'discard-draft') {
        await blobDelete(`pages/draft/${page}`);
        return res.status(200).json({ ok: true });
      }

      if (action === 'revert') {
        // remove both overrides -> falls back to the static file shipped with the repo
        await blobDelete(`pages/draft/${page}`);
        await blobDelete(`pages/published/${page}`);
        return res.status(200).json({ ok: true });
      }

      if (action === 'create') {
        const exists =
          staticPages().includes(page) ||
          (await blobReadText(`pages/draft/${page}`)) !== null ||
          (await blobReadText(`pages/published/${page}`)) !== null;
        if (exists) return res.status(409).json({ error: 'page already exists' });
        let html;
        if (body.cloneFrom && PAGE_NAME_RE.test(body.cloneFrom)) {
          html =
            (await blobReadText(`pages/draft/${body.cloneFrom}`)) ||
            (await blobReadText(`pages/published/${body.cloneFrom}`)) ||
            readStatic(body.cloneFrom);
          if (html == null) return res.status(400).json({ error: 'cloneFrom not found' });
        } else {
          html = BLANK_PAGE(body.title || page.replace('.html', ''));
        }
        await blobWriteText(`pages/draft/${page}`, html);
        return res.status(200).json({ ok: true });
      }

      if (action === 'delete') {
        if (staticPages().includes(page)) {
          return res
            .status(400)
            .json({ error: 'cannot delete a base page; use revert instead' });
        }
        await blobDelete(`pages/draft/${page}`);
        await blobDelete(`pages/published/${page}`);
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: 'unknown action' });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
