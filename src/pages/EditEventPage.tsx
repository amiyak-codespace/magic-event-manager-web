import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CalendarDays, MapPin, Users, DollarSign, Loader2, Sparkles,
  Wand2, Image, CheckCircle2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { eventsApi, aiApi } from '@/lib/api';
import AiAssistant from '@/components/AiAssistant';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Event } from '@/types';

const CATEGORY_SLUGS = ['music', 'sports', 'tech', 'food-drink', 'arts', 'business', 'fitness', 'networking'];

interface FormState {
  title: string; short_description: string; description: string;
  category_slug: string; tags: string; banner_url: string;
  is_online: boolean; venue_name: string; venue_address: string;
  city: string; state: string; country: string;
  start_date: string; start_time: string;
  end_date: string; end_time: string;
  reg_deadline_date: string; reg_deadline_time: string;
  is_free: boolean; price: string; currency: string; max_attendees: string;
  online_link: string;
  is_private: boolean;
  show_attendees_public: boolean;
}
type Errors = Partial<Record<keyof FormState, string>>;

function toISO(date: string, time: string) {
  if (!date) return '';
  return `${date}T${time || '00:00'}:00`;
}
function fromISO(iso: string) {
  if (!iso) return { date: '', time: '' };
  const m = String(iso).match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (m) return { date: m[1], time: m[2] };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: '', time: '' };
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function toDateTimeLocal(date: string, time: string): string {
  return date ? `${date}T${time || '00:00'}` : '';
}

function fromDateTimeLocal(value: string): { date: string; time: string } {
  const [date, time = '00:00'] = value.split('T');
  return { date: date || '', time: time.slice(0, 5) };
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-500 font-medium">{msg}</p>;
}

function Section({ title, icon, children, defaultOpen = true }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-2">{icon}<span className="text-sm font-bold text-slate-800">{title}</span></div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">{children}</div>}
    </div>
  );
}

