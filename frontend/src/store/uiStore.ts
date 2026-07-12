import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  link?: string;
}

interface UIState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  notificationDrawerOpen: boolean;
  notifications: Notification[];
  globalSearchQuery: string;
  setTheme: (t: 'light' | 'dark') => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleNotificationDrawer: () => void;
  setNotificationDrawerOpen: (v: boolean) => void;
  setGlobalSearch: (q: string) => void;
  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearNotifications: () => void;
  unreadCount: () => number;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      sidebarCollapsed: false,
      notificationDrawerOpen: false,
      globalSearchQuery: '',
      notifications: [
        {
          id: 'n1',
          type: 'warning',
          title: 'License Expiring',
          message: 'Driver Priya Sharma license expires in 14 days.',
          createdAt: new Date().toISOString(),
          read: false,
          link: '/drivers',
        },
        {
          id: 'n2',
          type: 'info',
          title: 'Trip Dispatched',
          message: 'Trip TR-001 dispatched — TRUCK-11 to Pune.',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          read: false,
          link: '/trips',
        },
        {
          id: 'n3',
          type: 'success',
          title: 'Trip Completed',
          message: 'Trip TR-002 completed. ₹78,000 revenue logged.',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          read: true,
          link: '/trips',
        },
        {
          id: 'n4',
          type: 'error',
          title: 'Trip Cancelled',
          message: 'Trip TR-004 cancelled — Force Majeure.',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          read: true,
          link: '/trips',
        },
      ],
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleNotificationDrawer: () =>
        set((s) => ({ notificationDrawerOpen: !s.notificationDrawerOpen })),
      setNotificationDrawerOpen: (v) => set({ notificationDrawerOpen: v }),
      setGlobalSearch: (q) => set({ globalSearchQuery: q }),
      addNotification: (n) =>
        set((s) => ({
          notifications: [
            {
              ...n,
              id: `n${Date.now()}`,
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...s.notifications,
          ],
        })),
      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),
      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      clearNotifications: () => set({ notifications: [] }),
      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    {
      name: 'transitops_ui',
    }
  )
);
