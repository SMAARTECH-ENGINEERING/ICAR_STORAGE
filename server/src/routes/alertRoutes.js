const express = require('express');
const alertController = require('../controllers/alertController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', alertController.listAlerts);

module.exports = router;
