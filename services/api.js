import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const TOKEN_KEY = 'aea_token';
export const USER_KEY = 'aea_user';

const api = axios.create({ baseURL: process.env.EXPO_PUBLIC_API_URL });

let onUnauthorized = async () => {};

// Enregistre le gestionnaire appele a chaque 401 (branche par AuthContext sur son logout() reel).
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default api;
