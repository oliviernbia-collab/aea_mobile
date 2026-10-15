import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY } from './api';

let socket = null;

export async function connectSocket() {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) return null;
  if (socket?.connected) return socket;

  socket = io(process.env.EXPO_PUBLIC_SOCKET_URL, {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
