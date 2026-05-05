const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('./db');
const { sendVerificationEmail } = require('./mailer');

const router = express.Router();

// ---- Validasi ----
function validateUsername(v) {
  if (!v || !v.trim()) return 'Username tidak boleh kosong';
  if (/[0-9]/.test(v)) return 'Username tidak boleh mengandung angka';
  if (!/^[a-zA-Z\s]+$/.test(v)) return 'Username hanya boleh huruf dan spasi';
  if (v.trim().length < 2) return 'Username minimal 2 karakter';
  return null;
}
function validateWa(v) {
  const c = (v || '').replace(/\s/g, '');
  if (!c) return 'Nomor WhatsApp tidak boleh kosong';
  if (!/^(\+62|62|08)\d{8,12}$/.test(c)) return 'Format nomor tidak valid';
  return null;
}
function validatePass(v) {
  if (!v || v.length < 6) return 'Password minimal 6 karakter';
  if (!/[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]/.test(v)) return 'Password wajib mengandung minimal 1 simbol';
  return null;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, whatsapp, password } = req.body;

  const unErr = validateUsername(username);
  if (unErr) return res.status(400).json({ field: 'username', error: unErr });

  const waErr = validateWa(whatsapp);
  if (waErr) return res.status(400).json({ field: 'whatsapp', error: waErr });

  const paErr = validatePass(password);
  if (paErr) return res.status(400).json({ field: 'password', error: paErr });

  if (!email || !email.includes('@')) return res.status(400).json({ field: 'email', error: 'Email tidak valid' });

  try {
    // Cek duplikat
    const { rows: existing } = await pool.query(
      'SELECT whatsapp, email, username FROM users WHERE whatsapp=$1 OR email=$2 OR LOWER(username)=LOWER($3)',
      [whatsapp.replace(/\s/g,''), email.toLowerCase(), username.trim()]
    );
    if (existing.length) {
      const dup = existing[0];
      if (dup.whatsapp === whatsapp.replace(/\s/g,''))
        return res.status(400).json({ field: 'whatsapp', error: 'Nomor WhatsApp sudah terdaftar' });
      if (dup.email === email.toLowerCase())
        return res.status(400).json({ field: 'email', error: 'Email sudah terdaftar' });
      return res.status(400).json({ field: 'username', error: 'Username sudah digunakan' });
    }

    const hash = await bcrypt.hash(password, 12);
    const token = uuidv4();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO users (username, email, whatsapp, password_hash, verify_token, verify_expires)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [username.trim(), email.toLowerCase(), whatsapp.replace(/\s/g,''), hash, token, expires]
    );

    // Kirim email verifikasi
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    try {
      await sendVerificationEmail(email, username.trim(), token, baseUrl);
    } catch (mailErr) {
      console.error('Mail error:', mailErr.message);
      // Jangan gagalkan registrasi jika mail error
    }

    res.json({ ok: true, message: 'Registrasi berhasil! Cek email untuk verifikasi.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/verify-email?token=xxx
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.redirect('/?verified=fail');
  try {
    const { rows } = await pool.query(
      'SELECT id, verify_expires FROM users WHERE verify_token=$1 AND email_verified=false',
      [token]
    );
    if (!rows.length) return res.redirect('/?verified=fail');
    if (new Date(rows[0].verify_expires) < new Date()) return res.redirect('/?verified=expired');
    await pool.query(
      'UPDATE users SET email_verified=true, verify_token=NULL, verify_expires=NULL WHERE id=$1',
      [rows[0].id]
    );
    res.redirect('/?verified=ok');
  } catch (err) {
    console.error(err);
    res.redirect('/?verified=fail');
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Isi email dan password' });
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email.toLowerCase()]);
    if (!rows.length) return res.status(401).json({ error: 'Email atau password salah' });
    const user = rows[0];
    if (!user.email_verified) return res.status(401).json({ error: 'Email belum diverifikasi. Cek inbox kamu.' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Email atau password salah' });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      ok: true,
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.json({ user: null });
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT id,username,email,role FROM users WHERE id=$1', [payload.id]);
    if (!rows.length) return res.json({ user: null });
    res.json({ user: rows[0] });
  } catch {
    res.json({ user: null });
  }
});

module.exports = router;
