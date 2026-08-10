// Social & Links manager: one list of profile links, applied to the
// header (.h-right) and footer (.f-social) of every page.
// Config lives at config/social.json in Blob storage.
const fs = require('fs');
const path = require('path');
const {
  requireAuth,
  blobFind,
  blobReadText,
  blobWriteText,
  readBody,
  PAGE_NAME_RE,
} = require('./_lib.js');

const CONFIG_KEY = 'config/social.json';
const STATIC_DIR = process.cwd();

// fill-based icon paths, all viewBox 0 0 24 24 (matches the site's .sicon / .f-social styling)
const ICON_PATHS = {
  instagram: 'M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.3-.1 1.7-.1 4.9-.1zm0 2c-3.1 0-3.5 0-4.8.1-1.1.1-1.5.2-1.8.3-.5.2-.8.4-1.1.7-.3.3-.5.6-.7 1.1-.1.3-.3.7-.3 1.8-.1 1.3-.1 1.6-.1 4.8s0 3.5.1 4.8c.1 1.1.2 1.5.3 1.8.2.5.4.8.7 1.1.3.3.6.5 1.1.7.3.1.7.3 1.8.3 1.3.1 1.6.1 4.8.1s3.5 0 4.8-.1c1.1-.1 1.5-.2 1.8-.3.5-.2.8-.4 1.1-.7.3-.3.5-.6.7-1.1.1-.3.3-.7.3-1.8.1-1.3.1-1.6.1-4.8s0-3.5-.1-4.8c-.1-1.1-.2-1.5-.3-1.8-.2-.5-.4-.8-.7-1.1-.3-.3-.6-.5-1.1-.7-.3-.1-.7-.3-1.8-.3-1.3-.1-1.6-.1-4.8-.1zm0 3.4a5.4 5.4 0 1 1 0 10.8 5.4 5.4 0 0 1 0-10.8zm0 2a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8zm5.6-3.5a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z',
  linkedin: 'M20.4 3H3.6C3.3 3 3 3.3 3 3.6v16.8c0 .3.3.6.6.6h16.8c.3 0 .6-.3.6-.6V3.6c0-.3-.3-.6-.6-.6zM8.3 18.4H5.7V9.7h2.7v8.7zM7 8.5a1.6 1.6 0 1 1 0-3.1 1.6 1.6 0 0 1 0 3.1zm11.4 9.9h-2.7v-4.2c0-1 0-2.3-1.4-2.3s-1.6 1.1-1.6 2.2v4.3H10V9.7h2.6v1.2c.4-.7 1.2-1.4 2.6-1.4 2.7 0 3.2 1.8 3.2 4.1v4.8z',
  youtube: 'M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12c0 2 .2 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.3-1.9.5-3.8.5-5.8s-.2-3.9-.5-5.8zM9.6 15.6V8.4L15.8 12l-6.2 3.6z',
  tiktok: 'M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  facebook: 'M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.02 4.39 11.02 10.13 11.93v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z',
  x: 'M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93zm-1.29 19.5h2.04L6.49 3.24H4.3z',
  link: 'M10.6 13.4a1 1 0 0 0 1.4 0l4.6-4.6a3.54 3.54 0 0 0-5-5L9.2 6.2a1 1 0 1 0 1.4 1.4L13 5.2a1.54 1.54 0 0 1 2.2 2.2l-4.6 4.6a1 1 0 0 0 0 1.4zm2.8-2.8a1 1 0 0 0-1.4 0l-4.6 4.6a3.54 3.54 0 0 0 5 5l2.4-2.4a1 1 0 1 0-1.4-1.4L11 18.8a1.54 1.54 0 0 1-2.2-2.2l4.6-4.6a1 1 0 0 0 0-1.4z',
};

