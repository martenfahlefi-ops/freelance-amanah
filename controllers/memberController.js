const { getDb } = require('../database/db');
const XSS = require('xss');

exports.memberPage = (req, res) => {
  const db = getDb();
  const settings = {};
  const rows = db.prepare('SELECT key, value FROM settings').all();
  rows.forEach(r => { settings[r.key] = r.value; });
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = (settings.open_time || '08:00').split(':').map(Number);
  const [closeH, closeM] = (settings.close_time || '17:00').split(':').map(Number);
  const isOpen = currentTime >= (openH * 60 + openM) && currentTime < (closeH * 60 + closeM);
  const emails = db.prepare('SELECT * FROM email_list WHERE is_active = 1 ORDER BY email ASC').all();
  res.render('member/index', {
    title: 'Member - FREELANCE AMANAH', settings, isOpen,
    openTimeStr: settings.open_time || '08:00', closeTimeStr: settings.close_time || '17:00',
    emails, success: null, error: null, layout: false
  });
};

exports.submitSetoran = (req, res) => {
  try {
    const { nama_discord, nomor_wa, nomor_dana, username_email } = req.body;
    const db = getDb();
    if (!nama_discord || !nomor_wa || !nomor_dana || !username_email) return res.json({ success: false, message: 'Semua field harus diisi!' });
    const duplicate = db.prepare("SELECT * FROM setoran WHERE username_email = ? AND status != 'Denied'").get(username_email.trim());
    if (duplicate) return res.json({ success: false, message: 'Username Email ini sudah digunakan dan masih aktif!' });
    const now = new Date();
    db.prepare('INSERT INTO setoran (nama_discord, nomor_wa, nomor_dana, username_email, status, tanggal, jam) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(XSS(nama_discord.trim()), XSS(nomor_wa.trim()), XSS(nomor_dana.trim()), username_email.trim(), 'Pending', now.toLocaleDateString('id-ID'), now.toLocaleTimeString('id-ID'));
    return res.json({ success: true, message: 'Setoran berhasil dikirim! Menunggu konfirmasi admin.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.cekStatus = (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.json({ success: false, message: 'Masukkan Nama Discord atau Nomor WA!' });
    const q = query.trim();
    const results = getDb().prepare('SELECT * FROM setoran WHERE nama_discord = ? OR nomor_wa = ? ORDER BY id DESC LIMIT 10').all(q, q);
    if (results.length === 0) return res.json({ success: false, message: 'Data tidak ditemukan!' });
    return res.json({ success: true, data: results });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getOpenStatus = (req, res) => {
  const db = getDb();
  const openRow = db.prepare("SELECT value FROM settings WHERE key = 'open_time'").get();
  const closeRow = db.prepare("SELECT value FROM settings WHERE key = 'close_time'").get();
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = (openRow.value || '08:00').split(':').map(Number);
  const [closeH, closeM] = (closeRow.value || '17:00').split(':').map(Number);
  res.json({ isOpen: currentTime >= (openH * 60 + openM) && currentTime < (closeH * 60 + closeM), openTime: openRow.value, closeTime: closeRow.value });
};
