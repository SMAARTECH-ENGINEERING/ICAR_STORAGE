const express = require('express');
const roomController = require('../controllers/roomController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');
const { createRoomSchema, updateRoomSchema } = require('../validators/roomValidator');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(createRoomSchema), roomController.createRoom);
router.get('/', roomController.listRooms);
router.get('/:roomId', roomController.getRoom);
router.put(
  '/:roomId',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(updateRoomSchema),
  roomController.updateRoom
);
router.delete('/:roomId', authorize(ROLES.SUPER_ADMIN), roomController.deleteRoom);

router.get('/:roomId/devices', roomController.getRoomDevices);
router.get('/:roomId/current', roomController.getRoomCurrent);
router.get('/:roomId/history', roomController.getRoomHistory);

module.exports = router;
