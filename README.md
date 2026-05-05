# RuangTanya 🙋

Aplikasi Q&A panel anonim dengan sistem akun, verifikasi email, dan panel admin.

## Struktur Project

```
ruangtanya/
├── public/
│   └── index.html        ← Frontend (semua halaman)
├── src/
│   ├── server.js         ← Entry point Express
│   ├── db.js             ← Koneksi & inisialisasi PostgreSQL
│   ├── authRoutes.js     ← Register, Login, Verifikasi email
│   ├── questionRoutes.js ← CRUD pertanyaan + admin endpoints
│   ├── middleware.js     ← JWT auth + admin guard
│   └── mailer.js         ← Kirim email verifikasi
├── .env.example          ← Template environment variables
├── .gitignore
├── package.json
├── Procfile
└── README.md
```

---

## 🚀 Cara Deploy ke Railway

### Langkah 1 — Push ke GitHub

```bash
cd ruangtanya
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/NAMAMU/ruangtanya.git
git push -u origin main
```

### Langkah 2 — Buat Project di Railway

1. Buka [railway.app](https://railway.app) → **New Project**
2. Pilih **Deploy from GitHub repo** → pilih repo `ruangtanya`
3. Railway akan otomatis detect Node.js dan deploy

### Langkah 3 — Tambahkan PostgreSQL

1. Di dashboard Railway → klik **+ New** → **Database** → **PostgreSQL**
2. Railway otomatis inject `DATABASE_URL` ke service kamu

### Langkah 4 — Set Environment Variables

Di Railway → pilih service → tab **Variables** → tambahkan:

| Key | Value |
|-----|-------|
| `JWT_SECRET` | string acak panjang (min 32 karakter) |
| `BASE_URL` | URL Railway kamu, contoh: `https://ruangtanya.railway.app` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | email Gmail kamu |
| `SMTP_PASS` | App Password Gmail (bukan password biasa) |
| `NODE_ENV` | `production` |

> `DATABASE_URL` sudah otomatis terisi dari plugin PostgreSQL.

### Langkah 5 — Buat Admin Pertama

Setelah ada yang daftar dan verifikasi email, masuk ke Railway → PostgreSQL → **Data** (atau pakai psql/pgAdmin):

```sql
UPDATE users SET role = 'admin' WHERE username = 'NamaAdmin';
```

---

## 📋 Fitur

| Fitur | Detail |
|-------|--------|
| Daftar akun | Validasi WA, email, username (huruf saja), password (min 6 + simbol) |
| Cegah duplikat | WA, email, username yang sudah terdaftar ditolak |
| Verifikasi email | Link dikirim via email, berlaku 24 jam |
| Login JWT | Token disimpan di localStorage, berlaku 7 hari |
| Panel Admin | Tombol **Back** kembali ke home tanpa logout |
| Session persisten | Admin tidak perlu login ulang saat klik "Panel Admin" |
| Pertanyaan | Tersimpan di PostgreSQL, bisa dikirim tanpa login |
| Hapus pertanyaan | Dengan konfirmasi |
| Tabel pengguna | Admin bisa lihat semua user + status verifikasi |
| Stats | Total pertanyaan, hari ini, total pengguna |

---

## 💡 Gmail App Password

1. Buka [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Login ke akun Gmail kamu
3. Pilih **Mail** → **Other** → beri nama "RuangTanya"
4. Copy password 16 karakter yang muncul → isi di `SMTP_PASS`

> Pastikan 2FA Gmail sudah aktif sebelum bisa buat App Password.
