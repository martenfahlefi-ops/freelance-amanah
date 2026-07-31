const xss = require('xss');

function sanitizeInput(obj) {
  if (typeof obj === 'string') return xss(obj.trim());
  if (typeof obj === 'object' && obj !== null) {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = sanitizeInput(value);
    }
    return cleaned;
  }
  return obj;
}

function isAdminAuthenticated(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  if (req.headers['x-requested-with'] === 'XMLHttpRequest' || req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.redirect('/');
}

function isMemberAuthenticated(req, res, next) {
  next();
}

module.exports = { sanitizeInput, isAdminAuthenticated, isMemberAuthenticated };
