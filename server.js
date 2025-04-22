require('dotenv').config();

console.log('SUPABASE_URL is:', process.env.SUPABASE_URL);
const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'src')));

const PORT = process.env.PORT || 3000;
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.SUPABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test DB connection on startup
pool.connect()
  .then(client => {
    console.log('🗄️  Connected to database');
    client.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
  });

// List participant names for autocomplete
app.get('/api/participants', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT name FROM participants ORDER BY name');
    res.json(rows.map(r => r.name));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Record a check‑in
app.post('/api/checkin', async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query('SELECT id FROM participants WHERE name = $1', [name]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Không tìm thấy tên trong danh sách' });
    }
    await pool.query('INSERT INTO checkins(participant_id) VALUES($1)', [ result.rows[0].id ]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Fallback for client‑side routing
app.get('*', (_, res) =>
    res.sendFile(path.join(__dirname, 'src', 'index.html'))
);

app.listen(PORT, () =>
    console.log(`🚀 Listening on port ${PORT}`)
);