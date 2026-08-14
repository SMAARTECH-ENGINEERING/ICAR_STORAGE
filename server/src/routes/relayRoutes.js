const express = require('express');
const relayController = require('../controllers/relayController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');
const { relayCommandSchema, automationRuleSchema } = require('../validators/relayValidator');

// mergeParams to access :deviceId from the parent router mount point
const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get('/', relayController.listRelays);

router.get('/automation', relayController.listAutomationRules);

router.post(
  '/:relayId/command',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(relayCommandSchema),
  relayController.sendRelayCommand
);
router.get('/:relayId/commands', relayController.getRelayCommandHistory);

router.get('/:relayId/automation', relayController.getAutomationRule);
router.put(
  '/:relayId/automation',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(automationRuleSchema),
  relayController.upsertAutomationRule
);

module.exports = router;
