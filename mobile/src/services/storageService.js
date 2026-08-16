import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'icar_access_token';
const REFRESH_TOKEN_KEY = 'icar_refresh_token';
const USER_KEY = 'icar_user';

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setTokens({ accessToken, refreshToken }) {
  const ops = [];
  if (accessToken) ops.push(SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken));
  if (refreshToken) ops.push(SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken));
  await Promise.all(ops);
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

export async function getStoredUser() {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setStoredUser(user) {
  if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  else await AsyncStorage.removeItem(USER_KEY);
}

export async function clearAuthStorage() {
  await clearTokens();
  await setStoredUser(null);
}
