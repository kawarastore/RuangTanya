const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        whatsapp VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' NOT NULL,
        email_verified BOOLEAN DEFAULT false,
        verify_token VARCHAR(255),
        verify_expires TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS questions (
        id BIGSERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        username VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Database tables ready');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
