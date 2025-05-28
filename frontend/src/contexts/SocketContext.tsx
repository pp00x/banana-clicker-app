import { createContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emitBananaClick: () => void;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  emitBananaClick: () => {},
});

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token, isAuthenticated, updateUserBananaCount, logout } = useAuth();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      showNotification({
        title: 'Connected',
        message: 'Real-time connection established',
        type: 'success',
      });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      showNotification({
        title: 'Disconnected',
        message: 'Real-time connection lost',
        type: 'warning',
      });
    });

    socketInstance.on('error', (error) => {
      showNotification({
        title: 'Connection Error',
        message: error.message || 'Failed to connect to server',
        type: 'error',
      });
    });

    // Handle player score updates
    socketInstance.on('player_score_update', (data: { userId: string; bananaCount: number }) => {
      if (data.userId === user?._id) {
        updateUserBananaCount(data.bananaCount);
      }
    });

    // Handle user status updates
    socketInstance.on('user_status_update', (_data: { userId: string; isOnline: boolean }) => {
      // This event is handled in AdminActivityMonitorPage
      // to update user online status in real-time
    });

    // Handle rank updates
    socketInstance.on('rank_update', (_data: { rankings: Array<{ userId: string; rank: number }> }) => {
      // This event is handled in PlayerRankPage
      // to update rankings in real-time
    });

    // Handle force logout
    socketInstance.on('force_logout', () => {
      showNotification({
        title: 'Session Expired',
        message: 'You have been logged out by the server',
        type: 'error',
      });
      logout();
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, token, user?._id]);

  const emitBananaClick = () => {
    if (socket && isConnected) {
      socket.emit('banana_click');
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        emitBananaClick,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};