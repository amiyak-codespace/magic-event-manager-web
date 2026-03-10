import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays, Users, Ticket, Plus, Edit, Trash2,
  CheckCircle2, Clock, XCircle, Sparkles,
  Globe, EyeOff, Ban, Play, UserCheck, RefreshCw,
  BarChart3, Copy, QrCode, Download, Repeat,
} from 'lucide-react';
import { authApi, eventsApi, rsvpApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AiAssistant from '@/components/AiAssistant';
import { Event, RSVP, Attendee } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLocale } from '@/lib/i18n';

type Tab = 'events' | 'rsvps' | 'attendees';

function TicketModal({ rsvp, onClose }: { rsvp: RSVP; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(rsvp.ticket_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100">
            <QrCode className="h-6 w-6 text-brand-600" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">{rsvp.title}</h3>
          <p className="text-xs text-slate-500 mt-1">
            {rsvp.start_date && format(new Date(rsvp.start_date), 'MMM d, yyyy · h:mm a')}
          </p>
          <div className="mt-4 rounded-xl bg-brand-50 border border-brand-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Your Ticket Code</p>
            <p className="font-mono text-xl font-bold text-brand-700 tracking-wider">{rsvp.ticket_code}</p>
          </div>
          <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-left">
            <p className="text-[11px] text-slate-500">Event ID</p>
            <p className="font-mono text-xs font-semibold text-slate-700">{rsvp.event_id.replace(/-/g, '').slice(0, 8).toUpperCase()}</p>
          </div>
          {rsvp.online_link && (
            <a
              href={`/join/${rsvp.event_id}?code=${encodeURIComponent(rsvp.ticket_code)}`}
              className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Join Meeting
            </a>
          )}
          <div className="mt-3 flex gap-2">
            <button onClick={copy} className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1">
              <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied!' : 'Copy Code'}
            </button>
            <button onClick={onClose} className="flex-1 btn-primary text-xs py-2">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';
  const canCreateEvents = !!user;

  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [myRsvps, setMyRsvps] = useState<RSVP[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [tab, setTab] = useState<Tab>(isOrganizer ? 'events' : 'rsvps');
  const [ticketRsvp, setTicketRsvp] = useState<RSVP | null>(null);
  const [statusBusy, setStatusBusy] = useState<string | null>(null);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [consentSaving, setConsentSaving] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [checkinCode, setCheckinCode] = useState('');
  const [checkinResult, setCheckinResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const { t } = useLocale();

  useEffect(() => {
    const fetches = [
      rsvpApi.mine().then(({ data }) => setMyRsvps(data as RSVP[])),
      eventsApi.mine().then(({ data }) => {
        const events = data as Event[];
        setMyEvents(events);
        if (events.length > 0) setSelectedEvent(events[0].id);
      }),
    ];
    Promise.all(fetches).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    authApi.getMe()
      .then(({ data }) => {
        const me = data as { terms_accepted?: boolean | number | string; privacy_accepted?: boolean | number | string };
        const isAccepted = (v: unknown) => v === true || v === 1 || v === '1';
        const pending = !(isAccepted(me.terms_accepted) && isAccepted(me.privacy_accepted));
        setNeedsConsent(pending);
      })
      .catch(() => {});
  }, []);

  const handleAcceptConsent = async () => {
    if (!consentTerms || !consentPrivacy) return;
    setConsentSaving(true);
    try {
      await authApi.acceptConsent({ consent_version: '2026-03' });
      setNeedsConsent(false);
    } finally {
      setConsentSaving(false);
    }
  };

  const showOrganizerView = isOrganizer || myEvents.length > 0;

  useEffect(() => {
    if (!selectedEvent || tab !== 'attendees') return;
    setAttendeesLoading(true);
    eventsApi
      .attendees(selectedEvent)
      .then(({ data }) => setAttendees(data as Attendee[]))
      .finally(() => setAttendeesLoading(false));
  }, [selectedEvent, tab]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    await eventsApi.delete(id);
    setMyEvents((ev) => ev.filter((e) => e.id !== id));
  };

  const handleStatusChange = async (id: string, status: string) => {
    setStatusBusy(id + status);
    try {
      await eventsApi.changeStatus(id, status);
      setMyEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: status as Event['status'] } : e))
      );
    } finally {
      setStatusBusy(null);
    }
  };

  const handleLiveToggle = async (id: string, shouldStart: boolean) => {
    setStatusBusy(id + (shouldStart ? 'start' : 'stop'));
    try {
      if (shouldStart) await eventsApi.startEvent(id);
      else await eventsApi.stopEvent(id);
      setMyEvents((prev) =>
        prev.map((e) => (e.id === id
          ? { ...e, event_started: shouldStart, status: shouldStart && e.status === 'draft' ? 'published' : e.status }
          : e))
      );
    } finally {
      setStatusBusy(null);
    }
  };

  const handleCheckin = async (eventId: string) => {
    if (!checkinCode.trim()) return;
    try {
      await eventsApi.checkIn(eventId, checkinCode.trim());
      setCheckinResult({ ok: true, msg: 'Checked in successfully!' });
      setCheckinCode('');
      eventsApi.attendees(eventId).then(({ data }) => setAttendees(data as Attendee[]));
    } catch {
      setCheckinResult({ ok: false, msg: 'Invalid ticket code' });
    }
    setTimeout(() => setCheckinResult(null), 3000);
  };

  const handleClone = async (id: string) => {
    setStatusBusy(id + 'clone');
    try {
      const { data } = await eventsApi.cloneEvent(id);
      const cloned = data as Event;
      setMyEvents((prev) => [cloned, ...prev]);
    } finally {
      setStatusBusy(null);
    }
  };

  const handleRecurrenceAction = async (id: string, action: 'pause' | 'resume' | 'stop') => {
    setStatusBusy(id + action);
    try {
      const { data } = await eventsApi.updateRecurrence(id, { action });
      const updated = data as Event;
      setMyEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    } finally {
      setStatusBusy(null);
    }
  };

  const totalAttendees = myEvents.reduce((a, e) => a + e.current_attendees, 0);
  const publishedCount = myEvents.filter((e) => e.status === 'published').length;
  const draftCount = myEvents.filter((e) => e.status === 'draft').length;

  const stats = showOrganizerView
    ? [
        { label: 'Private Events', value: myEvents.length, icon: CalendarDays, color: 'text-brand-600', bg: 'bg-brand-50' },
        { label: 'Total Attendees', value: totalAttendees, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Live Events', value: publishedCount, icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Drafts', value: draftCount, icon: EyeOff, color: 'text-amber-600', bg: 'bg-amber-50' },
      ]
    : [
        { label: 'Events Joined', value: myRsvps.length, icon: Ticket, color: 'text-brand-600', bg: 'bg-brand-50' },
        { label: 'Going', value: myRsvps.filter((r) => r.status === 'going').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Maybe', value: myRsvps.filter((r) => r.status === 'maybe').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Not Going', value: myRsvps.filter((r) => r.status === 'not_going').length, icon: XCircle, color: 'text-slate-400', bg: 'bg-slate-50' },
      ];

  type StatusAction = { label: string; icon: React.ElementType; next: string; color: string };
  const STATUS_ACTIONS: Record<string, StatusAction[]> = {
    draft: [{ label: 'Publish', icon: Globe, next: 'published', color: 'text-emerald-600 hover:bg-emerald-50' }],
    published: [
      { label: 'Unpublish', icon: EyeOff, next: 'draft', color: 'text-amber-600 hover:bg-amber-50' },
      { label: 'Cancel', icon: Ban, next: 'cancelled', color: 'text-red-500 hover:bg-red-50' },
      { label: 'Complete', icon: CheckCircle2, next: 'completed', color: 'text-sky-600 hover:bg-sky-50' },
    ],
    cancelled: [{ label: 'Reopen', icon: Play, next: 'draft', color: 'text-brand-600 hover:bg-brand-50' }],
    completed: [],
  };


  const exportCSV = () => {
    if (!attendees.length) return;
    const headers = ['Name', 'Email', 'Phone', 'Ticket Code', 'Status', 'Checked In', 'Notes'];
    const rows = attendees.map(a => [
      a.name, a.contact_email || a.email, a.phone || '', a.ticket_code,
      a.status, a.checked_in ? 'Yes' : 'No', a.notes || ''
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees-${selectedEvent}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarImage src={user?.avatar || ''} />
                <AvatarFallback className="bg-brand-100 text-brand-700 text-sm font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Private Event Console</h1>
                <p className="text-xs text-slate-500 capitalize">Welcome back, {user?.name?.split(' ')[0]}</p>
              </div>
            </div>
            {canCreateEvents && (
              <div className="hidden sm:flex items-center gap-2">
                <button onClick={() => navigate('/profile')} className="btn-secondary">
                  Profile
                </button>
                <button onClick={() => navigate('/events/create')} className="btn-primary">
                  <Plus className="h-4 w-4" /> Create Event
                </button>
              </div>
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:hidden">
            <button onClick={() => navigate('/events/create')} className="rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white">
              Create
            </button>
            <button onClick={() => setTab('rsvps')} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
              Tickets
            </button>
            <button onClick={() => setTab('rsvps')} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
              Join
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stats.map((s, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl mb-3', s.bg)}>
                <s.icon className={cn('h-5 w-5', s.color)} />
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6 gap-1">
          {(showOrganizerView
            ? [
                { id: 'events', label: 'Private Events', count: myEvents.length },
                { id: 'attendees', label: 'Attendees', count: totalAttendees },
                { id: 'rsvps', label: 'Tickets', count: myRsvps.length },
              ]
            : [{ id: 'rsvps', label: 'Tickets', count: myRsvps.length }]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all',
                tab === t.id
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              {t.label}
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold',
                tab === t.id ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500')}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 shimmer rounded-2xl" />)}
          </div>
        ) : tab === 'events' ? (
          <div className="space-y-3">
            {myEvents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <CalendarDays className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p className="text-lg font-semibold text-slate-700">No private events yet</p>
                <button onClick={() => navigate('/events/create')} className="btn-primary mt-4">
                  <Sparkles className="h-4 w-4" /> Create your first event
                </button>
              </div>
            ) : (
              myEvents.map((event) => (
                <div key={event.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-start sm:gap-4 sm:p-4">
                  <div
                    className="h-40 w-full shrink-0 cursor-pointer overflow-hidden rounded-xl bg-slate-100 sm:h-16 sm:w-24"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    {event.banner_url ? (
                      <img src={event.banner_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-2xl">
                        {event.category_icon || '📅'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold text-slate-900 cursor-pointer hover:text-brand-600 transition-colors"
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      {event.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {format(new Date(event.start_date), 'MMM d, yyyy')} · {event.city}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        event.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                        event.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                        event.status === 'completed' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600')}>
                        {event.status}
                      </span>
                      {event.status === 'published' && (
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          event.event_started ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600')}>
                          {event.event_started ? 'live' : 'not started'}
                        </span>
                      )}
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        event.is_private ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700')}>
                        {event.is_private ? 'invite-only' : 'legacy public'}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Users className="h-3 w-3" /> {event.current_attendees}
                        {event.max_attendees ? ` / ${event.max_attendees}` : ''}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <BarChart3 className="h-3 w-3" /> {event.is_free ? 'Free' : `Rs.${Number(event.price).toLocaleString()}`}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                        <button
                          onClick={() => navigate(`/events/${event.id}`)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:min-w-[120px] sm:text-sm"
                        >
                          <CalendarDays className="h-4 w-4" />
                          Open
                        </button>
                        <button
                          onClick={() => navigate(`/events/${event.id}/edit`)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:min-w-[120px] sm:text-sm"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        {event.status === 'published' && (
                          <button
                            disabled={statusBusy === event.id + (event.event_started ? 'stop' : 'start')}
                            onClick={() => void handleLiveToggle(event.id, !event.event_started)}
                            className={cn(
                              'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all disabled:opacity-50 sm:min-w-[120px] sm:text-sm',
                              event.event_started
                                ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'border border-emerald-200 bg-emerald-500 text-white hover:bg-emerald-600'
                            )}
                          >
                            {statusBusy === event.id + (event.event_started ? 'stop' : 'start')
                              ? <RefreshCw className="h-4 w-4 animate-spin" />
                              : (event.event_started ? <Clock className="h-4 w-4" /> : <Play className="h-4 w-4" />)}
                            {event.event_started ? 'Stop Event' : 'Start Event'}
                          </button>
                        )}
                      </div>

                      <details className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                        <summary className="cursor-pointer text-xs font-semibold text-slate-700">More actions</summary>
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                        <button
                          disabled={statusBusy === event.id + 'clone'}
                          onClick={() => void handleClone(event.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:min-w-[120px] sm:text-sm"
                        >
                          {statusBusy === event.id + 'clone'
                            ? <RefreshCw className="h-4 w-4 animate-spin" />
                            : <Copy className="h-4 w-4" />}
                          {t('clone')}
                        </button>
                        <button
                          onClick={() => void handleDelete(event.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 sm:min-w-[120px] sm:text-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                        {(STATUS_ACTIONS[event.status] || []).map((action) => (
                          <button
                            key={action.next}
                            disabled={statusBusy === event.id + action.next}
                            onClick={() => void handleStatusChange(event.id, action.next)}
                            className={cn(
                              'inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all disabled:opacity-50 sm:min-w-[120px] sm:text-sm',
                              action.next === 'published' && 'border-emerald-200 bg-emerald-500 text-white hover:bg-emerald-600',
                              action.next === 'draft' && 'border-amber-200 bg-white text-amber-700 hover:bg-amber-50',
                              action.next === 'cancelled' && 'border-red-200 bg-white text-red-600 hover:bg-red-50',
                              action.next === 'completed' && 'border-sky-200 bg-white text-sky-700 hover:bg-sky-50'
                            )}
                          >
                            {statusBusy === event.id + action.next ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <action.icon className="h-4 w-4" />
                            )}
                            {action.label}
                          </button>
                        ))}

                        {event.recurrence_parent_id ? (
                          <span className="inline-flex rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                            {t('recurring_instance')}
                          </span>
                        ) : Boolean(event.recurrence_frequency) ? (
                          <button
                            disabled={statusBusy === event.id + (Boolean(event.is_recurring) ? 'pause' : 'resume')}
                            onClick={() => void handleRecurrenceAction(event.id, Boolean(event.is_recurring) ? 'pause' : 'resume')}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50 sm:min-w-[120px] sm:text-sm"
                          >
                            {statusBusy === event.id + (Boolean(event.is_recurring) ? 'pause' : 'resume')
                              ? <RefreshCw className="h-4 w-4 animate-spin" />
                              : <Repeat className="h-4 w-4" />}
                            {Boolean(event.is_recurring) ? t('pause_recurring') : t('resume_recurring')}
                          </button>
                        ) : null}
                        {Boolean(event.is_recurring) && !event.recurrence_parent_id && Boolean(event.recurrence_frequency) && (
                            <button
                              disabled={statusBusy === event.id + 'stop'}
                              onClick={() => void handleRecurrenceAction(event.id, 'stop')}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 sm:min-w-[120px] sm:text-sm"
                            >
                              {statusBusy === event.id + 'stop'
                                ? <RefreshCw className="h-4 w-4 animate-spin" />
                                : <Ban className="h-4 w-4" />}
                              {t('stop_recurring')}
                            </button>
                        )}
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : tab === 'attendees' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex-1 min-w-48">
                <label className="text-xs font-medium text-slate-500 mb-1 block">Select Event</label>
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                >
                  {myEvents.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
              <div className="flex flex-wrap gap-2 items-center text-sm">
                <span className="text-emerald-600 font-semibold">{attendees.filter(a => a.status === 'going').length} going</span>
                <span className="text-amber-600 font-semibold">{attendees.filter(a => a.checked_in).length} checked in</span>
                {attendees.length > 0 && (
                  <button
                    onClick={exportCSV}
                    className="ml-2 flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> Export CSV
                  </button>
                )}
              </div>
            </div>

            {selectedEvent && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-brand-600" /> Manual Check-In
                </p>
                <div className="flex gap-2">
                  <input
                    value={checkinCode}
                    onChange={(e) => setCheckinCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleCheckin(selectedEvent)}
                    placeholder="Enter ticket code e.g. TVT-ABC123"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                  />
                  <button onClick={() => void handleCheckin(selectedEvent)} className="btn-primary text-sm px-4">
                    Check In
                  </button>
                </div>
                {checkinResult && (
                  <p className={cn('mt-2 text-sm font-medium', checkinResult.ok ? 'text-emerald-600' : 'text-red-500')}>
                    {checkinResult.msg}
                  </p>
                )}
              </div>
            )}

            {attendeesLoading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 shimmer rounded-xl" />)}</div>
            ) : attendees.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <Users className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                <p className="text-slate-500">No attendees yet for this event</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">{attendees.length} Attendees</p>
                  <span className="text-xs text-slate-400">{attendees.filter(a => a.checked_in).length}/{attendees.length} checked in</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {attendees.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                      <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                        <AvatarImage src={a.avatar || ''} />
                        <AvatarFallback className="bg-brand-100 text-brand-700 text-xs font-bold">
                          {a.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{a.name}</p>
                        <p className="text-xs text-slate-500 truncate">{a.contact_email || a.email}</p>
                        {a.phone && (
                          <p className="text-xs text-brand-600 font-medium mt-0.5">📞 {a.phone}</p>
                        )}
                        {a.notes && (
                          <p className="text-xs text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 mt-1 truncate">
                            📝 {a.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="font-mono text-[10px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                          {a.ticket_code}
                        </span>
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          a.checked_in ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                          {a.checked_in ? '✓ In' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {myRsvps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <Ticket className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p className="text-lg font-semibold text-slate-700">No RSVPs yet</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button onClick={() => navigate('/events')} className="btn-secondary">Browse Events</button>
                  {canCreateEvents && (
                    <button onClick={() => navigate('/events/create')} className="btn-primary">
                      <Plus className="h-4 w-4" /> Create Event
                    </button>
                  )}
                </div>
              </div>
            ) : (
              myRsvps.map((rsvp) => (
                <div
                  key={rsvp.id}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-brand-200 transition-all cursor-pointer"
                  onClick={() => navigate(`/events/${rsvp.event_id}`)}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                    <span className="text-2xl">{rsvp.category_icon || '📅'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{rsvp.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {rsvp.start_date && format(new Date(rsvp.start_date), 'MMM d, yyyy')}
                      {rsvp.city ? ` · ${rsvp.city}` : ''}
                    </p>
                    {rsvp.ticket_code && (
                      <p className="mt-1 font-mono text-[10px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded inline-block">
                        {rsvp.ticket_code}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold',
                      rsvp.status === 'going' ? 'bg-emerald-100 text-emerald-700' :
                      rsvp.status === 'maybe' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500')}>
                      {rsvp.status === 'going' ? 'Going' : rsvp.status === 'maybe' ? 'Maybe' : 'Not going'}
                    </span>
                    {rsvp.ticket_code && (
                      <button
                        onClick={() => setTicketRsvp(rsvp)}
                        className="text-[10px] text-brand-600 hover:text-brand-700 flex items-center gap-1"
                      >
                        <QrCode className="h-3 w-3" /> View Ticket
                      </button>
                    )}
                    {rsvp.status === 'going' && rsvp.ticket_code && (
                      <button
                        onClick={() => navigate(`/join/${rsvp.event_id}?code=${encodeURIComponent(rsvp.ticket_code)}`)}
                        className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        Join Event
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {ticketRsvp && <TicketModal rsvp={ticketRsvp} onClose={() => setTicketRsvp(null)} />}

      <AiAssistant
        context={`User is on dashboard. They have ${myEvents.length} events and ${myRsvps.length} RSVPs.`}
      />
      {canCreateEvents && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:hidden">
          <button onClick={() => navigate('/events/create')} className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white">
            + Create Event
          </button>
        </div>
      )}

      {needsConsent && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-extrabold text-slate-900">One-time Consent Required</h3>
            <p className="mt-1 text-sm text-slate-600">Please accept to continue using AppsMagic Events.</p>
            <div className="mt-4 space-y-2">
              <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <input type="checkbox" className="mt-1" checked={consentTerms} onChange={(e) => setConsentTerms(e.target.checked)} />
                <span className="text-sm text-slate-700">I accept the <Link className="underline" to="/legal/terms" target="_blank">Terms of Service</Link>.</span>
              </label>
              <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <input type="checkbox" className="mt-1" checked={consentPrivacy} onChange={(e) => setConsentPrivacy(e.target.checked)} />
                <span className="text-sm text-slate-700">I accept the <Link className="underline" to="/legal/privacy" target="_blank">Privacy Policy</Link> and <Link className="underline" to="/legal/consent" target="_blank">Consent Policy</Link>.</span>
              </label>
            </div>
            <button
              onClick={() => void handleAcceptConsent()}
              disabled={consentSaving || !consentTerms || !consentPrivacy}
              className="mt-4 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {consentSaving ? 'Saving…' : 'Accept and Continue'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
