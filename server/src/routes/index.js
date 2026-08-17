const express = require('express');
const authRoutes = require('./authRoutes');
const roomRoutes = require('./roomRoutes');
const deviceRoutes = require('./deviceRoutes');
const alertRoutes = require('./alertRoutes');
const reportRoutes = require('./reportRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'OK', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/devices', deviceRoutes);
router.use('/alerts', alertRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
