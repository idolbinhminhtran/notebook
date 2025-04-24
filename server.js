// server.js
require('dotenv').config();

const express = require('express');
const path    = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ——— Utility: strip accents & lowercase ———
function normalize(text = '') {
  return text
      .normalize('NFD')                     // decompose accent marks
      .replace(/[\u0300-\u036f]/g, '')      // remove accent marks
      .toLowerCase();
}

// ——— Postgres pool (Supabase) ———
const pool = new Pool({
  connectionString: process.env.SUPABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Test DB connection on startup
pool
    .connect()
    .then(client => {
      console.log('🗄️  Connected to database');
      client.release();
    })
    .catch(err => {
      console.error('❌ Database connection error:', err.message);
    });

// ——— Middleware ———
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'src')));

// ——— Routes ———

// 1) List all participant names
app.get('/api/participants', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT name FROM participants ORDER BY name');
    res.json(rows.map(r => r.name));
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2) Record a check-in
app.post('/api/checkin', async (req, res) => {
  const nameRaw = req.body.name || '';
  const nameNorm = normalize(nameRaw);

  if (!nameRaw.trim()) {
    return res.json({ success: false, error: 'Vui lòng nhập tên.' });
  }

  try {
    // Fetch all participants once
    const { rows } = await pool.query('SELECT id, name FROM participants');

    // Find normalized match
    const match = rows.find(r => normalize(r.name) === nameNorm);
    if (!match) {
      return res.json({
        success: false,
        error: 'Tên này không có trong danh sách đại biểu.'
      });
    }

    // Insert check-in
    await pool.query(
        'INSERT INTO checkins(participant_id) VALUES ($1)',
        [ match.id ]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3) Fallback to your SPA’s index.html
app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// ——— Start server ———
app.listen(PORT, () => {
  console.log(`🚀 Listening on port ${PORT}`);
});