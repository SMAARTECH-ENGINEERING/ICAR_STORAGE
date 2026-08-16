import { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../services/socketService';
import { useAuth } from './AuthContext';
import { getAccessToken } from '../services/storageService';

const SocketContext = createContext({ status: 'disconnected' });

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState('disconnected');

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!isAuthenticated) {
        socketService.disconnect();
        return;
      }
      const token = await getAccessToken();
      if (cancelled) return;
      socketService.connect(token);
    }

    start();
    const unsubscribe = socketService.onStatusChange(setStatus);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) socketService.disconnect();
  }, [isAuthenticated]);

  return <SocketContext.Provider value={{ status }}>{children}</SocketContext.Provider>;
}

export function useSocketStatus() {
  return useContext(SocketContext).status;
}

export default SocketContext;
