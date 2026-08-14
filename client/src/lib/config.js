const KEYS = {
  API_BASE_URL: 'icar_api_base_url',
  DEVICE_API_KEY: 'icar_device_api_key',
  ACCESS_TOKEN: 'icar_access_token',
  USER: 'icar_user',
};

const BUILD_DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const DEFAULT_DEVICE_API_KEY = 'change_this_shared_device_key';

export function getApiBaseUrl() {
  return localStorage.getItem(KEYS.API_BASE_URL) || BUILD_DEFAULT_API_BASE_URL;
}

export function setApiBaseUrl(url) {
  localStorage.setItem(KEYS.API_BASE_URL, url.trim().replace(/\/+$/, ''));
}

// Socket.IO is mounted on the same HTTP server as the API, at the origin
// root (not under /api/v1), so this strips the API path back to the origin.
export function getSocketBaseUrl() {
  try {
    return new URL(getApiBaseUrl()).origin;
  } catch {
    return 'http://localhost:5000';
  }
}

export function getDeviceApiKey() {
  return localStorage.getItem(KEYS.DEVICE_API_KEY) || DEFAULT_DEVICE_API_KEY;
}

export function setDeviceApiKey(key) {
  localStorage.setItem(KEYS.DEVICE_API_KEY, key.trim());
}

export function getToken() {
  return localStorage.getItem(KEYS.ACCESS_TOKEN) || '';
}

export function setToken(token) {
  if (token) localStorage.setItem(KEYS.ACCESS_TOKEN, token);
  else localStorage.removeItem(KEYS.ACCESS_TOKEN);
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.USER) || 'null');
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) localStorage.setItem(KEYS.USER, JSON.stringify(user));
  else localStorage.removeItem(KEYS.USER);
}

export function clearAuth() {
  setToken(null);
  setStoredUser(null);
}
