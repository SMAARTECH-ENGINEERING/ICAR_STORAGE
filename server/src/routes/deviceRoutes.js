const express = require('express');
const deviceController = require('../controllers/deviceController');
const relayRoutes = require('./relayRoutes');
const validate = require('../middleware/validate');
const { authenticate, authorizePermission, authenticateDevice } = require('../middleware/auth');
const { createDeviceSchema, updateDeviceSchema } = require('../validators/deviceValidator');
const { commandAckSchema } = require('../validators/relayValidator');

const router = express.Router();

// Device-authenticated endpoints (shared device key, not user JWT).
// Registered before the user-auth gate below so they are never subject to it.
router.post('/telemetry', authenticateDevice, deviceController.postTelemetry);
router.get('/:deviceId/commands/pending', authenticateDevice, deviceController.getPendingCommands);
router.post(
  '/:deviceId/commands/:commandId/ack',
  authenticateDevice,
  validate(commandAckSchema),
  deviceController.acknowledgeCommand
);

router.use(authenticate);

router.post(
  '/',
  authorizePermission('devices:create'),
  validate(createDeviceSchema),
  deviceController.createDevice
);
router.get('/', authorizePermission('devices:read'), deviceController.listDevices);
router.get('/:deviceId', authorizePermission('devices:read'), deviceController.getDevice);
router.put(
  '/:deviceId',
  authorizePermission('devices:update'),
  validate(updateDeviceSchema),
  deviceController.updateDevice
);
router.delete('/:deviceId', authorizePermission('devices:delete'), deviceController.deleteDevice);

router.use('/:deviceId/relays', relayRoutes);

module.exports = router;
