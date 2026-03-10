import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, CalendarDays, Ticket, AlertCircle, Info, Loader2 } from 'lucide-react';
import { notificationsApi } from '@/lib/api';
import { Notification } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const TYPE_ICON: Record<string, React.ElementType> = {
  rsvp: Ticket,
  event: CalendarDays,
  reminder: AlertCircle,
  event_invite: CalendarDays,
  event_reminder: AlertCircle,
  info: Info,
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi.list()
      .then(({ data }) => {
        const d = data as { notifications: Notification[]; unread: number };
        setNotifications(d.notifications);
        setUnread(d.unread);
      })
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const markOneRead = async (id: string) => {
    await notificationsApi.markRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnread((c) => Math.max(0, c - 1));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-brand-600" />
            <h1 className="text-lg font-bold text-slate-900">Notifications</h1>
            {unread > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{unread}</span>
            )}
          </div>
          {unread > 0 && (
            <button onClick={() => void markAllRead()} className="flex items-center gap-1.5 text-sm text-brand-600 font-semibold hover:text-brand-700">
              <CheckCheck className="h-4 w-4" /> Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-lg font-semibold text-slate-700">All caught up!</p>
            <p className="text-sm text-slate-500 mt-1">No notifications yet</p>
            <button onClick={() => navigate('/events')} className="btn-primary mt-4">Browse Events</button>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const Icon = TYPE_ICON[n.type] || Info;
              return (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && void markOneRead(n.id)}
                  className={cn(
                    'flex items-start gap-3 rounded-2xl border p-4 transition-all cursor-pointer',
                    n.is_read ? 'border-slate-200 bg-white' : 'border-brand-200 bg-brand-50 hover:bg-white'
                  )}
                >
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                    n.is_read ? 'bg-slate-100' : 'bg-brand-100')}>
                    <Icon className={cn('h-5 w-5', n.is_read ? 'text-slate-400' : 'text-brand-600')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold', n.is_read ? 'text-slate-700' : 'text-slate-900')}>
                      {n.title}
                    </p>
                    {n.message && <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>}
                    <p className="text-xs text-slate-400 mt-1">
                      {format(new Date(n.created_at), 'MMM d, yyyy · h:mm a')}
                    </p>
                    {((n.data as Record<string, unknown> | null)?.event_id as string | undefined) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const eventId = ((n.data as Record<string, unknown>)?.event_id as string);
                          navigate(`/events/${eventId}`);
                        }}
                        className="mt-2 rounded-lg border border-brand-200 bg-white px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                      >
                        View details
                      </button>
                    )}
                  </div>
                  {!n.is_read && (
                    <div className="h-2 w-2 rounded-full bg-brand-500 shrink-0 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
