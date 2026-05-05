const jwt = require('jsonwebtoken');
const { pool } = require('./db');

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [payload.id]);
    if (!rows.length) return res.status(401).json({ error: 'User tidak ditemukan' });
    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ error: 'Token tidak valid' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses ditolak' });
  next();
}

module.exports = { authMiddleware, adminOnly };
