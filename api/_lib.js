// Shared helpers: auth (HMAC-signed session cookies) + blob storage utils.
const crypto = require('crypto');

const SESSION_COOKIE = 'cpm_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET env var is not set');
  return s;
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  return `${body}.${mac}`;
}

function verify(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, mac] = token.split('.');
  const expected = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const out = {};
  const header = req.headers.cookie || '';
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx > -1) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  return out;
}

function isAuthed(req) {
  const cookies = parseCookies(req);
  return verify(cookies[SESSION_COOKIE]) !== null;
}

function requireAuth(req, res) {
  if (!isAuthed(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return false;
  }
  return true;
}

function checkPassword(input) {
  const expected = process.env.EDITOR_PASSWORD;
  if (!expected) throw new Error('EDITOR_PASSWORD env var is not set');
  const a = crypto.createHash('sha256').update(String(input || '')).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function sessionCookie() {
  const token = sign({ role: 'editor', exp: Date.now() + SESSION_TTL_MS });
  const secure = process.env.VERCEL ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}${secure}`;
}

function clearCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// ---- blob helpers ----
// Vercel's connect flow can prefix the token env var (e.g. MYSTORE_BLOB_READ_WRITE_TOKEN);
// the SDK only auto-detects the unprefixed name, so locate it ourselves.
function blobToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  const key = Object.keys(process.env).find((k) => k.endsWith('BLOB_READ_WRITE_TOKEN'));
  return key ? process.env[key] : undefined;
}

async function blobModule() {
  return await import('@vercel/blob');
}

async function blobFind(prefix) {
  const { list } = await blobModule();
  const { blobs } = await list({ prefix, token: blobToken() });
  return blobs;
}

async function blobReadText(pathname) {
  const blobs = await blobFind(pathname);
  const hit = blobs.find((b) => b.pathname === pathname);
  if (!hit) return null;
  const r = await fetch(hit.url, { cache: 'no-store' });
  if (!r.ok) return null;
  return await r.text();
}

async function blobWriteText(pathname, text, contentType) {
  const { put } = await blobModule();
  return await put(pathname, text, {
    access: 'public',
    contentType: contentType || 'text/html; charset=utf-8',
    addRandomSuffix: false,
    cacheControlMaxAge: 0,
    token: blobToken(),
  });
}

async function blobDelete(pathname) {
  const { del } = await blobModule();
  const blobs = await blobFind(pathname);
  const hit = blobs.find((b) => b.pathname === pathname);
  if (hit) await del(hit.url, { token: blobToken() });
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const PAGE_NAME_RE = /^[a-z0-9][a-z0-9-]{0,60}\.html$/;

module.exports = {
  blobToken,
  SESSION_COOKIE,
  sign,
  verify,
  parseCookies,
  isAuthed,
  requireAuth,
  checkPassword,
  sessionCookie,
  clearCookie,
  blobFind,
  blobReadText,
  blobWriteText,
  blobDelete,
  readBody,
  PAGE_NAME_RE,
};
