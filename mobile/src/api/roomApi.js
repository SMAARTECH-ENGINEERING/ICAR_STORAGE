import { http } from './client';

export const roomApi = {
  list: (params) => http.get('/rooms', { params }).then((r) => r.data.data),
  get: (roomId) => http.get(`/rooms/${roomId}`).then((r) => r.data.data),
  create: (payload) => http.post('/rooms', payload).then((r) => r.data.data),
  update: (roomId, payload) => http.put(`/rooms/${roomId}`, payload).then((r) => r.data.data),
  remove: (roomId) => http.delete(`/rooms/${roomId}`).then((r) => r.data.data),
  devices: (roomId) => http.get(`/rooms/${roomId}/devices`).then((r) => r.data.data),
  current: (roomId) => http.get(`/rooms/${roomId}/current`).then((r) => r.data.data),
  history: (roomId, params) => http.get(`/rooms/${roomId}/history`, { params }).then((r) => r.data.data),
};

export default roomApi;
