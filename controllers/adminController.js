const { getDb } = require('../database/db');
const bcrypt = require('bcrypt');
const XSS = require('xss');

exports.loginPage = (req, res) => {
  res.render('index', { 
    title: 'FREELANCE AMANAH',
    error: null,
    layout: false
  });
};

exports.login = (req, res) => {
  try {
    const { password } = req.body;
    const db = getDb();
    const row = db.prepare('SELECT password_hash FROM admin_password ORDER BY id DESC LIMIT 1').get();
    if (!row) return res.status(401).json({ success: false, message: 'Password tidak ditemukan di database' });
    const valid = bcrypt.compareSync(password, row.password_hash);
    if (valid) {
      req.session.isAdmin = true;
      return res.json({ success: true, redirect: '/admin/dashboard' });
    }
    return res.status(401).json({ success: false, message: 'Password salah!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

exports.dashboard = (req, res) => {
  const db = getDb();
  const totalSetoran = db.prepare('SELECT COUNT(*) as total FROM setoran').get().total;
  const pending = db.prepare("SELECT COUNT(*) as total FROM setoran WHERE status = 'Pending'").get().total;
  const accepted = db.prepare("SELECT COUNT(*) as total FROM setoran WHERE status = 'Accepted'").get().total;
  const denied = db.prepare("SELECT COUNT(*) as total FROM setoran WHERE status = 'Denied'").get().total;
  const hargaRow = db.prepare("SELECT value FROM settings WHERE key = 'harga_bayaran'").get();
  const harga = hargaRow ? parseInt(hargaRow.value) || 5000 : 5000;
  const totalBayaran = accepted * harga;
  const history = db.prepare('SELECT * FROM history_reset ORDER BY id DESC LIMIT 20').all();
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  res.render('admin/dashboard', {
    title: 'Dashboard Admin - FREELANCE AMANAH',
    stats: { totalSetoran, pending, accepted, denied, totalBayaran },
    history, dateStr, layout: 'admin/layout'
  });
};

exports.getStats = (req, res) => {
  const db = getDb();
  const totalSetoran = db.prepare('SELECT COUNT(*) as total FROM setoran').get().total;
  const pending = db.prepare("SELECT COUNT(*) as total FROM setoran WHERE status = 'Pending'").get().total;
  const accepted = db.prepare("SELECT COUNT(*) as total FROM setoran WHERE status = 'Accepted'").get().total;
  const denied = db.prepare("SELECT COUNT(*) as total FROM setoran WHERE status = 'Denied'").get().total;
  const hargaRow = db.prepare("SELECT value FROM settings WHERE key = 'harga_bayaran'").get();
  const harga = hargaRow ? parseInt(hargaRow.value) || 5000 : 5000;
  res.json({ totalSetoran, pending, accepted, denied, totalBayaran: accepted * harga });
};

exports.resetSetoran = (req, res) => {
  try {
    const db = getDb();
    const now = new Date();
    const tanggal = now.toLocaleDateString('id-ID');
    const jam = now.toLocaleTimeString('id-ID');
    const totalSetoran = db.prepare('SELECT COUNT(*) as total FROM setoran').get().total;
    const pending = db.prepare("SELECT COUNT(*) as total FROM setoran WHERE status = 'Pending'").get().total;
    const accepted = db.prepare("SELECT COUNT(*) as total FROM setoran WHERE status = 'Accepted'").get().total;
    const dataSebelum = `Total: ${totalSetoran}, Pending: ${pending}, Accepted: ${accepted}`;
    db.prepare("DELETE FROM setoran WHERE status IN ('Pending', 'Accepted', 'Denied')").run();
    db.prepare('INSERT INTO history_reset (tanggal, jam, data_sebelum) VALUES (?, ?, ?)').run(tanggal, jam, dataSebelum);
    res.json({ success: true, message: 'Reset berhasil!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.settingsPage = (req, res) => {
  const db = getDb();
  const settings = {};
  const rows = db.prepare('SELECT key, value FROM settings').all();
  rows.forEach(r => { settings[r.key] = r.value; });
  res.render('admin/settings', { title: 'Pengaturan - FREELANCE AMANAH', settings, success: null, error: null, layout: 'admin/layout' });
};

exports.changePassword = (req, res) => {
  try {
    const { old_password, new_password, confirm_password } = req.body;
    const db = getDb();
    if (new_password !== confirm_password) return res.json({ success: false, message: 'Konfirmasi password tidak cocok!' });
    if (new_password.length < 4) return res.json({ success: false, message: 'Password baru minimal 4 karakter!' });
    const row = db.prepare('SELECT password_hash FROM admin_password ORDER BY id DESC LIMIT 1').get();
    if (!row) return res.json({ success: false, message: 'Password tidak ditemukan!' });
    if (!bcrypt.compareSync(old_password, row.password_hash)) return res.json({ success: false, message: 'Password lama salah!' });
    db.prepare('INSERT INTO admin_password (password_hash) VALUES (?)').run(bcrypt.hashSync(new_password, 10));
    return res.json({ success: true, message: 'Password berhasil diganti!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateSettings = (req, res) => {
  try {
    const { open_time, close_time, catatan_bayaran, harga_bayaran } = req.body;
    const db = getDb();
    const update = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
    if (open_time) update.run(open_time, 'open_time');
    if (close_time) update.run(close_time, 'close_time');
    if (catatan_bayaran !== undefined) update.run(XSS(catatan_bayaran), 'catatan_bayaran');
    if (harga_bayaran) update.run(harga_bayaran, 'harga_bayaran');
    return res.json({ success: true, message: 'Pengaturan berhasil disimpan!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getServerTime = (req, res) => {
  const now = new Date();
  res.json({
    date: now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    time: now.toLocaleTimeString('id-ID', { hour12: false }),
    hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds(), iso: now.toISOString()
  });
};

exports.emailPage = (req, res) => {
  const db = getDb();
  const emails = db.prepare('SELECT * FROM email_list ORDER BY id DESC').all();
  res.render('admin/emails', { title: 'Data Email - FREELANCE AMANAH', emails, success: null, error: null, layout: 'admin/layout' });
};

exports.addEmail = (req, res) => {
  try {
    const { email } = req.body;
    const db = getDb();
    if (!email || !email.includes('@')) return res.json({ success: false, message: 'Email tidak valid!' });
    if (db.prepare('SELECT * FROM email_list WHERE email = ?').get(email.trim())) return res.json({ success: false, message: 'Email sudah terdaftar!' });
    db.prepare('INSERT INTO email_list (email) VALUES (?)').run(email.trim());
    return res.json({ success: true, message: 'Email berhasil ditambahkan!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.toggleEmail = (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const email = db.prepare('SELECT * FROM email_list WHERE id = ?').get(id);
    if (!email) return res.json({ success: false, message: 'Email tidak ditemukan!' });
    db.prepare('UPDATE email_list SET is_active = ? WHERE id = ?').run(email.is_active ? 0 : 1, id);
    return res.json({ success: true, message: 'Status email diubah!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteEmail = (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM email_list WHERE id = ?').run(req.params.id);
    return res.json({ success: true, message: 'Email dihapus!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getEmails = (req, res) => {
  res.json(getDb().prepare('SELECT * FROM email_list WHERE is_active = 1 ORDER BY email ASC').all());
};

exports.konfirmasiPage = (req, res) => {
  const db = getDb();
  const setoran = db.prepare('SELECT * FROM setoran ORDER BY id DESC').all();
  res.render('admin/konfirmasi', { title: 'Konfirmasi Setoran - FREELANCE AMANAH', setoran, layout: 'admin/layout' });
};

exports.getKonfirmasiData = (req, res) => {
  res.json(getDb().prepare('SELECT * FROM setoran ORDER BY id DESC').all());
};

exports.updateStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['Pending', 'Accepted', 'Denied'].includes(status)) return res.json({ success: false, message: 'Status tidak valid!' });
    getDb().prepare('UPDATE setoran SET status = ? WHERE id = ?').run(status, id);
    return res.json({ success: true, message: 'Status berhasil diupdate!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
