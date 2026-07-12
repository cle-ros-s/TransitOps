import { X, Bell, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore, type Notification } from '../../store/uiStore';
import { formatDateTime } from '../../utils/formatDate';
import { useNavigate } from 'react-router-dom';

function NotificationIcon({ type }: { type: Notification['type'] }) {
  switch (type) {
    case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    default: return <Info className="w-4 h-4 text-blue-500" />;
  }
}

export function NotificationDrawer() {
  const open = useUIStore((s) => s.notificationDrawerOpen);
  const notifications = useUIStore((s) => s.notifications);
  const setOpen = useUIStore((s) => s.setNotificationDrawerOpen);
  const markAllRead = useUIStore((s) => s.markAllRead);
  const markRead = useUIStore((s) => s.markRead);
  const clearAll = useUIStore((s) => s.clearNotifications);
  const navigate = useNavigate();

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setOpen(false)}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-80 sm:w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-brand-500" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
                {unread > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full">
                    {unread}
                  </span>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 px-5 py-2 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
              <span className="text-gray-300">·</span>
              <button onClick={clearAll} className="flex items-center gap-1.5 text-xs text-red-500 hover:underline font-medium">
                <Trash2 className="w-3.5 h-3.5" /> Clear all
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-2">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                  <Bell className="w-12 h-12 opacity-30" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markRead(n.id);
                      if (n.link) { navigate(n.link); setOpen(false); }
                    }}
                    className={`flex gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-50 dark:border-gray-800/50 ${
                      !n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <NotificationIcon type={n.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-tight ${ !n.read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{formatDateTime(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
