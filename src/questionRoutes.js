const express = require('express');
const { pool } = require('./db');
const { authMiddleware, adminOnly } = require('./middleware');

const router = express.Router();

// POST /api/questions — siapa saja bisa kirim
router.post('/', async (req, res) => {
  const { text, token } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Pertanyaan tidak boleh kosong' });
  if (text.trim().length > 500) return res.status(400).json({ error: 'Maksimal 500 karakter' });

  let userId = null, username = null;
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const { rows } = await pool.query('SELECT id,username FROM users WHERE id=$1', [payload.id]);
      if (rows.length) { userId = rows[0].id; username = rows[0].username; }
    } catch {}
  }

  try {
    await pool.query(
      'INSERT INTO questions (text, user_id, username) VALUES ($1, $2, $3)',
      [text.trim(), userId, username]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/questions — admin only
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM questions ORDER BY created_at DESC');
    res.json({ questions: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/questions/:id — admin only
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM questions WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/users — admin only
router.get('/admin/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id,username,email,whatsapp,role,email_verified,created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/stats — admin only
router.get('/admin/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const qTotal = await pool.query('SELECT COUNT(*) FROM questions');
    const qToday = await pool.query("SELECT COUNT(*) FROM questions WHERE created_at::date = CURRENT_DATE");
    const uTotal = await pool.query('SELECT COUNT(*) FROM users');
    res.json({
      total: parseInt(qTotal.rows[0].count),
      today: parseInt(qToday.rows[0].count),
      users: parseInt(uTotal.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
