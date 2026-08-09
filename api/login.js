const { checkPassword, sessionCookie, clearCookie, readBody } = require('./_lib.js');

module.exports = async (req, res) => {
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearCookie());
    return res.status(200).json({ ok: true });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  try {
    const body = JSON.parse((await readBody(req)).toString() || '{}');
    if (!checkPassword(body.password)) {
      return res.status(401).json({ error: 'wrong password' });
    }
    res.setHeader('Set-Cookie', sessionCookie());
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
