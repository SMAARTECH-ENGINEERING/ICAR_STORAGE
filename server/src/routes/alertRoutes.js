const express = require('express');
const alertController = require('../controllers/alertController');
const { authenticate, authorizePermission } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', authorizePermission('alerts:read'), alertController.listAlerts);
router.patch('/:alertId/resolve', authorizePermission('alerts:update'), alertController.resolveAlert);

module.exports = router;
