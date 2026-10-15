import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api, { TOKEN_KEY, USER_KEY, setUnauthorizedHandler } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

const BUREAU_ROLES = ['super_admin', 'president', 'tresorier', 'secretaire_general', 'resp_communication'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const userRef = useRef(null);
  userRef.current = user;

  const chargerPermissions = useCallback(async () => {
    try {
      const { data } = await api.get('/permissions/mine');
      setPermissions(data.permissions || {});
    } catch {
      setPermissions({});
    }
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setUser(null);
    setPermissions({});
    disconnectSocket();
  }, []);

  const refresh = useCallback(async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/moi');
      setUser(data);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data));
      await connectSocket();
      await chargerPermissions();
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [chargerPermissions]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // RN coupe souvent la connexion Socket.io en arriere-plan : on la retablit au retour
  // au premier plan (comportement absent du web, qui ne subit pas ce cycle de vie).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && userRef.current) connectSocket();
    });
    return () => sub.remove();
  }, []);

  const login = async (identifiant, password) => {
    const { data } = await api.post('/auth/connexion', { identifiant, password });
    if (data.requiresTwoFactor) {
      return { requiresTwoFactor: true, tempToken: data.tempToken };
    }
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    await connectSocket();
    await chargerPermissions();
    return { user: data.user };
  };

  const verifierCodeDeuxFA = async (tempToken, code) => {
    const { data } = await api.post('/auth/2fa/verifier', { tempToken, code });
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    await connectSocket();
    await chargerPermissions();
    return data.user;
  };

  const isBureau = user ? BUREAU_ROLES.includes(user.role) : false;
  const hasPermission = useCallback((key) => !!permissions[key], [permissions]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, verifierCodeDeuxFA, logout, refresh, isBureau, permissions, hasPermission, rechargerPermissions: chargerPermissions }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit etre utilise dans un AuthProvider.');
  return ctx;
}
