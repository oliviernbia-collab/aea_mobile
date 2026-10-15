import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'aea_theme';

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      const isDark = saved === 'dark';
      setDark(isDark);
      colorScheme.set(isDark ? 'dark' : 'light');
      setReady(true);
    });
  }, []);

  const toggleDark = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      colorScheme.set(next ? 'dark' : 'light');
      AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  if (!ready) return null;

  return <ThemeContext.Provider value={{ dark, toggleDark }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme doit etre utilise dans un ThemeProvider.');
  return ctx;
}
