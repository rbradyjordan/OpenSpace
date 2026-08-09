// Public page server: published Blob override wins, else the static file from the repo.
const fs = require('fs');
const path = require('path');
const { blobReadText, PAGE_NAME_RE } = require('./_lib.js');

module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.searchParams.get('p') || 'index.html';

  if (!PAGE_NAME_RE.test(p)) {
    return res.status(400).send('Bad request');
  }

  let html = null;
  try {
    html = await blobReadText(`pages/published/${p}`);
  } catch {
    // Blob not configured yet — fall through to static
  }

  if (html === null) {
    try {
      html = fs.readFileSync(path.join(process.cwd(), p), 'utf8');
    } catch {
      return res.status(404).send('<h1 style="font-family:sans-serif">404 — Page not found</h1>');
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  return res.status(200).send(html);
};
