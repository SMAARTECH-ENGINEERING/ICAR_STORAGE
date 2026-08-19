import { http } from './client';

export const pushApi = {
  register: (token, platform) => http.post('/auth/push-token', { token, platform }).then((r) => r.data),
  remove: (token) => http.delete('/auth/push-token', { data: { token } }).then((r) => r.data),
};

export default pushApi;
