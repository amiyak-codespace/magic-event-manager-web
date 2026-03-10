import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart3, Eye, Users, TrendingUp, CheckCircle2,
  ArrowLeft, Clock, AlertCircle, Send, Loader2, Calendar
} from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';

interface DailyPoint { date: string; views: number; rsvps: number; }
interface Analytics {
  event: { id: string; title: string; views: number; created_at: string };
  overview: {
    total_views: number; total_rsvps: number; going: number; maybe: number;
    not_going: number; checked_in: number; capacity_used: number | null;
    waitlist: number; conversion_rate: number;
  };
  daily: DailyPoint[];
  campaigns: { name: string; type: string; status: string; sent_count: number; total_recipients: number; created_at: string }[];
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-24 w-8 bg-slate-100 rounded-md overflow-hidden flex items-end">
        <div className={`w-full rounded-sm transition-all ${color}`} style={{ height: `${Math.max(pct, 2)}%` }} />
      </div>
      <span className="text-[9px] text-slate-400">{value}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'daily' | 'campaigns'>('overview');

  useEffect(() => {
    if (!id) return;
    api.get(`/analytics/events/${id}`)
      .then(r => setData(r.data as Analytics))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-400 mb-3" />
        <p className="text-slate-600">Analytics not available</p>
        <button onClick={() => navigate(-1)} className="btn-secondary mt-3">Go back</button>
      </div>
    </div>
  );

  const { overview, daily, campaigns } = data;
  const maxViews = Math.max(...daily.map(d => d.views), 1);
  const maxRsvps = Math.max(...daily.map(d => d.rsvps), 1);

  const FUNNEL = [
    { label: 'Page Views', value: overview.total_views, color: 'bg-sky-400', pct: 100 },
    { label: 'RSVP\'d', value: overview.total_rsvps, color: 'bg-violet-400', pct: overview.total_views > 0 ? Math.round((overview.total_rsvps / overview.total_views) * 100) : 0 },
    { label: 'Going', value: overview.going, color: 'bg-emerald-400', pct: overview.total_rsvps > 0 ? Math.round((overview.going / overview.total_rsvps) * 100) : 0 },
    { label: 'Checked In', value: overview.checked_in, color: 'bg-brand-500', pct: overview.going > 0 ? Math.round((overview.checked_in / overview.going) * 100) : 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(`/events/${id}`)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-violet-600" /> Event Analytics
                </h1>
                <p className="text-xs text-slate-500 truncate max-w-xs">{data.event.title}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/campaigns/new?event_id=${id}`)}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
            >
              <Send className="h-3.5 w-3.5" /> New Campaign
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            {(['overview', 'daily', 'campaigns'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  tab === t ? 'bg-violet-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Page Views', value: overview.total_views, icon: Eye, color: 'text-sky-600 bg-sky-50' },
                { label: 'Total RSVPs', value: overview.total_rsvps, icon: Users, color: 'text-violet-600 bg-violet-50' },
                { label: 'Conversion', value: `${overview.conversion_rate}%`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Checked In', value: overview.checked_in, icon: CheckCircle2, color: 'text-brand-600 bg-brand-50' },
              ].map((k, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${k.color} mb-3`}>
                    <k.icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900">{k.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>

            {/* RSVP breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4">RSVP Breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: 'Going', value: overview.going, color: 'bg-emerald-500' },
                  { label: 'Maybe', value: overview.maybe, color: 'bg-amber-400' },
                  { label: 'Not Going', value: overview.not_going, color: 'bg-slate-300' },
                  { label: 'Waitlist', value: overview.waitlist, color: 'bg-violet-400' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium">{item.label}</span>
                      <span className="text-slate-900 font-bold">{item.value}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all`}
                        style={{ width: `${overview.total_rsvps > 0 ? Math.round((item.value / (overview.total_rsvps || 1)) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Funnel */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Conversion Funnel</h3>
              <div className="space-y-2">
                {FUNNEL.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-slate-500 shrink-0">{step.label}</div>
                    <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                      <div
                        className={`h-full ${step.color} flex items-center px-2 transition-all`}
                        style={{ width: `${Math.max(step.pct, 2)}%` }}
                      >
                        <span className="text-white text-xs font-bold">{step.value}</span>
                      </div>
                    </div>
                    <div className="w-10 text-right text-xs font-semibold text-slate-500 shrink-0">{step.pct}%</div>
                  </div>
                ))}
              </div>
            </div>

            {overview.capacity_used !== null && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Capacity</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${overview.capacity_used >= 90 ? 'bg-red-500' : overview.capacity_used >= 70 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(overview.capacity_used, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-700 w-12 text-right">{overview.capacity_used}%</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{overview.going} spots filled</p>
              </div>
            )}
          </div>
        )}

        {/* Daily chart */}
        {tab === 'daily' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Last 14 Days</h3>
            <p className="text-xs text-slate-400 mb-6">Views (blue) and RSVPs (violet) per day</p>
            <div className="flex items-end gap-1.5 overflow-x-auto pb-2">
              {daily.map((d) => (
                <div key={d.date} className="flex flex-col items-center gap-1 min-w-[36px]">
                  <div className="flex items-end gap-0.5">
                    <MiniBar value={d.views} max={maxViews} color="bg-sky-400" />
                    <MiniBar value={d.rsvps} max={maxRsvps} color="bg-violet-500" />
                  </div>
                  <span className="text-[9px] text-slate-400 whitespace-nowrap">
                    {format(new Date(d.date), 'MMM d')}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-slate-500">
              <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-sky-400" /> Views</div>
              <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-violet-500" /> RSVPs</div>
            </div>
          </div>
        )}

        {/* Campaigns */}
        {tab === 'campaigns' && (
          <div className="space-y-3">
            {campaigns.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <Send className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">No campaigns for this event yet</p>
                <button
                  onClick={() => navigate(`/campaigns/new?event_id=${id}`)}
                  className="btn-primary mt-4"
                >
                  Create Campaign
                </button>
              </div>
            ) : (
              campaigns.map((c, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.type} · {c.status} · {format(new Date(c.created_at), 'MMM d')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">{c.sent_count}</p>
                    <p className="text-xs text-slate-400">/{c.total_recipients} sent</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
