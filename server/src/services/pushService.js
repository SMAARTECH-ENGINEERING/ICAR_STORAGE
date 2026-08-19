const PushToken = require('../models/PushToken');
const User = require('../models/User');
const logger = require('../config/logger');
const roleService = require('./roleService');

// Delivery goes through Expo's push relay, not Firebase directly — the
// mobile app registers an Expo push token (obtained via
// getExpoPushTokenAsync, which itself relays through FCM/APNs once EAS
// credentials are configured). The backend never talks to Firebase.
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const ALERT_TITLES = {
  HIGH_TEMPERATURE: 'High Temperature',
  HIGH_HUMIDITY: 'High Humidity',
  HIGH_CO2: 'High CO2',
  DEVICE_OFFLINE: 'Device Offline',
  SENSOR_FAILURE: 'Sensor Failure',
  RELAY_FAILURE: 'Relay Failure',
};

async function registerToken(userId, token, platform) {
  return PushToken.findOneAndUpdate(
    { token },
    { $set: { userId, platform } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function removeToken(userId, token) {
  return PushToken.deleteOne({ userId, token });
}

async function sendExpoPushMessages(messages) {
  if (!messages.length) return;
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      logger.warn('Expo push send failed with status %d', res.status);
    }
  } catch (err) {
    logger.error('Expo push send error: %s', err.message);
  }
}

function alertBody(alert) {
  const parts = [alert.roomId];
  if (alert.parameter) parts.push(alert.parameter);
  if (typeof alert.value === 'number') parts.push(String(alert.value));
  return parts.join(' • ');
}

// Best-effort — failures are logged, never thrown, so a push delivery
// problem can never break alert creation itself (the caller does not await this).
async function notifyAlertCreated(alert) {
  try {
    // Whoever can act on alerts today gets notified — dynamic, so a custom
    // role granted alerts:update starts receiving pushes automatically.
    const roleNames = await roleService.getRoleNamesWithPermission('alerts:update');
    if (!roleNames.length) return;
    const managers = await User.find({
      role: { $in: roleNames },
      active: true,
    }).select('userId');
    const userIds = managers.map((u) => u.userId);
    if (!userIds.length) return;

    const tokens = await PushToken.find({ userId: { $in: userIds } });
    if (!tokens.length) return;

    const messages = tokens.map((t) => ({
      to: t.token,
      title: ALERT_TITLES[alert.type] || alert.type,
      body: alertBody(alert),
      sound: 'default',
      channelId: 'alerts',
      data: { type: 'alert', alertId: String(alert._id), roomId: alert.roomId },
    }));

    await sendExpoPushMessages(messages);
  } catch (err) {
    logger.error('notifyAlertCreated failed: %s', err.message);
  }
}

module.exports = { registerToken, removeToken, notifyAlertCreated };
