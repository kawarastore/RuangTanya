const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendVerificationEmail(toEmail, username, token, baseUrl) {
  const link = `${baseUrl}/api/auth/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"RuangTanya" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: '✉️ Verifikasi Email RuangTanya',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:2rem;background:#fdf6ec;border-radius:16px;">
        <h2 style="color:#1a1209;font-size:1.6rem;">Halo, ${username}! 👋</h2>
        <p style="color:#6b5c42;line-height:1.6;">Terima kasih sudah mendaftar di <strong>RuangTanya</strong>. Klik tombol di bawah untuk verifikasi emailmu:</p>
        <a href="${link}" style="display:inline-block;margin:1.2rem 0;padding:0.8rem 2rem;background:#e8890c;color:#1a1209;border-radius:50px;font-weight:700;text-decoration:none;">Verifikasi Email ✦</a>
        <p style="color:#c4ad91;font-size:0.8rem;">Link berlaku 24 jam. Jika kamu tidak mendaftar, abaikan email ini.</p>
      </div>
    `
  });
}

module.exports = { sendVerificationEmail };
