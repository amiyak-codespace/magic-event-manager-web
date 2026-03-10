import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Ticket } from 'lucide-react';
import { eventsApi } from '@/lib/api';
import type { Event } from '@/types';
import { SEO } from '@/components/SEO';

export default function JoinEventPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [code, setCode] = useState((searchParams.get('code') || '').toUpperCase());
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    eventsApi.get(id)
      .then(({ data }) => setEvent(data as Event))
      .catch(() => setError('Event not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const onJoin = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!id || !code.trim()) return;
    setJoining(true);
    setError('');
    try {
      const { data } = await eventsApi.joinMeeting(id, code.trim().toUpperCase());
      const joinUrl = (data as { join_url: string }).join_url;
      window.location.href = joinUrl;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Unable to join event');
      setJoining(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('code')) {
      void onJoin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SEO title="Join Event | AppsMagic Events" noIndex />
        <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
      </div>
    );
  }

  const notStarted = !!event && (event.status !== 'published' || !event.event_started);

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title={`Join ${event?.title || 'Event'} | AppsMagic Events`}
        description="Enter ticket code to join your event securely."
        path={id ? `/join/${id}` : '/join'}
        noIndex
      />
      <div className="mx-auto w-full max-w-lg px-4 py-6 pb-28">
        <Link to={id ? `/events/${id}` : '/events'} className="mb-5 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Join Event</h1>
          <p className="mt-1 text-sm text-slate-500">{event?.title || 'Event'}</p>

          {notStarted ? (
            <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Event not started. Host needs to start the event.
            </p>
          ) : (
            <form onSubmit={(e) => void onJoin(e)} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Ticket / Join Code</span>
                <div className="relative">
                  <Ticket className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="TVT-XXXXXX"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm font-mono uppercase tracking-wide outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </form>
          )}
        </div>
      </div>
      {!notStarted && (
        <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 p-3 backdrop-blur">
          <div className="mx-auto w-full max-w-lg">
            <button
              type="button"
              onClick={() => void onJoin()}
              disabled={joining || !code.trim()}
              className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {joining ? 'Joining…' : 'Join Event'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
