import { http } from './client';

export const relayApi = {
  list: (deviceId) => http.get(`/devices/${deviceId}/relays`).then((r) => r.data.data),
  sendCommand: (deviceId, relayId, payload) =>
    http.post(`/devices/${deviceId}/relays/${relayId}/command`, payload).then((r) => r.data.data),
  commandHistory: (deviceId, relayId, params) =>
    http.get(`/devices/${deviceId}/relays/${relayId}/commands`, { params }).then((r) => r.data.data),
  listAutomationRules: (deviceId) =>
    http.get(`/devices/${deviceId}/relays/automation`).then((r) => r.data.data),
  getAutomationRule: (deviceId, relayId) =>
    http.get(`/devices/${deviceId}/relays/${relayId}/automation`).then((r) => r.data.data),
  upsertAutomationRule: (deviceId, relayId, payload) =>
    http.put(`/devices/${deviceId}/relays/${relayId}/automation`, payload).then((r) => r.data.data),
};

export default relayApi;
