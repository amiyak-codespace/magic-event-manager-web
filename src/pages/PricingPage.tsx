import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Building2, Users, Sparkles, ArrowRight, Star } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { billingApi } from '@/lib/api';
import { SEO } from '@/components/SEO';

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Perfect for trying out AppsMagic Events',
    color: 'from-slate-500 to-slate-600',
    badge: null,
    features: [
      'Up to 3 events',
      '50 attendees per event',
      'Basic RSVP management',
      'QR ticket generation',
      'Event comments',
      'Share & social links',
    ],
    cta: 'Get Started Free',
    ctaVariant: 'secondary',
  },
  {
    name: 'Pro',
    price: '₹499',
    period: 'per month',
    description: 'For active organizers and growing communities',
    color: 'from-violet-500 to-brand-600',
    badge: 'Most Popular',
    features: [
      'Unlimited events',
      '500 attendees per event',
      'Email invites & RSVP confirmations',
      'Attendee CSV export',
      'Event analytics & view tracking',
      'Waitlist management',
      'Duplicate events',
      'Private / password-protected events',
      'Add to Calendar (.ics)',
      'Priority support',
    ],
    cta: 'Start Pro Trial',
    ctaVariant: 'primary',
  },
  {
    name: 'Business',
    price: '₹1,999',
    period: 'per month',
    description: 'For enterprises, agencies & large-scale events',
    color: 'from-amber-500 to-orange-600',
    badge: 'Best Value',
    features: [
      'Everything in Pro',
      'Unlimited attendees',
      'Paid ticketing (Razorpay)',
      'Event agenda & schedule builder',
      'Speaker profile cards',
      'Discount / promo codes',
      'Co-organizer access',
      'Custom registration forms',
      'White-label event pages',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    ctaVariant: 'gold',
  },
];

const FAQS = [
  { q: 'Can I upgrade or downgrade anytime?', a: 'Yes, you can change your plan at any time. Upgrades take effect immediately; downgrades apply at the next billing cycle.' },
  { q: 'Is there a free trial for Pro?', a: 'Yes — Pro comes with a 14-day free trial, no credit card required.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards, UPI, and net banking via Razorpay.' },
  { q: 'Can I host paid events on Free plan?', a: 'Paid ticketing (Razorpay integration) is a Business-tier feature. Free and Pro plans support free events only.' },
  { q: 'Do unused attendee slots roll over?', a: 'Attendee limits are per-event, not monthly. You can create new events fresh each time.' },
];

