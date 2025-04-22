
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v2: cloudinary } = require('cloudinary');
const multer = require('multer');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });
const db = new Database('checkin.db');

app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS) from this directory
app.use(express.static(path.join(process.cwd())));

// Cloudinary setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Serve participant list
app.get('/api/participants', (req, res) => {
  const data = db.prepare('SELECT id, name, image_url FROM participants').all();
  res.json(data);
});

// Image upload route
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path);
    db.prepare('UPDATE participants SET image_url = ? WHERE id = ?')
      .run(result.secure_url, req.body.id);
    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Check-in route
app.post('/api/checkin', (req, res) => {
  const result = db.prepare('UPDATE participants SET checked_in = 1 WHERE id = ?').run(req.body.id);
  res.json({ success: result.changes > 0 });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));