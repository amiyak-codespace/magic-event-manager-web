import { useNavigate } from 'react-router-dom';
import { CalendarDays, Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-300/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-300/30 blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto animate-slide-up">
        <div className="mb-6 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/30 bg-white/10 backdrop-blur-sm shadow-2xl">
            <CalendarDays className="h-12 w-12 text-white/80" strokeWidth={1.5} />
          </div>
        </div>

        <div className="mb-4 text-7xl font-black text-white/10 select-none leading-none">404</div>

        <h1 className="text-2xl font-extrabold text-white mb-3">Page not found</h1>
        <p className="text-white/70 text-sm leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-white/90 shadow-md transition-colors"
          >
            <Home className="h-4 w-4" /> Home
          </button>
          <button
            onClick={() => navigate('/events')}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <Search className="h-4 w-4" /> Browse Events
          </button>
        </div>
      </div>
    </div>
  );
}
