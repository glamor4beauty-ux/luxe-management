import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user?.email) return;
    try {
      const all = await base44.entities.Notification.filter({ recipientEmail: user.email });
      setNotifications(all.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (e) {
      // Entity may not be ready yet, silently ignore
    }
  };

  useEffect(() => {
    load();
    // Poll every 30s for new notifications
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Toast new unread notifications on load
  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length > 0 && !open) {
      unread.slice(0, 3).forEach(n => {
        toast.info(n.title, { description: n.message?.split('\n')[0], duration: 4000 });
      });
    }
  }, [notifications.length]);

  const markRead = async (id) => {
    try { await base44.entities.Notification.update(id, { isRead: true }); } catch (e) {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    try { await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { isRead: true }))); } catch (e) {}
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-semibold text-foreground text-sm">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No notifications</p>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`px-4 py-3 border-b border-border/50 cursor-pointer hover:bg-secondary/30 transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && <span className="h-2 w-2 mt-1.5 rounded-full bg-primary flex-shrink-0" />}
                      <div className={!n.isRead ? '' : 'ml-4'}>
                        <p className="text-sm font-medium text-foreground leading-tight">{n.title}</p>
                        {n.message && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message.split('\n')[0]}</p>
                        )}
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {n.created_date ? new Date(n.created_date).toLocaleString() : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}