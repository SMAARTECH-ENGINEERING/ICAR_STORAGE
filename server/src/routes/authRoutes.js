const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  registerPushTokenSchema,
  removePushTokenSchema,
} = require('../validators/authValidator');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.get('/me', authenticate, authController.me);
router.post('/push-token', authenticate, validate(registerPushTokenSchema), authController.registerPushToken);
router.delete('/push-token', authenticate, validate(removePushTokenSchema), authController.removePushToken);

module.exports = router;
