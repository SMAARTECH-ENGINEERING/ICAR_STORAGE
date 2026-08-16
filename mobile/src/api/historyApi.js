import { http } from './client';

export const historyApi = {
  getRoomHistory: (roomId, params) => http.get(`/rooms/${roomId}/history`, { params }).then((r) => r.data.data),
  getRelayCommandHistory: (deviceId, relayId, params) =>
    http.get(`/devices/${deviceId}/relays/${relayId}/commands`, { params }).then((r) => r.data.data),
};

export default historyApi;
