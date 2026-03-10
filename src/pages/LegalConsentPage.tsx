import { SEO } from '@/components/SEO';

export default function LegalConsentPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title="Consent Policy | AppsMagic Events" description="Communication consent policy for campaigns and notifications." path="/legal/consent" />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <h1 className="text-2xl font-extrabold text-slate-900">Consent & Communications Policy</h1>
          <p className="mt-2 text-sm text-slate-500">Effective date: March 8, 2026</p>
          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
            <p>RSVP notifications: attendees must provide phone and explicit notification consent before accepting an event.</p>
            <p>Campaigns: imported recipients require organizer confirmation that valid consent exists.</p>
            <p>Email campaigns include an unsubscribe link. Unsubscribed emails are automatically excluded from future sends.</p>
            <p>Organizers must comply with local anti-spam, marketing, and privacy laws in their region.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
