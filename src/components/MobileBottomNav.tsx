import { Home, PlusCircle, LayoutDashboard } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { useLocale } from '@/lib/i18n';

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { t } = useLocale();
  const hideOnRsvpScreen = /^\/events\/[^/]+$/.test(location.pathname) || /^\/join\/[^/]+$/.test(location.pathname);

  const active = (path: string) => location.pathname === path;

  if (hideOnRsvpScreen) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0px)] pt-1 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-3 gap-1">
        <Link to="/" className={cn('flex flex-col items-center rounded-xl py-2 text-[11px] font-semibold', active('/') ? 'bg-brand-50 text-brand-700' : 'text-slate-500')}>
          <Home className="h-4 w-4" />
          {t('Home')}
        </Link>
        <button
          onClick={() => navigate(isAuthenticated() ? '/events/create' : '/register?role=organizer')}
          className="flex flex-col items-center rounded-xl py-1 text-[11px] font-semibold text-brand-700"
        >
          <PlusCircle className="h-6 w-6" />
          {t('Create')}
        </button>
        <Link to="/dashboard" className={cn('flex flex-col items-center rounded-xl py-2 text-[11px] font-semibold', active('/dashboard') ? 'bg-brand-50 text-brand-700' : 'text-slate-500')}>
          <LayoutDashboard className="h-4 w-4" />
          {t('Dashboard')}
        </Link>
      </div>
    </nav>
  );
}
