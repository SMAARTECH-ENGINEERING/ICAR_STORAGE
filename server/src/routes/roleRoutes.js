const express = require('express');
const roleController = require('../controllers/roleController');
const validate = require('../middleware/validate');
const { authenticate, authorizePermission } = require('../middleware/auth');
const { createRoleSchema, updateRoleSchema } = require('../validators/roleValidator');

const router = express.Router();

router.use(authenticate);
router.use(authorizePermission('admin:manage'));

router.get('/permissions', roleController.listPermissions);

router.get('/', roleController.listRoles);
router.post('/', validate(createRoleSchema), roleController.createRole);
router.get('/:roleId', roleController.getRole);
router.put('/:roleId', validate(updateRoleSchema), roleController.updateRole);
router.delete('/:roleId', roleController.deleteRole);

module.exports = router;
