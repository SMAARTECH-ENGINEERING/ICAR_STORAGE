import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { alertMeta } from '../utils/alertUtils';
import pushApi from '../api/pushApi';

// Remote delivery: the app registers an Expo push token, the backend stores
// it and relays through Expo's push service (which itself talks to FCM/APNs)
// whenever a new alert is raised — see server/src/services/pushService.js.
// This requires a custom dev client; Expo Go cannot register push tokens.
//
// Local scheduling (notifyAlert) is kept as a complementary, always-available
// path: instant, no network round-trip, works purely off the socket event
// already being received while the app is in the foreground.
const ALERT_CHANNEL_ID = 'alerts';

// expo-notifications' own package code runs a top-level side effect
// (auto push-token registration) the instant it's imported, and on Android
// that side effect unconditionally THROWS when running inside Expo Go
// (removed there in SDK 53) — before any of our own code gets a chance to
// guard against it. A plain `import * as Notifications from 'expo-notifications'`
// at the top of this file would therefore crash the whole app on launch.
// The only way around a package-level import side effect is to never
// import the module at all on this specific platform/host combination, so
// the module is loaded lazily via require() and only on hosts where it's safe.
const IS_EXPO_GO = Constants.appOwnership === 'expo';
const NOTIFICATIONS_SUPPORTED = !(IS_EXPO_GO && Platform.OS === 'android');

let NotificationsModule;
function getNotifications() {
  if (!NOTIFICATIONS_SUPPORTED) return null;
  if (NotificationsModule === undefined) {
    // eslint-disable-next-line global-require
    NotificationsModule = require('expo-notifications');
    NotificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
  return NotificationsModule;
}

let configured = false;

export async function configureNotifications() {
  const Notifications = getNotifications();
  if (!Notifications || configured) return;
  configured = true;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ALERT_CHANNEL_ID, {
      name: 'Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#16A34A',
      sound: 'default',
    });
  }
}

// 'granted' | 'denied' | 'undetermined' | 'unsupported' (Expo Go on Android —
// see the note above; there is no permission to check because the module is
// never loaded there).
export async function getNotificationPermissionStatus() {
  const Notifications = getNotifications();
  if (!Notifications) return 'unsupported';
  const res = await Notifications.getPermissionsAsync();
  return res.status;
}

export async function requestNotificationPermissions() {
  const Notifications = getNotifications();
  if (!Notifications) return false;

  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const result = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return result.granted;
}

let registeredToken = null;

// No-ops when notifications aren't supported on this host (Expo Go on
// Android — see above), or the project hasn't been linked with `eas init`
// yet (that's what supplies extra.eas.projectId in app config).
export async function registerForPushNotificationsAsync() {
  const Notifications = getNotifications();
  if (!Notifications) return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    if (__DEV__) {
      console.warn('[push] Skipping push token registration — no EAS projectId yet. Run `eas init` to enable it.');
    }
    return null;
  }

  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (token === registeredToken) return token;
    await pushApi.register(token, Platform.OS);
    registeredToken = token;
    return token;
  } catch (err) {
    if (__DEV__) console.warn('[push] Failed to register push token:', err.message);
    return null;
  }
}

export async function unregisterPushToken() {
  if (!registeredToken) return;
  try {
    await pushApi.remove(registeredToken);
  } catch {
    // Best-effort on logout — an orphaned token is harmless.
  } finally {
    registeredToken = null;
  }
}

export async function notifyAlert(alert, { roomName } = {}) {
  const Notifications = getNotifications();
  if (!Notifications) return;

  const meta = alertMeta(alert.type);
  const bodyParts = [roomName || alert.roomId];
  if (alert.parameter) bodyParts.push(`${alert.parameter} sensor`);
  if (typeof alert.value === 'number') bodyParts.push(`${alert.value}`);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: meta.label,
      body: bodyParts.filter(Boolean).join(' • '),
      data: { type: 'alert', alertId: alert._id, roomId: alert.roomId },
      sound: 'default',
    },
    trigger: Platform.OS === 'android' ? { channelId: ALERT_CHANNEL_ID } : null,
  });
}

export function addNotificationResponseListener(handler) {
  const Notifications = getNotifications();
  if (!Notifications) return () => {};

  const sub = Notifications.addNotificationResponseReceivedListener(handler);
  return () => sub.remove();
}

export default {
  configureNotifications,
  getNotificationPermissionStatus,
  requestNotificationPermissions,
  registerForPushNotificationsAsync,
  unregisterPushToken,
  notifyAlert,
  addNotificationResponseListener,
};
