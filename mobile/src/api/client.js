import axios from 'axios';
import { API_URL } from '../utils/env';
import { getAccessToken, getRefreshToken, setTokens, clearAuthStorage } from '../services/storageService';

export const http = axios.create({ baseURL: API_URL, timeout: 15000 });

let unauthorizedHandler = () => {};
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

http.interceptors.request.use(async (config) => {
  if (!config.skipAuth) {
    const token = await getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');
  const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
  const tokens = res.data?.data;
  await setTokens(tokens);
  return tokens.accessToken;
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    const status = response?.status;
    const data = response?.data;

    if (status === 401 && config && !config.skipAuth && !config._retried) {
      config._retried = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        config.headers.Authorization = `Bearer ${newToken}`;
        return http(config);
      } catch {
        await clearAuthStorage();
        unauthorizedHandler();
      }
    }

    const message = data?.message || error.message || 'Something went wrong';
    const normalized = new Error(message);
    normalized.status = status;
    normalized.errorCode = data?.errorCode;
    normalized.details = data?.details;
    normalized.isNetworkError = !response;
    return Promise.reject(normalized);
  }
);

export default http;