const DEFAULT_LINKS = [
  { id: 'instagram', label: 'Instagram', url: 'http://instagram.com/rbradyjordan', enabled: true },
  { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/brady-jordan-a34172149/', enabled: true },
  { id: 'youtube', label: 'YouTube', url: 'https://youtube.com/clipplaytv', enabled: true },
  { id: 'tiktok', label: 'TikTok', url: '', enabled: false },
  { id: 'facebook', label: 'Facebook', url: '', enabled: false },
  { id: 'x', label: 'X / Twitter', url: '', enabled: false },
];

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sanitizeLinks(raw) {
  if (!Array.isArray(raw)) return null;
  const out = [];
  for (const l of raw.slice(0, 20)) {
    const id = String(l.id || 'custom').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24) || 'custom';
    const label = String(l.label || '').slice(0, 40);
    const url = String(l.url || '').trim().slice(0, 300);
    if (url && !/^https?:\/\//i.test(url)) return null;
    if (/["'<>]/.test(url)) return null;
    out.push({ id, label, url, enabled: !!l.enabled && !!url });
  }
  return out;
}

function anchorsFor(links, variant) {
  return links
    .filter((l) => l.enabled && l.url)
    .map((l) => {
      const d = ICON_PATHS[l.id] || ICON_PATHS.link;
      const cls = variant === 'header' ? ' class="sicon"' : '';
      return `<a href="${escAttr(l.url)}" target="_blank" rel="noopener" aria-label="${escAttr(l.label || l.id)}"><svg${cls} viewBox="0 0 24 24"><path d="${d}"/></svg></a>`;
    })
    .join('\n    ');
}

// swap the anchor runs inside .h-right (before the Book button) and .f-social
function applyToHtml(html, links) {
  let touched = false;
  let out = html.replace(/(<div class="h-right">)[\s\S]*?(?=<a class="h-book")/, (m, open) => {
    touched = true;
    return `${open}\n    ${anchorsFor(links, 'header')}\n    `;
  });
  out = out.replace(/(<div class="f-social">)[\s\S]*?(<\/div>)/, (m, open, close) => {
    touched = true;
    return `${open}\n      ${anchorsFor(links, 'footer')}\n    ${close}`;
  });
  return touched ? out : null;
}

function staticPages() {
  try {
    return fs.readdirSync(STATIC_DIR).filter((f) => f.endsWith('.html') && !f.startsWith('_'));
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

async function allPageNames() {
  const names = new Set(staticPages());
  try {
    (await blobFind('pages/draft/')).forEach((b) => names.add(b.pathname.replace('pages/draft/', '')));
    (await blobFind('pages/published/')).forEach((b) => names.add(b.pathname.replace('pages/published/', '')));
  } catch {}
  return [...names].filter((n) => PAGE_NAME_RE.test(n)).sort();
}

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  try {
    if (req.method === 'GET') {
      let links = null;
      try {
        const raw = await blobReadText(CONFIG_KEY);
        if (raw) links = sanitizeLinks(JSON.parse(raw).links);
      } catch {}
      return res.status(200).json({ links: links || DEFAULT_LINKS });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

    const body = JSON.parse((await readBody(req)).toString() || '{}');
    const links = sanitizeLinks(body.links);
    if (!links) return res.status(400).json({ error: 'bad links payload (urls must be http(s), no quotes)' });

    await blobWriteText(CONFIG_KEY, JSON.stringify({ links }), 'application/json');
    if (body.action === 'save') return res.status(200).json({ ok: true, updated: 0 });

    if (body.action !== 'apply') return res.status(400).json({ error: 'unknown action' });
    const publish = !!body.publish;
    const updated = [];
    for (const page of await allPageNames()) {
      let html = null;
      try {
        html = (await blobReadText(`pages/draft/${page}`)) || (await blobReadText(`pages/published/${page}`));
      } catch {}
      if (html == null) html = readStatic(page);
      if (html == null) continue;
      const next = applyToHtml(html, links);
      if (next == null) continue; // page has no social blocks — leave it alone
      await blobWriteText(`pages/draft/${page}`, next);
      if (publish) await blobWriteText(`pages/published/${page}`, next);
      updated.push(page);
    }
    return res.status(200).json({ ok: true, updated: updated.length, pages: updated });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
