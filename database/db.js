const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

const DB_PATH = path.join(__dirname, 'freelance_amanah.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
    seedDefaults();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS admin_password (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      password_hash TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS setoran (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_discord TEXT NOT NULL,
      nomor_wa TEXT NOT NULL,
      nomor_dana TEXT NOT NULL,
      username_email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      tanggal TEXT NOT NULL,
      jam TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS history_reset (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tanggal TEXT NOT NULL,
      jam TEXT NOT NULL,
      data_sebelum TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS email_list (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedDefaults() {
  const existing = db.prepare('SELECT id FROM admin_password LIMIT 1').get();
  if (!existing) {
    const hash = bcrypt.hashSync('yudha05', 10);
    db.prepare('INSERT INTO admin_password (password_hash) VALUES (?)').run(hash);
  }
  const defaults = {
    open_time: '08:00',
    close_time: '17:00',
    catatan_bayaran: '💸 Harga Bayaran:\n\n- Email Standard: Rp 5.000\n- Email Premium: Rp 10.000\n- Email VIP: Rp 25.000\n\nKirim setoran melalui DANA dan konfirmasi di sini.',
    harga_bayaran: '5000'
  };
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(defaults)) {
    insertSetting.run(key, value);
  }
  const emailCount = db.prepare('SELECT COUNT(*) as cnt FROM email_list').get();
  if (emailCount.cnt === 0) {
    const defaultEmails = ['standard@example.com', 'premium@example.com', 'vip@example.com'];
    const insertEmail = db.prepare('INSERT OR IGNORE INTO email_list (email) VALUES (?)');
    for (const email of defaultEmails) {
      insertEmail.run(email);
    }
  }
}

module.exports = { getDb };