export default function PricingPage() {
  const FREE_UNLIMITED_OFFER = true;
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [myPlanCode, setMyPlanCode] = useState<string | null>(null);
  const [apiPlans, setApiPlans] = useState<Array<{
    id: string;
    code: string;
    name: string;
    description?: string | null;
    price_inr: number;
    interval_months: number;
    features_json?: unknown;
    is_active?: boolean;
  }>>([]);

  useEffect(() => {
    billingApi.publicPlans().then(({ data }) => {
      setApiPlans((data as typeof apiPlans) || []);
    }).catch(() => {});
    if (!isAuthenticated()) return;
    billingApi.myPlan()
      .then(({ data }) => setMyPlanCode((data as { plan_code?: string } | null)?.plan_code || null))
      .catch(() => {});
  }, [isAuthenticated]);

  const plansToRender = useMemo(() => {
    if (!apiPlans.length) return PLANS.map((p) => ({
      id: p.name.toLowerCase(),
      code: p.name.toLowerCase(),
      name: p.name,
      price_inr: p.name === 'Free' ? 0 : (p.name === 'Pro' ? 499 : 1999),
      interval_months: 1,
      description: p.description,
      features_json: p.features,
    }));
    return apiPlans.map((p) => ({
      ...p,
      features_json: Array.isArray(p.features_json) ? p.features_json : [],
    }));
  }, [apiPlans]);

  const ensureRazorpayScript = async () => {
    if (window.Razorpay) return;
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load payment sdk'));
      document.body.appendChild(s);
    });
  };

  const handleCheckout = async (planCode: string, planName: string) => {
    const code = String(planCode || '').trim().toLowerCase();
    if (!code) return;
    if (!isAuthenticated()) { navigate('/register?role=organizer'); return; }
    if (FREE_UNLIMITED_OFFER) {
      navigate(isAuthenticated() ? '/events/create' : '/register?role=organizer');
      return;
    }
    setBusyPlan(planName);
    setNotice('');
    try {
      const { data } = await billingApi.createOrder(code);
      const order = data as {
        local_order_id: string; order_id: string; amount: number; currency: string; key: string; mock: boolean; plan: { name: string };
      };
      if (order.mock) {
        await billingApi.verifyOrder({
          local_order_id: order.local_order_id,
          razorpay_order_id: order.order_id,
          razorpay_payment_id: `mock_payment_${Date.now()}`,
          razorpay_signature: 'mock',
        });
        setNotice(`Plan upgraded to ${planName}.`);
        setMyPlanCode(code);
        return;
      }
      await ensureRazorpayScript();
      if (!window.Razorpay) throw new Error('Payment sdk unavailable');
      const rz = new window.Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'AppsMagic Events',
        description: `${order.plan.name} Subscription`,
        order_id: order.order_id,
        prefill: { name: user?.name || '', email: user?.email || '' },
        handler: async (resp: Record<string, string>) => {
          await billingApi.verifyOrder({
            local_order_id: order.local_order_id,
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          });
          setNotice(`Plan upgraded to ${planName}.`);
          setMyPlanCode(code);
        },
      });
      rz.open();
    } catch (e) {
      setNotice((e as Error).message || 'Checkout failed');
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title="Pricing | AppsMagic Events"
        description="Compare plans for event organizers. Start free and scale with pro features."
        path="/pricing"
      />
      {/* Hero */}
      <section className="relative gradient-mesh overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-violet-400/30 blur-3xl animate-pulse-slow" />
          <div className="absolute top-20 -left-20 h-48 w-48 rounded-full bg-indigo-300/20 blur-3xl animate-pulse-slow [animation-delay:1s]" />
        </div>
        <div className="container relative mx-auto px-4 py-16 text-center">
          {FREE_UNLIMITED_OFFER && (
            <div className="mx-auto mb-4 max-w-2xl rounded-xl border border-emerald-300/50 bg-emerald-400/20 px-4 py-2 text-xs font-bold text-emerald-50">
              FREE OFFER LIVE: Open account and host unlimited events at no cost.
            </div>
          )}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
            <Zap className="h-3.5 w-3.5 text-yellow-300" />
            <span className="text-xs font-semibold text-white/90">Simple, transparent pricing</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Pricing that grows <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">with you</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/80">
            Start free, upgrade when you need more. No hidden fees, no surprises.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plansToRender.map((plan) => {
            const features = Array.isArray(plan.features_json) ? plan.features_json as string[] : [];
            const isFree = String(plan.code).toLowerCase() === 'free';
            const label = isFree ? 'Free' : plan.name;
            const displayPrice = FREE_UNLIMITED_OFFER ? '₹0' : (isFree ? '₹0' : `₹${Number(plan.price_inr || 0).toLocaleString()}`);
            const cta = FREE_UNLIMITED_OFFER ? 'Start Free Unlimited' : (isFree ? 'Get Started Free' : 'Upgrade');
            return (
            <div
              key={plan.id || plan.code}
              className={`relative rounded-3xl bg-white border shadow-sm hover:shadow-lg transition-all flex flex-col ${
                String(plan.code).toLowerCase() === 'pro'
                  ? 'border-violet-300 shadow-violet-100 scale-[1.02] ring-2 ring-violet-200'
                  : 'border-slate-200'
              }`}
            >
              {String(plan.code).toLowerCase() === 'pro' && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-500 to-brand-600 px-4 py-1 text-xs font-bold text-white shadow-md">
                    <Star className="h-3 w-3 fill-white" /> Most Popular
                  </span>
                </div>
              )}

              <div className="p-6 flex-1">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-brand-600 mb-4">
                  {isFree ? <Users className="h-5 w-5 text-white" /> :
                   String(plan.code).toLowerCase() === 'pro' ? <Sparkles className="h-5 w-5 text-white" /> :
                   <Building2 className="h-5 w-5 text-white" />}
                </div>

                <h3 className="text-lg font-bold text-slate-900">{label}</h3>
                <p className="text-xs text-slate-500 mt-0.5 mb-4">{plan.description}</p>

                <div className="flex items-end gap-1.5 mb-6">
                  <span className="text-3xl font-black text-slate-900">{displayPrice}</span>
                  <span className="text-sm text-slate-400 pb-1">/{Number(plan.interval_months || 1)} mo</span>
                </div>

                <ul className="space-y-2.5">
                  {(features.length ? features : ['Unlimited events', 'Unlimited attendees']).map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => {
                    if (isFree || FREE_UNLIMITED_OFFER) {
                      navigate(isAuthenticated() ? '/events/create' : '/register');
                      return;
                    }
                    void handleCheckout(plan.code, label);
                  }}
                  disabled={busyPlan === label}
                  className="w-full rounded-xl py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-brand-600 text-white hover:opacity-90 shadow-md"
                >
                  {busyPlan === label
                    ? 'Processing...'
                    : (FREE_UNLIMITED_OFFER ? cta : (myPlanCode === plan.code ? 'Current Plan' : cta))} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            );
          })}
        </div>
        {notice && <p className="text-center mt-4 text-sm text-slate-600">{notice}</p>}

        {/* Comparison note */}
        <p className="text-center text-xs text-slate-400 mt-8">
          All plans include SSL security, 99.9% uptime SLA, and AWS-hosted infrastructure.
        </p>
      </section>

      {/* Feature comparison table */}
      <section className="bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h2 className="text-xl font-extrabold text-slate-900 text-center mb-4">Full feature comparison</h2>
          <p className="mb-4 text-center text-xs text-slate-500 md:hidden">Tap to open full comparison</p>
          <details className="md:block">
            <summary className="mb-3 cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 md:hidden">
              Show comparison table
            </summary>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 pr-4 text-slate-500 font-medium w-1/2">Feature</th>
                  <th className="text-center py-3 px-4 text-slate-700 font-bold">Free</th>
                  <th className="text-center py-3 px-4 text-violet-700 font-bold">Pro</th>
                  <th className="text-center py-3 px-4 text-amber-700 font-bold">Business</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  ['Events', '3', 'Unlimited', 'Unlimited'],
                  ['Attendees per event', '50', '500', 'Unlimited'],
                  ['QR Ticket system', '✓', '✓', '✓'],
                  ['RSVP & comments', '✓', '✓', '✓'],
                  ['Waitlist management', '—', '✓', '✓'],
                  ['Email invites', '—', '✓', '✓'],
                  ['Add to Calendar', '—', '✓', '✓'],
                  ['Attendee CSV export', '—', '✓', '✓'],
                  ['Analytics & view tracking', '—', '✓', '✓'],
                  ['Duplicate events', '—', '✓', '✓'],
                  ['Private events', '—', '✓', '✓'],
                  ['Paid ticketing', '—', '—', '✓'],
                  ['Agenda builder', '—', '—', '✓'],
                  ['Speaker profiles', '—', '—', '✓'],
                  ['Promo / discount codes', '—', '—', '✓'],
                  ['Custom RSVP forms', '—', '—', '✓'],
                  ['White-label pages', '—', '—', '✓'],
                ].map(([feature, free, pro, biz]) => (
                  <tr key={feature} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4 text-slate-700">{feature}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{free}</td>
                    <td className="py-3 px-4 text-center text-violet-600 font-medium">{pro}</td>
                    <td className="py-3 px-4 text-center text-amber-600 font-medium">{biz}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </details>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16 max-w-2xl">
        <h2 className="text-xl font-extrabold text-slate-900 text-center mb-8">Frequently asked questions</h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <details key={i} className="group rounded-2xl border border-slate-200 bg-white">
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-slate-800 list-none">
                {faq.q}
                <span className="text-slate-400 group-open:rotate-180 transition-transform text-lg leading-none">+</span>
              </summary>
              <p className="px-5 pb-4 text-sm text-slate-500 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-16">
        <div className="relative gradient-mesh rounded-3xl overflow-hidden p-8 md:p-12 text-center">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-pink-400/20 blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">Start free today</h2>
            <p className="text-white/80 text-sm max-w-md mx-auto mb-6">No credit card required. Upgrade when your events grow.</p>
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-lg hover:bg-white/90 transition-colors"
            >
              <Sparkles className="h-4 w-4" /> Create Free Account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
