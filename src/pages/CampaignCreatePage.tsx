import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, MessageCircle, Send, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface EventOption {
  id: string;
  title: string;
  current_attendees: number;
}

interface CsvRecipient {
  name?: string;
  email?: string;
  phone?: string;
  consent_opted_in?: boolean | string;
  consent_source?: string;
  validation_score?: number;
}

const AUDIENCE_LABELS: Record<string, string> = {
  all: "All attendees (RSVP'd)",
  going: 'Going only',
  maybe: 'Maybe only',
  waitlist: 'Waitlist',
};

export default function CampaignCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [parseBusy, setParseBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  const [form, setForm] = useState({
    event_id: searchParams.get('event_id') || '',
    name: '',
    subject: '',
    message: '',
    audience: 'all',
    recipient_mode: 'registered' as 'registered' | 'import',
    ai_prompt: '',
    compliance_confirmed: false,
  });

  const [csvRecipients, setCsvRecipients] = useState<CsvRecipient[]>([]);
  const [recipientRawText, setRecipientRawText] = useState('');
  const [parseSummary, setParseSummary] = useState<{ total_rows: number; valid_rows: number; invalid_rows: number; avg_score: number } | null>(null);

  useEffect(() => {
    api.get('/events/mine').then((r) => setEvents(r.data as EventOption[])).finally(() => setLoading(false));
  }, []);

  const selectedEvent = useMemo(() => events.find((e) => e.id === form.event_id), [events, form.event_id]);

  const validCsvRecipients = useMemo(
    () => csvRecipients.filter((r) => (r.email && r.email.includes('@')) || (r.phone && r.phone.replace(/[^0-9]/g, '').length >= 8)),
    [csvRecipients]
  );

  const parseRecipients = async (text: string) => {
    if (!text.trim()) return;
    setParseBusy(true);
    try {
      const { data } = await api.post('/campaigns/recipients/parse', { raw_text: text });
      setCsvRecipients((data as { recipients: CsvRecipient[] }).recipients || []);
      setParseSummary((data as { summary: { total_rows: number; valid_rows: number; invalid_rows: number; avg_score: number } }).summary || null);
    } catch {
      alert('Failed to parse contacts');
    } finally {
      setParseBusy(false);
    }
  };

  const parseCsv = async (file: File) => {
    const text = await file.text();
    setRecipientRawText(text);
    await parseRecipients(text);
  };

  const generateAiTemplate = async () => {
    if (!form.event_id) return;
    setAiBusy(true);
    try {
      const { data } = await api.post('/campaigns/ai-template', {
        event_id: form.event_id,
        channel: 'email',
        language: 'English',
        prompt: form.ai_prompt,
      });
      setForm((f) => ({
        ...f,
        subject: (data as { subject?: string }).subject || f.subject,
        message: (data as { message?: string }).message || f.message,
      }));
    } catch {
      alert('AI draft failed');
    } finally {
      setAiBusy(false);
    }
  };

  const handleCreate = async () => {
    if (!form.event_id || !form.name || !form.subject || !form.message) return;
    if (form.recipient_mode === 'import' && validCsvRecipients.length === 0) {
      alert('Please import at least one valid contact');
      return;
    }
    if (!form.compliance_confirmed) {
      alert('Please confirm recipient consent before creating campaign');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        event_id: form.event_id,
        name: form.name,
        type: 'email',
        subject: form.subject,
        message: form.message,
        audience: form.audience,
        recipient_source: form.recipient_mode === 'import' ? 'csv' : 'registered',
        csv_recipients: form.recipient_mode === 'import' ? validCsvRecipients : [],
        import_consent_confirmed: form.recipient_mode === 'import' ? form.compliance_confirmed : false,
        compliance_confirmed: true,
        compliance_notes: form.recipient_mode === 'import' ? 'Imported contacts via campaign create flow' : 'Event attendees',
      };
      await api.post('/campaigns', payload);
      alert('Campaign created');
      navigate('/campaigns');
    } catch (e: unknown) {
      const payload = (e as { response?: { data?: { error?: string; moderation?: { reasons?: string[] } } } })?.response?.data;
      if (payload?.moderation?.reasons?.length) {
        alert(`${payload.error || 'Campaign blocked'}\n\n${payload.moderation.reasons.join('\n')}`);
      } else {
        alert(payload?.error || 'Failed to create campaign');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate('/campaigns')} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-900">Create Email Campaign</h1>
              <p className="text-xs text-slate-500">Simple, mobile-friendly flow with fewer steps.</p>
            </div>
          </div>
          <button
            onClick={() => void handleCreate()}
            disabled={!form.event_id || !form.name || !form.subject || !form.message || creating || loading}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-6 space-y-4 pb-24">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Delivery Channel</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-brand-300 bg-brand-50 p-3 text-brand-700">
              <Mail className="h-4 w-4 mb-1" />
              <p className="text-sm font-semibold">Email</p>
              <p className="text-[11px]">Available</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-500">
              <MessageCircle className="h-4 w-4 mb-1" />
              <p className="text-sm font-semibold">WhatsApp</p>
              <p className="text-[11px]">Upcoming</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-500">
              <MessageCircle className="h-4 w-4 mb-1" />
              <p className="text-sm font-semibold">SMS</p>
              <p className="text-[11px]">Upcoming</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <select value={form.event_id} onChange={(e) => setForm((f) => ({ ...f, event_id: e.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm md:col-span-2">
            <option value="">Select event</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.title} ({e.current_attendees})</option>)}
          </select>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Campaign name" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm md:col-span-2" />
          <select value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm md:col-span-2">
            {Object.entries(AUDIENCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex gap-2 mb-3">
            <input
              value={form.ai_prompt}
              onChange={(e) => setForm((f) => ({ ...f, ai_prompt: e.target.value }))}
              placeholder="Optional: ask AI to draft email"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
            <button type="button" onClick={() => void generateAiTemplate()} disabled={!form.event_id || aiBusy} className="rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-50">
              {aiBusy ? 'AI...' : <Sparkles className="h-4 w-4" />}
            </button>
          </div>
          <div className="grid gap-3">
            <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Email subject" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            <textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} rows={7} placeholder="Write your campaign message" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Recipients</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, recipient_mode: 'registered' }))}
              className={cn('rounded-xl border px-3 py-2.5 text-sm font-semibold', form.recipient_mode === 'registered' ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-700')}
            >
              Use Event Attendees
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, recipient_mode: 'import' }))}
              className={cn('rounded-xl border px-3 py-2.5 text-sm font-semibold', form.recipient_mode === 'import' ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-700')}
            >
              Enter / Import Contacts
            </button>
          </div>

          {form.recipient_mode === 'import' && (
            <div className="mt-3 space-y-2">
              <input type="file" accept=".csv,.txt,text/csv,text/plain" onChange={(e) => { const f = e.target.files?.[0]; if (f) void parseCsv(f); }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              <textarea value={recipientRawText} onChange={(e) => setRecipientRawText(e.target.value)} rows={4} placeholder="Enter emails or contacts (one per line or CSV):\nmahapatro.amiya@gmail.com\nname,email,phone,consent_opted_in" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => void parseRecipients(recipientRawText)} disabled={parseBusy || !recipientRawText.trim()} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                  {parseBusy ? 'Parsing...' : 'Validate Contacts'}
                </button>
                <p className="text-xs text-slate-500">{csvRecipients.length} parsed · {validCsvRecipients.length} valid (file or manual)</p>
              </div>
              {parseSummary && <p className="text-xs text-slate-500">Quality score {parseSummary.avg_score}/100 · Invalid {parseSummary.invalid_rows}</p>}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={form.compliance_confirmed}
              onChange={(e) => setForm((f) => ({ ...f, compliance_confirmed: e.target.checked }))}
              className="mt-0.5"
            />
            <span>{form.recipient_mode === 'import'
              ? 'I confirm imported contacts have valid user consent for campaign communication.'
              : 'I confirm this campaign follows consent policies.'}</span>
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
          Preview: {selectedEvent ? `${selectedEvent.title} · ${AUDIENCE_LABELS[form.audience]} · Email` : 'Select event'}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:hidden">
        <button onClick={() => void handleCreate()} disabled={!form.event_id || !form.name || !form.subject || !form.message || creating || loading} className="w-full rounded-xl bg-brand-700 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {creating ? 'Creating...' : 'Create Campaign'}
        </button>
      </div>
    </div>
  );
}
