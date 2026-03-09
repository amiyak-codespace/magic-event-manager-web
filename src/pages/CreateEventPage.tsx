import { FormEvent, useState } from 'react';
import { createEvent } from '../api/events';
import { useNavigate } from 'react-router-dom';

export default function CreateEventPage() {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await createEvent({ name, date });
      navigate(`/events/${created.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input className="w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Date</label>
        <input type="datetime-local" className="w-full border rounded px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <button disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{saving ? 'Creating...' : 'Create'}</button>
    </form>
  );
}
