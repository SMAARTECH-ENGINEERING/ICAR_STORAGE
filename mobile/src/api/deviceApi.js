import { http } from './client';

export const deviceApi = {
  list: (params) => http.get('/devices', { params }).then((r) => r.data.data),
  get: (deviceId) => http.get(`/devices/${deviceId}`).then((r) => r.data.data),
  create: (payload) => http.post('/devices', payload).then((r) => r.data.data),
  update: (deviceId, payload) => http.put(`/devices/${deviceId}`, payload).then((r) => r.data.data),
  remove: (deviceId) => http.delete(`/devices/${deviceId}`).then((r) => r.data.data),
};

export default deviceApi;
