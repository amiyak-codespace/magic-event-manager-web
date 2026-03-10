import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Bell, Plus, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { notificationsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useLocale } from '@/lib/i18n';
import { Notification } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { locale, setLocale, t } = useLocale();

  useEffect(() => {
    if (!isAuthenticated()) return;
    notificationsApi.list().then(({ data }) => {
      const d = data as { unread: number; notifications: Notification[] };
      setUnreadCount(d.unread);
      setNotifications((d.notifications || []).slice(0, 6));
    }).catch(() => {});
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={cn(
        'rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors',
        location.pathname === to
          ? 'bg-brand-50 text-brand-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      )}
    >
      {label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="container mx-auto flex h-12 items-center justify-between px-3 md:h-14 md:px-4">
        {/* Logo */}
        <Link to={isAuthenticated() ? '/dashboard' : '/'} className="flex items-center gap-2.5">
          <img src="/apps-events-logo.svg" alt="AppsMagic Events" className="h-8 w-8 rounded-xl border border-slate-200 bg-white p-1 shadow-sm" />
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight tracking-tight">{t('Events by AppsMagic')}</p>
            <p className="hidden text-[10px] text-slate-500 leading-none md:block">{t('Mobile-first event operations')}</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthenticated() && navLink('/dashboard', t('dashboard'))}
          {isAuthenticated() && navLink('/campaigns', t('campaigns'))}
          <a
            href="https://appsmagic.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-brand-700 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            appsmagic.in
          </a>
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-2">
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as typeof locale)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600"
            aria-label={t('language')}
            title={t('language')}
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="pt">PT</option>
          </select>
          {isAuthenticated() ? (
            <>
              <button
                onClick={() => navigate('/events/create')}
                className="btn-primary text-xs px-3 py-1.5 h-auto"
              >
                <Plus className="h-3.5 w-3.5" />
                {t('Quick Create')}
              </button>
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition-colors relative"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    <div className="mb-1 flex items-center justify-between px-2 py-1">
                      <p className="text-xs font-semibold text-slate-500">Notifications</p>
                      <button
                        onClick={() => { setNotifOpen(false); navigate('/notifications'); }}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                      >
                        View all
                      </button>
                    </div>
                    <div className="max-h-80 space-y-1 overflow-auto">
                      {notifications.length === 0 ? (
                        <p className="px-2 py-3 text-xs text-slate-500">No notifications</p>
                      ) : notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            const data = (n.data || {}) as Record<string, unknown>;
                            const eventId = typeof data.event_id === 'string' ? data.event_id : '';
                            setNotifOpen(false);
                            navigate(eventId ? `/events/${eventId}` : '/notifications');
                          }}
                          className={cn(
                            'w-full rounded-xl px-2 py-2 text-left',
                            n.is_read ? 'hover:bg-slate-50' : 'bg-brand-50 hover:bg-brand-100'
                          )}
                        >
                          <p className="truncate text-xs font-semibold text-slate-800">{n.title}</p>
                          {n.message ? <p className="mt-0.5 truncate text-[11px] text-slate-500">{n.message}</p> : null}
                          <p className="mt-1 text-[10px] text-slate-400">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div
                className="flex items-center gap-2 cursor-pointer rounded-xl px-2 py-1.5 hover:bg-slate-100 transition-colors"
                onClick={() => navigate('/profile')}
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.avatar || ''} />
                  <AvatarFallback className="bg-brand-100 text-brand-700 text-xs font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold text-slate-700">{user?.name?.split(' ')[0]}</span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary text-xs px-3 py-1.5 h-auto"
              >
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="btn-secondary text-xs px-3 py-1.5 h-auto"
              >
                {t('login')}
              </button>
              <button
                onClick={() => navigate('/register')}
                className="btn-primary text-xs px-3 py-1.5 h-auto"
              >
                {t('Start Free')}
              </button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          <div className="pb-2">
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as typeof locale)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-600"
              aria-label={t('language')}
            >
              <option value="en">EN</option>
              <option value="es">ES</option>
              <option value="pt">PT</option>
            </select>
          </div>
          {isAuthenticated() ? (
            <>
              <Link to="/dashboard" className="flex items-center py-2.5 text-sm font-semibold text-slate-700" onClick={() => setMenuOpen(false)}>
                {t('dashboard')}
              </Link>
              <Link to="/profile" className="flex items-center py-2.5 text-sm font-semibold text-slate-700" onClick={() => setMenuOpen(false)}>
                Profile
              </Link>
              <Link to="/events/create" className="flex items-center py-2.5 text-sm font-semibold text-brand-700" onClick={() => setMenuOpen(false)}>
                + {t('create_event')}
              </Link>
              <button className="flex items-center py-2.5 text-sm font-medium text-red-500 w-full text-left" onClick={handleLogout}>
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="flex items-center py-2.5 text-sm font-medium text-slate-700" onClick={() => setMenuOpen(false)}>{t('login')}</Link>
              <Link to="/register" className="flex items-center py-2.5 text-sm font-semibold text-brand-600" onClick={() => setMenuOpen(false)}>{t('get_started')}</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
