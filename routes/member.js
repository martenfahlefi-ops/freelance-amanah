const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

router.get('/', memberController.memberPage);
router.post('/api/submit-setoran', memberController.submitSetoran);
router.post('/api/cek-status', memberController.cekStatus);
router.get('/api/open-status', memberController.getOpenStatus);

module.exports = router;
