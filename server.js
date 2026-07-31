const express = require('express');
const session = require('express-session');
const path = require('path');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== SECURITY ====================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "code.jquery.com"],
      fontSrc: ["'self'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "cdn.jsdelivr.net"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));

// ==================== SESSION ====================
app.use(session({
  secret: 'freelance-amanah-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false
  }
}));

// ==================== BODY PARSER ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== STATIC FILES ====================
app.use(express.static(path.join(__dirname, 'public')));

// ==================== VIEW ENGINE ====================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==================== ROUTES ====================
const adminRoutes = require('./routes/admin');
const memberRoutes = require('./routes/member');

app.use('/admin', adminRoutes);
app.use('/member', memberRoutes);

// Home page
app.get('/', (req, res) => {
  res.render('index', {
    title: 'FREELANCE AMANAH',
    error: null,
    layout: false
  });
});

// 404
app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Tidak Ditemukan', layout: false });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});

// ==================== AUTO RESET EVERY MIDNIGHT ====================
const { getDb } = require('./database/db');

function scheduleMidnightReset() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight - now;

  setTimeout(() => {
    try {
      const db = getDb();
      const totalSetoran = db.prepare('SELECT COUNT(*) as total FROM setoran').get().total;
      const tanggal = new Date().toLocaleDateString('id-ID');
      const jam = new Date().toLocaleTimeString('id-ID');

      db.prepare("DELETE FROM setoran WHERE status IN ('Pending', 'Accepted', 'Denied')").run();
      db.prepare('INSERT INTO history_reset (tanggal, jam, data_sebelum) VALUES (?, ?, ?)').run(
        tanggal,
        jam,
        `Auto-reset: Total Setoran = ${totalSetoran}`
      );

      console.log(`🔄 [AUTO-RESET] ${tanggal} ${jam} - Total Setoran direset: ${totalSetoran}`);
    } catch (err) {
      console.error('Auto-reset error:', err);
    }

    scheduleMidnightReset();
  }, msUntilMidnight);

  console.log(`⏰ Auto-reset dijadwalkan dalam ${Math.floor(msUntilMidnight / 1000 / 60)} menit`);
}

// ==================== START SERVER ====================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ FREELANCE AMANAH server berjalan di http://localhost:${PORT}`);
  console.log(`🌐 Admin: http://localhost:${PORT}/`);
  console.log(`👤 Member: http://localhost:${PORT}/member`);
  scheduleMidnightReset();
});

module.exports = app;
