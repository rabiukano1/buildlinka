import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { NOTIFICATIONS as MOCK_NOTIFICATIONS, type NotificationItem } from '../constants/MockData';

type NotificationContextType = {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  addNotification: (notif: Omit<NotificationItem, 'id' | 'read'>) => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

let notifIdCounter = 100;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const idCounter = useRef(notifIdCounter);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((notif: Omit<NotificationItem, 'id' | 'read'>) => {
    const id = 'n-admin-' + Date.now();
    setNotifications((prev) => [{ ...notif, id, read: false }, ...prev]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}
