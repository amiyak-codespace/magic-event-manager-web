import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createTemplate, previewTemplate } from '../api/campaignTemplates';

type Channel = 'email' | 'whatsapp' | 'sms';

export default function CampaignTemplateBuilderPage() {
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<Channel>('email');
  const [subject, setSubject] = useState('Welcome {{name}}');
  const [body, setBody] = useState('<p>Hello {{name}},</p>\n<p>Your event {{event.title}} is on {{event.date}}.</p>');
  const [variablesText, setVariablesText] = useState(JSON.stringify({ name: 'Amiya', event: { title: 'Launch', date: '2026-03-15' } }, null, 2));
  const [saving, setSaving] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ channel: Channel; subject?: string; body: string } | null>(null);
  const variables: Record<string, any> = useMemo(() => {
    try {
      return JSON.parse(variablesText);
    } catch {
      return {};
    }
  }, [variablesText]);

  useEffect(() => {
    const id = templateId;
    const timeout = setTimeout(() => {
      if (id) {
        previewTemplate(id, variables).then(setPreview).catch(() => setPreview(null));
      } else {
        setPreview(null);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [templateId, variables]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await createTemplate({ name, channel, subject: channel === 'email' ? subject : undefined, body });
      setTemplateId(created.id);
      const p = await previewTemplate(created.id, variables);
      setPreview(p);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input className="w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Channel</label>
          <select className="w-full border rounded px-3 py-2" value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
          </select>
        </div>
        {channel === 'email' && (
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input className="w-full border rounded px-3 py-2" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Body</label>
          <textarea className="w-full border rounded px-3 py-2 h-48 font-mono" value={body} onChange={(e) => setBody(e.target.value)} />
          <p className="text-xs text-gray-500 mt-1">Use placeholders like {'{{name}}'} and nested {'{{event.title}}'}.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Variables (JSON for preview)</label>
          <textarea className="w-full border rounded px-3 py-2 h-40 font-mono" value={variablesText} onChange={(e) => setVariablesText(e.target.value)} />
        </div>
        <button disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{templateId ? 'Update Preview' : 'Save & Preview'}</button>
      </form>

      <div>
        <div className="rounded border bg-white p-4 shadow-sm">
          <h2 className="font-semibold mb-3">Preview</h2>
          {!preview && <p className="text-sm text-gray-500">Save the template to preview.</p>}
          {preview && (
            <div className="space-y-3">
              <div className="text-xs text-gray-500 uppercase">{preview.channel}</div>
              {preview.subject && <div className="border rounded p-2 bg-gray-50"><strong>Subject:</strong> {preview.subject}</div>}
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: preview.body }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

