import { SEO } from '@/components/SEO';

export default function LegalTermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title="Terms of Service | AppsMagic Events" description="Terms of Service for events.appsmagic.in" path="/legal/terms" />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <h1 className="text-2xl font-extrabold text-slate-900">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-500">Effective date: March 8, 2026</p>
          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
            <p>By using AppsMagic Events, you agree to use the service lawfully and not misuse attendee data, campaign tools, or event links.</p>
            <p>You are responsible for obtaining valid consent before importing contacts or sending campaigns.</p>
            <p>We may suspend abusive, fraudulent, or policy-violating accounts.</p>
            <p>Service is provided on a best-effort basis and may be updated over time.</p>
            <p>For legal questions, contact admin@appsmagic.in.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
