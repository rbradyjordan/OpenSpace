// Public setup-status endpoint for onboarding. Booleans only — no secrets.
const { blobToken } = require('./_lib.js');

module.exports = async (req, res) => {
  const out = {
    editorPassword: !!process.env.EDITOR_PASSWORD,
    sessionSecret: !!process.env.SESSION_SECRET,
    blob: 'missing',
  };
  if (blobToken()) {
    try {
      const { list } = await import('@vercel/blob');
      await list({ prefix: 'pages/', limit: 1, token: blobToken() });
      out.blob = 'ok';
    } catch {
      out.blob = 'error';
    }
  }
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(out);
};
