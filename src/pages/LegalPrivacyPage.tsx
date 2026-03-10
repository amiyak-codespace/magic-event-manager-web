import { SEO } from '@/components/SEO';

export default function LegalPrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title="Privacy Policy | AppsMagic Events" description="Privacy policy for events.appsmagic.in" path="/legal/privacy" />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <h1 className="text-2xl font-extrabold text-slate-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-500">Effective date: March 8, 2026</p>
          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
            <p>We collect account details, event data, RSVP information, and security logs to operate the platform.</p>
            <p>Campaigns require consent signals. Non-consented recipients are blocked from compliant sends.</p>
            <p>You can unsubscribe from campaign emails using the unsubscribe link in campaign messages.</p>
            <p>We use service providers for email, messaging, analytics, and hosting to run the service.</p>
            <p>For privacy requests, contact admin@appsmagic.in.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
