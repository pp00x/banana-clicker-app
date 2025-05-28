import { createContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'warning' | 'error' | 'info';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  closeNotification: (id: string) => void;
}

export const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  showNotification: () => {},
  closeNotification: () => {},
});

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback(
    ({ title, message, type, duration = 5000 }: Omit<Notification, 'id'>) => {
      const id = Date.now().toString();
      const notification = { id, title, message, type, duration };
      
      setNotifications((prev) => [...prev, notification]);

      if (duration > 0) {
        setTimeout(() => {
          closeNotification(id);
        }, duration);
      }
    },
    []
  );

  const closeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        closeNotification,
      }}
    >
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className={`p-4 rounded-lg shadow-lg backdrop-blur-md flex items-start gap-3 ${
                notification.type === 'success'
                  ? 'bg-success/90 text-white'
                  : notification.type === 'warning'
                  ? 'bg-warning/90 text-black'
                  : notification.type === 'error'
                  ? 'bg-error/90 text-white'
                  : 'bg-primary/90 text-white'
              }`}
            >
              <div className="flex-shrink-0 pt-0.5">
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : notification.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : notification.type === 'error' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{notification.title}</h3>
                <p className="text-sm">{notification.message}</p>
              </div>
              <button
                onClick={() => closeNotification(notification.id)}
                className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};