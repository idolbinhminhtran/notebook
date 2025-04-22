import Database from 'better-sqlite3';

const db = new Database('checkin.db');
db.prepare(`
  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position TEXT,
    image_url TEXT,
    checked_in BOOLEAN DEFAULT 0
  )
`).run();

console.log('SQLite database created.');