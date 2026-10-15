import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

const ToastContext = createContext(null);

const STYLES = {
  succes: { icon: 'circle-check', className: 'bg-green-600' },
  erreur: { icon: 'circle-exclamation', className: 'bg-red-600' },
  info: { icon: 'circle-info', className: 'bg-blue-800' },
};

function Toast({ toast, onDone }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const style = STYLES[toast.type] || STYLES.info;

  useState(() => {
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timeout = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => onDone(toast.id));
    }, 3500);
    return () => clearTimeout(timeout);
  });

  return (
    <Animated.View
      style={{ opacity }}
      className={`flex-row items-center gap-2 rounded-lg px-4 py-3 shadow-lg ${style.className}`}
    >
      <FontAwesome6 name={style.icon} size={16} color="#fff" />
      <Text className="text-sm text-white flex-1">{toast.message}</Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'succes') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <View style={{ flex: 1 }}>
        {children}
        <View pointerEvents="box-none" className="absolute bottom-6 left-4 right-4 gap-2">
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onDone={removeToast} />
          ))}
        </View>
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit etre utilise dans un ToastProvider.');
  return ctx;
}