const INITIAL: FormState = {
  title: '', short_description: '', description: '',
  category_slug: '', tags: '', banner_url: '',
  is_online: false, venue_name: '', venue_address: '', city: '', state: '', country: 'India',
  start_date: '', start_time: '10:00', end_date: '', end_time: '13:00',
  reg_deadline_date: '', reg_deadline_time: '23:59',
  is_free: true, price: '', currency: 'INR', max_attendees: '', online_link: '', is_private: false, show_attendees_public: true,
};

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLanguage, setAiLanguage] = useState('same');
  const [success, setSuccess] = useState(false);

  const set = (key: keyof FormState, val: unknown) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  useEffect(() => {
    if (!id) return;
    eventsApi.get(id).then(({ data }) => {
      const e = data as Event;
      const start = fromISO(e.start_date);
      const end = fromISO(e.end_date);
      const deadline = e.registration_deadline ? fromISO(e.registration_deadline) : { date: '', time: '23:59' };
      setForm({
        title: e.title || '',
        short_description: e.short_description || '',
        description: e.description || '',
        category_slug: e.category_slug || '',
        tags: e.tags || '',
        banner_url: e.banner_url || '',
        is_online: e.is_online,
        venue_name: e.venue_name || '',
        venue_address: e.venue_address || '',
        city: e.city || '',
        state: e.state || '',
        country: e.country || 'India',
        start_date: start.date,
        start_time: start.time,
        end_date: end.date,
        end_time: end.time,
        reg_deadline_date: deadline.date,
        reg_deadline_time: deadline.time,
        is_free: e.is_free,
        price: e.price ? String(e.price) : '',
        currency: e.currency || 'INR',
        max_attendees: e.max_attendees ? String(e.max_attendees) : '',
        online_link: e.online_link || '',
        is_private: Boolean(e.is_private),
        show_attendees_public: e.show_attendees_public !== false,
      });
    }).finally(() => setFetching(false));
  }, [id]);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.title.trim()) e.title = 'Event title is required';
    if (!form.city.trim() && !form.is_online) e.city = 'City is required for in-person events';
    if (!form.start_date) e.start_date = 'Start date is required';
    if (!form.end_date) e.end_date = 'End date is required';
    if (form.start_date && form.end_date) {
      const start = new Date(toISO(form.start_date, form.start_time));
      const end = new Date(toISO(form.end_date, form.end_time));
      if (end <= start) e.end_date = 'End date must be after start date';
    }
    if (!form.is_free && !form.price) e.price = 'Price is required for paid events';
    if (form.is_online && !form.online_link.trim()) e.online_link = 'Meeting link is required';
    return e;
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const { data } = await aiApi.generateEvent(aiPrompt, aiLanguage);
      const start = data.start_date ? fromISO(String(data.start_date)) : { date: '', time: '' };
      const end = data.end_date ? fromISO(String(data.end_date)) : { date: '', time: '' };
      const deadline = data.registration_deadline ? fromISO(String(data.registration_deadline)) : { date: '', time: '' };
      setForm((f) => ({
        ...f,
        title: String(data.title || f.title),
        description: String(data.description || f.description),
        short_description: String(data.short_description || f.short_description),
        city: String(data.city || f.city),
        state: String(data.state || f.state),
        venue_name: String(data.venue_name || f.venue_name),
        venue_address: String(data.venue_address || f.venue_address),
        country: String(data.country || f.country),
        start_date: start.date || f.start_date,
        start_time: start.time || f.start_time,
        end_date: end.date || f.end_date,
        end_time: end.time || f.end_time,
        reg_deadline_date: deadline.date || f.reg_deadline_date,
        reg_deadline_time: deadline.time || f.reg_deadline_time,
        is_free: data.is_free !== undefined ? Boolean(data.is_free) : f.is_free,
        price: data.price !== undefined ? String(data.price) : f.price,
        currency: String(data.currency || f.currency),
        max_attendees: data.max_attendees !== undefined && data.max_attendees !== null ? String(data.max_attendees) : f.max_attendees,
        is_online: data.is_online !== undefined ? Boolean(data.is_online) : f.is_online,
        online_link: String(data.online_link || f.online_link),
        is_private: data.is_private !== undefined ? Boolean(data.is_private) : f.is_private,
        show_attendees_public: data.show_attendees_public !== undefined ? Boolean(data.show_attendees_public) : f.show_attendees_public,
        banner_url: String(data.banner_url || f.banner_url),
        tags: String(data.tags || f.tags),
        category_slug: CATEGORY_SLUGS.includes(String(data.category_suggestion))
          ? String(data.category_suggestion) : f.category_slug,
      }));
      setAiPrompt('');
      setErrors({});  // clear validation errors after AI fill
    } catch { /* silent */ }
    finally { setAiLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstKey = Object.keys(errs)[0];
      document.getElementById(firstKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setLoading(true);
    try {
      await eventsApi.update(id!, {
        title: form.title, description: form.description,
        short_description: form.short_description,
        category_slug: form.category_slug || undefined,
        tags: form.tags, banner_url: form.banner_url || undefined,
        is_online: form.is_online, venue_name: form.venue_name,
        venue_address: form.venue_address, city: form.city,
        state: form.state, country: form.country,
        start_date: toISO(form.start_date, form.start_time),
        end_date: toISO(form.end_date, form.end_time),
        registration_deadline: form.reg_deadline_date
          ? toISO(form.reg_deadline_date, form.reg_deadline_time) : null,
        is_free: form.is_free,
        price: parseFloat(form.price) || 0,
        currency: form.currency,
        max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
        online_link: form.is_online ? form.online_link : null,
        is_private: form.is_private,
        show_attendees_public: form.show_attendees_public,
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setErrors({ title: msg || 'Failed to update event.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally { setLoading(false); }
  };

  if (fetching) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
    </div>
  );

  if (success) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Changes Saved!</h2>
        <p className="text-slate-500 mt-1 text-sm">Redirecting to your dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600">
              <CalendarDays className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Edit Event</h1>
              <p className="text-xs text-slate-500 truncate max-w-48">{form.title || 'Loading…'}</p>
            </div>
          </div>
          <button type="button" onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-slate-700 font-medium">Cancel</button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-5 rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-violet-50 p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <Wand2 className="h-4 w-4 text-brand-600" />
            <p className="text-sm font-semibold text-brand-700">AI Improve</p>
            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">Aria</span>
          </div>
          <div className="mb-2.5 flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">Output language</span>
            <select
              value={aiLanguage}
              onChange={(e) => setAiLanguage(e.target.value)}
              className="rounded-lg border border-brand-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-brand-400"
            >
              <option value="same">Same as prompt</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Tamil">Tamil</option>
              <option value="Telugu">Telugu</option>
            </select>
          </div>
          <div className="flex gap-2">
            <input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleAiGenerate()}
              placeholder="Describe changes in any language. AI can auto-fill title, text, date/time, pricing, and more."
              className="flex-1 rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
            <button type="button" onClick={() => void handleAiGenerate()} disabled={aiLoading || !aiPrompt.trim()}
              className="btn-primary px-4 rounded-xl disabled:opacity-50 shrink-0">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4 pb-24 md:pb-4">
          <Section title="Basic Information" icon={<Sparkles className="h-4 w-4 text-brand-600" />}>
            <div id="title">
              <Label className="text-sm font-medium text-slate-700">Event Title <span className="text-red-500">*</span></Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Amazing Tech Meetup 2026"
                className={cn('mt-1.5 rounded-xl', errors.title && 'border-red-400')} />
              <FieldError msg={errors.title} />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Short Description</Label>
              <Input value={form.short_description} onChange={(e) => set('short_description', e.target.value)} maxLength={150} className="mt-1.5 rounded-xl" />
              <p className="mt-1 text-xs text-slate-400">{form.short_description.length}/150</p>
            </div>
            <details className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">Advanced details</summary>
              <div className="mt-3 space-y-3">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Full Description</Label>
                  <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={5} className="mt-1.5 rounded-xl resize-none" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Tags</Label>
                  <Input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="tech, startup, networking" className="mt-1.5 rounded-xl" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700"><Image className="inline h-3.5 w-3.5 mr-1" />Banner Image URL</Label>
                  <Input value={form.banner_url} onChange={(e) => set('banner_url', e.target.value)} placeholder="https://..." className="mt-1.5 rounded-xl" />
                  {form.banner_url && (
                    <img src={form.banner_url} alt="Banner" className="mt-2 h-36 w-full object-cover rounded-xl border border-slate-200"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  )}
                </div>
              </div>
            </details>
          </Section>

          <Section title="Location & Date" icon={<MapPin className="h-4 w-4 text-rose-500" />}>
            <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl border border-slate-200 hover:bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-700">Online / Virtual Event</p>
                <p className="text-xs text-slate-500">Attendees join via a link</p>
              </div>
              <div className={cn('relative h-5 w-9 rounded-full transition-colors', form.is_online ? 'bg-brand-600' : 'bg-slate-200')}>
                <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', form.is_online ? 'translate-x-4' : 'translate-x-0.5')} />
                <input type="checkbox" checked={form.is_online} onChange={(e) => set('is_online', e.target.checked)} className="sr-only" />
              </div>
            </label>

            {form.is_online ? (
              <div id="online_link">
                <Label className="text-sm font-medium text-slate-700">Meeting Link <span className="text-red-500">*</span></Label>
                <Input value={form.online_link} onChange={(e) => set('online_link', e.target.value)} placeholder="https://meet.google.com/..."
                  className={cn('mt-1.5 rounded-xl', errors.online_link && 'border-red-400')} />
                <FieldError msg={errors.online_link} />
              </div>
            ) : (
              <>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Venue Name</Label>
                  <Input value={form.venue_name} onChange={(e) => set('venue_name', e.target.value)} placeholder="e.g. Microsoft Reactor" className="mt-1.5 rounded-xl" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Full Address</Label>
                  <Input value={form.venue_address} onChange={(e) => set('venue_address', e.target.value)} className="mt-1.5 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div id="city">
                    <Label className="text-sm font-medium text-slate-700">City <span className="text-red-500">*</span></Label>
                    <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Bengaluru"
                      className={cn('mt-1.5 rounded-xl', errors.city && 'border-red-400')} />
                    <FieldError msg={errors.city} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">State</Label>
                    <Input value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="Karnataka" className="mt-1.5 rounded-xl" />
                  </div>
                </div>
              </>
            )}

            <div id="start_date">
              <Label className="text-sm font-medium text-slate-700"><CalendarDays className="inline h-3.5 w-3.5 mr-1 text-brand-500" />Start Date & Time <span className="text-red-500">*</span></Label>
              <input
                type="datetime-local"
                value={toDateTimeLocal(form.start_date, form.start_time)}
                onChange={(e) => {
                  const dt = fromDateTimeLocal(e.target.value);
                  set('start_date', dt.date);
                  set('start_time', dt.time);
                }}
                className={cn('mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 cursor-pointer', errors.start_date ? 'border-red-400' : 'border-slate-200')}
              />
              <FieldError msg={errors.start_date} />
            </div>

            <div id="end_date">
              <Label className="text-sm font-medium text-slate-700"><CalendarDays className="inline h-3.5 w-3.5 mr-1 text-rose-400" />End Date & Time <span className="text-red-500">*</span></Label>
              <input
                type="datetime-local"
                value={toDateTimeLocal(form.end_date, form.end_time)}
                onChange={(e) => {
                  const dt = fromDateTimeLocal(e.target.value);
                  set('end_date', dt.date);
                  set('end_time', dt.time);
                }}
                className={cn('mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 cursor-pointer', errors.end_date ? 'border-red-400' : 'border-slate-200')}
              />
              <FieldError msg={errors.end_date} />
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Registration Deadline <span className="text-slate-400 font-normal">(optional)</span></Label>
              <input
                type="datetime-local"
                value={toDateTimeLocal(form.reg_deadline_date, form.reg_deadline_time)}
                onChange={(e) => {
                  const dt = fromDateTimeLocal(e.target.value);
                  set('reg_deadline_date', dt.date);
                  set('reg_deadline_time', dt.time);
                }}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-200 cursor-pointer"
              />
            </div>
          </Section>

          <Section title="Tickets & Capacity" icon={<DollarSign className="h-4 w-4 text-emerald-600" />} defaultOpen={false}>
            <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl border border-slate-200 hover:bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-700">Free Event</p>
                <p className="text-xs text-slate-500">No ticket price for attendees</p>
              </div>
              <div className={cn('relative h-5 w-9 rounded-full transition-colors', form.is_free ? 'bg-emerald-500' : 'bg-slate-200')}>
                <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', form.is_free ? 'translate-x-4' : 'translate-x-0.5')} />
                <input type="checkbox" checked={form.is_free} onChange={(e) => set('is_free', e.target.checked)} className="sr-only" />
              </div>
            </label>

            {!form.is_free && (
              <div id="price" className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Ticket Price <span className="text-red-500">*</span></Label>
                  <Input type="number" min="1" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="499"
                    className={cn('mt-1.5 rounded-xl', errors.price && 'border-red-400')} />
                  <FieldError msg={errors.price} />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Currency</Label>
                  <select value={form.currency} onChange={(e) => set('currency', e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-200">
                    <option value="INR">INR ₹</option>
                    <option value="USD">USD $</option>
                    <option value="EUR">EUR €</option>
                    <option value="GBP">GBP £</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium text-slate-700"><Users className="inline h-3.5 w-3.5 mr-1" />Max Attendees <span className="text-slate-400 font-normal">(blank = unlimited)</span></Label>
              <Input type="number" min="1" value={form.max_attendees} onChange={(e) => set('max_attendees', e.target.value)} placeholder="e.g. 100" className="mt-1.5 rounded-xl" />
            </div>

            <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl border border-slate-200 hover:bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-700">Private Event</p>
                <p className="text-xs text-slate-500">Hidden from public listings. Only people with the event link can view and join.</p>
              </div>
              <div className={cn('relative h-5 w-9 rounded-full transition-colors', form.is_private ? 'bg-brand-600' : 'bg-slate-200')}>
                <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', form.is_private ? 'translate-x-4' : 'translate-x-0.5')} />
                <input type="checkbox" checked={form.is_private} onChange={(e) => set('is_private', e.target.checked)} className="sr-only" />
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl border border-slate-200 hover:bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-700">Show attendee list publicly</p>
                <p className="text-xs text-slate-500">Others can see who's going to your event</p>
              </div>
              <div className={cn('relative h-5 w-9 rounded-full transition-colors', form.show_attendees_public ? 'bg-brand-600' : 'bg-slate-200')}>
                <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', form.show_attendees_public ? 'translate-x-4' : 'translate-x-0.5')} />
                <input type="checkbox" checked={form.show_attendees_public} onChange={(e) => set('show_attendees_public', e.target.checked)} className="sr-only" />
              </div>
            </label>
          </Section>

          <div className="hidden gap-3 pb-8 md:flex">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <AiAssistant context="User is editing an event. Help them improve descriptions or update details."
        onEventDataExtracted={(data) => {
          setForm((f) => ({
            ...f,
            title: String(data.title || f.title),
            description: String(data.description || f.description),
            short_description: String(data.short_description || f.short_description),
            city: String(data.city || f.city),
          }));
        }}
      />
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-2xl gap-2">
          <button type="button" onClick={() => navigate(-1)} className="w-1/3 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700">
            Cancel
          </button>
          <button type="button" onClick={() => {
            const formEl = document.querySelector('form');
            formEl?.requestSubmit();
          }} disabled={loading} className="w-2/3 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
