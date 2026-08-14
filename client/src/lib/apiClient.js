import axios from "axios";
import { getApiBaseUrl, getToken } from "./config";

export const http = axios.create();

http.interceptors.request.use((cfg) => {
  cfg.baseURL = getApiBaseUrl();
  const token = getToken();
  if (token && !cfg.skipAuth) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

let unauthorizedHandler = () => {};
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

http.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const message = data?.message || error.message || "Request failed";
    const normalized = new Error(message);
    normalized.status = status;
    normalized.errorCode = data?.errorCode;
    normalized.details = data?.details;
    if (status === 401) {
      unauthorizedHandler();
    }
    return Promise.reject(normalized);
  },
);

// Every function below returns the backend's response envelope as-is:
// { success, message?, data }. Routes/shapes match server/src/routes/*.js exactly.
export const api = {
  register: (payload) =>
    http
      .post("/auth/register", payload, { skipAuth: true })
      .then((r) => r.data),
  login: (payload) =>
    http.post("/auth/login", payload, { skipAuth: true }).then((r) => r.data),
  me: () => http.get("/auth/me").then((r) => r.data),

  listRooms: (params) => http.get("/rooms", { params }).then((r) => r.data),
  createRoom: (payload) => http.post("/rooms", payload).then((r) => r.data),
  getRoom: (roomId) => http.get(`/rooms/${roomId}`).then((r) => r.data),
  updateRoom: (roomId, payload) =>
    http.put(`/rooms/${roomId}`, payload).then((r) => r.data),
  deleteRoom: (roomId) => http.delete(`/rooms/${roomId}`).then((r) => r.data),
  getRoomDevices: (roomId) =>
    http.get(`/rooms/${roomId}/devices`).then((r) => r.data),
  getRoomCurrent: (roomId) =>
    http.get(`/rooms/${roomId}/current`).then((r) => r.data),
  getRoomHistory: (roomId, params) =>
    http.get(`/rooms/${roomId}/history`, { params }).then((r) => r.data),

  listDevices: (params) => http.get("/devices", { params }).then((r) => r.data),
  createDevice: (payload) => http.post("/devices", payload).then((r) => r.data),
  getDevice: (deviceId) => http.get(`/devices/${deviceId}`).then((r) => r.data),
  updateDevice: (deviceId, payload) =>
    http.put(`/devices/${deviceId}`, payload).then((r) => r.data),
  deleteDevice: (deviceId) =>
    http.delete(`/devices/${deviceId}`).then((r) => r.data),

  sendTelemetry: (payload, deviceApiKey) =>
    http
      .post("/devices/telemetry", payload, {
        skipAuth: true,
        headers: { "x-device-key": deviceApiKey },
      })
      .then((r) => r.data),

  // Device-authenticated (x-device-key), mirrors what real device firmware
  // would call to poll for and acknowledge relay commands.
  getPendingCommands: (deviceId, deviceApiKey) =>
    http
      .get(`/devices/${deviceId}/commands/pending`, {
        skipAuth: true,
        headers: { "x-device-key": deviceApiKey },
      })
      .then((r) => r.data),
  acknowledgeCommand: (deviceId, commandId, payload, deviceApiKey) =>
    http
      .post(`/devices/${deviceId}/commands/${commandId}/ack`, payload, {
        skipAuth: true,
        headers: { "x-device-key": deviceApiKey },
      })
      .then((r) => r.data),

  listRelays: (deviceId) =>
    http.get(`/devices/${deviceId}/relays`).then((r) => r.data),
  sendRelayCommand: (deviceId, relayId, payload) =>
    http
      .post(`/devices/${deviceId}/relays/${relayId}/command`, payload)
      .then((r) => r.data),
  getRelayCommandHistory: (deviceId, relayId, params) =>
    http
      .get(`/devices/${deviceId}/relays/${relayId}/commands`, { params })
      .then((r) => r.data),
  getAutomationRule: (deviceId, relayId) =>
    http
      .get(`/devices/${deviceId}/relays/${relayId}/automation`)
      .then((r) => r.data),
  upsertAutomationRule: (deviceId, relayId, payload) =>
    http
      .put(`/devices/${deviceId}/relays/${relayId}/automation`, payload)
      .then((r) => r.data),

  listAlerts: (params) => http.get("/alerts", { params }).then((r) => r.data),
};
