import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MessageCircle, Send, Plus, Trash2, Users, Loader2, ArrowLeft } from 'lucide-react';
import { campaignApi } from '@/lib/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

interface Campaign {
  id: string;
  event_id: string;
  event_title: string;
  name: string;
  type: 'email' | 'whatsapp' | 'sms';
  subject: string | null;
  message: string;
  audience: string;
  status: 'draft' | 'sending' | 'sent' | 'failed' | 'scheduled';
  scheduled_at: string | null;
  sent_count: number;
  failed_count: number;
  total_recipients: number;
  created_at: string;
  priority?: 'low' | 'normal' | 'high';
  tags?: string | null;
  send_window_start?: string | null;
  send_window_end?: string | null;
  max_per_minute?: number;
  compliance_confirmed?: boolean;
}

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  sending: 'bg-sky-100 text-sky-700 animate-pulse',
  sent: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-600',
  scheduled: 'bg-amber-100 text-amber-700',
};

const AUDIENCE_LABELS: Record<string, string> = {
  all: "All attendees (RSVP'd)",
  going: 'Going only',
  maybe: 'Maybe only',
  waitlist: 'Waitlist',
};

export default function CampaignsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [serviceDisabled, setServiceDisabled] = useState(false);
  const [serviceBusy, setServiceBusy] = useState(false);

  useEffect(() => {
    void Promise.all([
      campaignApi.list().then((r) => setCampaigns(r.data as Campaign[])),
      campaignApi.getServiceState().then((r) => setServiceDisabled(Boolean((r.data as { disabled?: boolean }).disabled))).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleSend = async (campaignId: string) => {
    if (serviceDisabled) {
      alert('Campaign service is temporarily disabled by admin.');
      return;
    }
    try {
      const { data } = await campaignApi.complianceCheck(campaignId);
      const compliance = data as {
        consented_recipients: number;
        missing_consent_recipients: number;
        can_send: boolean;
      };
      if (!compliance.can_send) {
        alert('Blocked: no consented recipients found for this campaign.');
        return;
      }
      if (compliance.missing_consent_recipients > 0) {
        const proceed = confirm(`Compliance warning: ${compliance.missing_consent_recipients} recipients have no consent and will be skipped. Continue sending?`);
        if (!proceed) return;
      } else if (!confirm('Send this campaign now? This cannot be undone.')) return;
    } catch (e: unknown) {
      alert((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Compliance check failed');
      return;
    }
    setSending(campaignId);
    try {
      const { data } = await campaignApi.send(campaignId);
      alert((data as { message: string }).message);
      const r = await campaignApi.list();
      setCampaigns(r.data as Campaign[]);
    } catch (e: unknown) {
      alert((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to send');
    } finally {
      setSending(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    await campaignApi.delete(id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  const handleTestSend = async (c: Campaign) => {
    if (serviceDisabled) {
      alert('Campaign service is temporarily disabled by admin.');
      return;
    }
    const target = window.prompt(c.type === 'email' ? 'Test email address' : 'Test phone number (with country code)');
    if (!target) return;
    try {
      await campaignApi.testSend(c.id, c.type === 'email' ? { email: target } : { phone: target });
      alert('Test sent');
    } catch (e: unknown) {
      alert((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Test send failed');
    }
  };

  const toggleCampaignService = async () => {
    setServiceBusy(true);
    try {
      const next = !serviceDisabled;
      await campaignApi.setServiceState(next);
      setServiceDisabled(next);
      alert(`Campaign service ${next ? 'disabled' : 'enabled'}.`);
    } catch (e: unknown) {
      alert((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update service state');
    } finally {
      setServiceBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/dashboard')} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Send className="h-5 w-5 text-violet-600" /> Campaign Manager
                </h1>
                <p className="text-xs text-slate-500">Manage and send campaigns from one place</p>
              </div>
            </div>
            <button onClick={() => navigate('/campaigns/new')} className="btn-primary text-sm hidden sm:inline-flex">
              <Plus className="h-4 w-4" /> New Campaign
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {serviceDisabled && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Campaign service is temporarily disabled by admin. Sending and test-send are blocked.
          </div>
        )}
        {user?.role === 'admin' && (
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Campaign Service Control</p>
              <p className="text-xs text-slate-500">Temporarily disable/enable campaigns for all users.</p>
            </div>
            <button
              onClick={() => void toggleCampaignService()}
              disabled={serviceBusy}
              className={cn(
                'rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50',
                serviceDisabled ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              )}
            >
              {serviceBusy ? 'Updating...' : serviceDisabled ? 'Enable Service' : 'Disable Service'}
            </button>
          </div>
        )}
        {campaigns.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Campaigns', value: campaigns.length, icon: Send, color: 'text-violet-600 bg-violet-50' },
              { label: 'Emails Sent', value: campaigns.filter((c) => c.type === 'email').reduce((a, c) => a + c.sent_count, 0), icon: Mail, color: 'text-sky-600 bg-sky-50' },
              { label: 'WhatsApp Sent', value: campaigns.filter((c) => c.type === 'whatsapp').reduce((a, c) => a + c.sent_count, 0), icon: MessageCircle, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Total Reached', value: campaigns.reduce((a, c) => a + c.sent_count, 0), icon: Users, color: 'text-amber-600 bg-amber-50' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', s.color)}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-slate-900">{s.value.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 shimmer rounded-2xl" />)}</div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
            <Send className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-lg font-semibold text-slate-700">No campaigns yet</p>
            <p className="text-sm text-slate-500 mt-1">Create your first campaign from a dedicated builder page</p>
            <button onClick={() => navigate('/campaigns/new')} className="btn-primary mt-4">
              <Plus className="h-4 w-4" /> Create Campaign
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md hover:border-brand-200 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl shrink-0', c.type === 'email' ? 'bg-sky-50 text-sky-600' : 'bg-emerald-50 text-emerald-600')}>
                      {c.type === 'email' ? <Mail className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 truncate">{c.name}</h3>
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', STATUS_STYLE[c.status])}>{c.status}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{c.event_title} · {AUDIENCE_LABELS[c.audience] || c.audience}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{c.message.substring(0, 100)}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.priority && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">priority:{c.priority}</span>}
                        {c.tags && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">{c.tags}</span>}
                        {c.send_window_start && c.send_window_end && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{c.send_window_start}-{c.send_window_end}</span>}
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', c.compliance_confirmed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
                          {c.compliance_confirmed ? 'consent-checked' : 'consent-missing'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {c.status === 'sent' && (
                    <div className="flex gap-4 text-center shrink-0">
                      <div>
                        <p className="text-sm font-bold text-emerald-600">{c.sent_count}</p>
                        <p className="text-[10px] text-slate-400">Sent</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-600">{c.total_recipients}</p>
                        <p className="text-[10px] text-slate-400">Total</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                  <p className="text-[11px] text-slate-400">
                    {c.scheduled_at ? `Scheduled: ${format(new Date(c.scheduled_at), 'MMM d, h:mm a')}` : `Created ${format(new Date(c.created_at), 'MMM d, yyyy')}`}
                  </p>
                  <div className="flex gap-2">
                    {(c.status === 'draft' || c.status === 'failed') && (
                      <button onClick={() => void handleSend(c.id)} disabled={sending === c.id || serviceDisabled} className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors">
                        {sending === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        Send Now
                      </button>
                    )}
                    {(c.status === 'draft' || c.status === 'failed') && (
                      <button onClick={() => void handleTestSend(c)} disabled={serviceDisabled} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                        Test
                      </button>
                    )}
                    <button onClick={() => void handleDelete(c.id)} className="flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-100 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:hidden">
        <button onClick={() => navigate('/campaigns/new')} className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white">
          + New Campaign
        </button>
      </div>
    </div>
  );
}
