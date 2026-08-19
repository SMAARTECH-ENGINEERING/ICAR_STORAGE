const express = require('express');
const auditController = require('../controllers/auditController');
const { authenticate, authorizePermission } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorizePermission('audit-logs:read'));

router.get('/', auditController.listAuditLogs);

module.exports = router;
