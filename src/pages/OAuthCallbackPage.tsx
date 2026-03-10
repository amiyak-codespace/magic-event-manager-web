import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface OAuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const error = searchParams.get('error');
    const token = searchParams.get('token');
    const userEncoded = searchParams.get('user');

    if (error || !token || !userEncoded) {
      navigate(`/login?error=${encodeURIComponent(error || 'SSO login failed')}`, { replace: true });
      return;
    }

    try {
      const normalized = userEncoded.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      const user = JSON.parse(atob(padded)) as OAuthUser;
      setAuth(user, token);
      navigate('/', { replace: true });
    } catch {
      navigate('/login?error=SSO login failed', { replace: true });
    }
  }, [navigate, searchParams, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex items-center gap-2 text-slate-600 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Completing sign in...
      </div>
    </div>
  );
}
