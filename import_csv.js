import fs from 'fs';
import csv from 'csv-parser';
import Database from 'better-sqlite3';

const db = new Database('checkin.db');
const insert = db.prepare('INSERT INTO participants (name, position) VALUES (?, ?)');

fs.createReadStream('danh_sach_diem_danh.csv')
  .pipe(csv())
  .on('data', row => {
    if (row.name && row.name.trim()) {
      insert.run(row.name.trim(), row.position || '');
    }
  })
  .on('end', () => {
    console.log('Import complete.');
  });