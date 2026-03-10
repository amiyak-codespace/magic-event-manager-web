import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { SEO } from '@/components/SEO';

export default function EventShortRedirectPage() {
  const navigate = useNavigate();
  const { shortId } = useParams<{ shortId: string }>();
  const { search } = useLocation();

  useEffect(() => {
    if (!shortId) return;
    // Tiny links must always land on ticket-code entry first.
    navigate(`/join/${encodeURIComponent(shortId)}${search || ''}`, { replace: true });
  }, [shortId, search, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <SEO title="Redirecting | AppsMagic Events" noIndex />
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Opening event...
      </div>
    </div>
  );
}
