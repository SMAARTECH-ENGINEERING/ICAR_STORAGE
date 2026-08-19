const express = require('express');
const relayController = require('../controllers/relayController');
const validate = require('../middleware/validate');
const { authenticate, authorizePermission } = require('../middleware/auth');
const { relayCommandSchema, automationRuleSchema } = require('../validators/relayValidator');

// mergeParams to access :deviceId from the parent router mount point
const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get('/', authorizePermission('relays:read'), relayController.listRelays);

router.get('/automation', authorizePermission('relays:read'), relayController.listAutomationRules);

router.post(
  '/:relayId/command',
  authorizePermission('relays:update'),
  validate(relayCommandSchema),
  relayController.sendRelayCommand
);
router.get('/:relayId/commands', authorizePermission('relays:read'), relayController.getRelayCommandHistory);

router.get('/:relayId/automation', authorizePermission('relays:read'), relayController.getAutomationRule);
router.put(
  '/:relayId/automation',
  authorizePermission('relays:update'),
  validate(automationRuleSchema),
  relayController.upsertAutomationRule
);

module.exports = router;
