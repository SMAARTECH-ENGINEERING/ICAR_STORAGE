const express = require('express');
const roomController = require('../controllers/roomController');
const validate = require('../middleware/validate');
const { authenticate, authorizePermission } = require('../middleware/auth');
const { createRoomSchema, updateRoomSchema } = require('../validators/roomValidator');

const router = express.Router();

router.use(authenticate);

router.post('/', authorizePermission('rooms:create'), validate(createRoomSchema), roomController.createRoom);
router.get('/', authorizePermission('rooms:read'), roomController.listRooms);
router.get('/:roomId', authorizePermission('rooms:read'), roomController.getRoom);
router.put(
  '/:roomId',
  authorizePermission('rooms:update'),
  validate(updateRoomSchema),
  roomController.updateRoom
);
router.delete('/:roomId', authorizePermission('rooms:delete'), roomController.deleteRoom);

router.get('/:roomId/devices', authorizePermission('rooms:read'), roomController.getRoomDevices);
router.get('/:roomId/current', authorizePermission('rooms:read'), roomController.getRoomCurrent);
router.get('/:roomId/history', authorizePermission('rooms:read'), roomController.getRoomHistory);

module.exports = router;
