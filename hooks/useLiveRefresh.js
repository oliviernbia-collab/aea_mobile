import { useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';

// Ecoute un ou plusieurs evenements temps reel (Socket.io) et rappelle `callback`
// a chaque diffusion, pour que les ecrans se rafraichissent automatiquement
// sans que l'utilisateur ait besoin de recharger.
export default function useLiveRefresh(events, callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const key = Array.isArray(events) ? events.join(',') : events;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const liste = Array.isArray(events) ? events : [events];
    const handler = (...args) => callbackRef.current(...args);
    liste.forEach((e) => socket.on(e, handler));

    return () => {
      liste.forEach((e) => socket.off(e, handler));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
