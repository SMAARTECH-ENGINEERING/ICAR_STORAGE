import { http } from './client';

export const alertApi = {
  list: (params) => http.get('/alerts', { params }).then((r) => r.data.data),
};

export default alertApi;
