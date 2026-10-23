import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useConvexAuth } from '@convex-dev/auth/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';

export type NotificationItem = {
  id: string;
  type: 'order' | 'price_drop' | 'worker' | 'stock' | 'review' | 'payment' | 'job' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon: string;
  actionRoute?: string;
};

type NotificationContextType = {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  addNotification: (notif: Omit<NotificationItem, 'id' | 'read'>) => void;
  loading: boolean;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const rows = useQuery(api.notifications.list, isAuthenticated ? { limit: 100 } : 'skip');
  const markRead = useMutation(api.notifications.markRead);
  const markAll = useMutation(api.notifications.markAllRead);
  const remove = useMutation(api.notifications.remove);
  const broadcast = useMutation(api.notifications.broadcast);

  const notifications = useMemo<NotificationItem[]>(
    () => (rows ?? []).map((n) => ({
      id: n._id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      timestamp: new Date(n.createdAt).toISOString(),
      icon: n.icon ?? 'notifications',
      actionRoute: n.actionRoute,
    })),
    [rows],
  );

  const value: NotificationContextType = {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    loading: isAuthenticated && rows === undefined,
    markAsRead: (id) => { void markRead({ id: id as Id<'notifications'> }); },
    markAllAsRead: () => { void markAll({}); },
    dismissNotification: (id) => { void remove({ id: id as Id<'notifications'> }); },
    addNotification: (notif) => {
      void broadcast({
        title: notif.title,
        message: notif.message,
        audience: 'all',
        type: notif.type,
        icon: notif.icon,
        actionRoute: notif.actionRoute,
      });
    },
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}
