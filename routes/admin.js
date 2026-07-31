const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdminAuthenticated } = require('../middleware/auth');

router.post('/login', adminController.login);
router.get('/logout', adminController.logout);
router.get('/dashboard', isAdminAuthenticated, adminController.dashboard);
router.get('/api/stats', isAdminAuthenticated, adminController.getStats);
router.post('/api/reset-setoran', isAdminAuthenticated, adminController.resetSetoran);
router.get('/api/server-time', isAdminAuthenticated, adminController.getServerTime);
router.get('/settings', isAdminAuthenticated, adminController.settingsPage);
router.post('/api/change-password', isAdminAuthenticated, adminController.changePassword);
router.post('/api/update-settings', isAdminAuthenticated, adminController.updateSettings);
router.get('/emails', isAdminAuthenticated, adminController.emailPage);
router.post('/api/emails', isAdminAuthenticated, adminController.addEmail);
router.put('/api/emails/:id/toggle', isAdminAuthenticated, adminController.toggleEmail);
router.delete('/api/emails/:id', isAdminAuthenticated, adminController.deleteEmail);
router.get('/api/emails', isAdminAuthenticated, adminController.getEmails);
router.get('/konfirmasi', isAdminAuthenticated, adminController.konfirmasiPage);
router.get('/api/konfirmasi', isAdminAuthenticated, adminController.getKonfirmasiData);
router.put('/api/konfirmasi/:id', isAdminAuthenticated, adminController.updateStatus);

module.exports = router;
