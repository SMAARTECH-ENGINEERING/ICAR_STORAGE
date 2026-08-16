import { http } from './client';

export const authApi = {
  register: (payload) => http.post('/auth/register', payload, { skipAuth: true }).then((r) => r.data.data),
  login: (payload) => http.post('/auth/login', payload, { skipAuth: true }).then((r) => r.data.data),
  refresh: (refreshToken) =>
    http.post('/auth/refresh', { refreshToken }, { skipAuth: true }).then((r) => r.data.data),
  me: () => http.get('/auth/me').then((r) => r.data.data),
};

export default authApi;
