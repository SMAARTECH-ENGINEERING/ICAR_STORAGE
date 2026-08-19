const express = require('express');
const userController = require('../controllers/userController');
const validate = require('../middleware/validate');
const { authenticate, authorizePermission } = require('../middleware/auth');
const { assignRoleSchema } = require('../validators/userValidator');

const router = express.Router();

router.use(authenticate);
router.use(authorizePermission('admin:manage'));

router.get('/', userController.listUsers);
router.put('/:userId/role', validate(assignRoleSchema), userController.assignRole);

module.exports = router;
