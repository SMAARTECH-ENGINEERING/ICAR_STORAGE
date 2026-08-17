const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/sensor-history', reportController.getSensorHistory);

module.exports = router;
