import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Clock, MapPin, Mic, Plus, Trash2, Edit2, Check, X, Coffee } from 'lucide-react';

interface AgendaItem {
  id: string; title: string; description: string; speaker_name: string;
  speaker_title: string; start_time: string; end_time: string;
  location: string; type: string;
}

const TYPE_ICONS: Record<string, any> = { talk: Mic, workshop: Edit2, break: Coffee, networking: MapPin, keynote: Mic, panel: Mic };
const TYPE_COLORS: Record<string, string> = { talk: 'bg-blue-100 text-blue-700', workshop: 'bg-purple-100 text-purple-700', break: 'bg-gray-100 text-gray-600', networking: 'bg-green-100 text-green-700', keynote: 'bg-amber-100 text-amber-700', panel: 'bg-indigo-100 text-indigo-700' };

interface Props { eventId: string; isOrganizer: boolean; }

export default function AgendaSection({ eventId, isOrganizer }: Props) {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', speaker_name: '', speaker_title: '', start_time: '', end_time: '', location: '', type: 'talk' });

  const load = async () => {
    const agendaResult = await api.get(`/events/${eventId}/agenda`).catch(() => null);
    const d = agendaResult ? agendaResult.data : [];
    setItems(d || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [eventId]);

  const save = async () => {
    if (!form.title || !form.start_time) return;
    if (editId) {
      await api.put(`/events/${eventId}/agenda/${editId}`, form);
    } else {
      await api.post(`/events/${eventId}/agenda`, form);
    }
    setAdding(false); setEditId(null);
    setForm({ title: '', description: '', speaker_name: '', speaker_title: '', start_time: '', end_time: '', location: '', type: 'talk' });
    load();
  };

  const del = async (id: string) => {
    await api.delete(`/events/${eventId}/agenda/${id}`);
    load();
  };

  const startEdit = (item: AgendaItem) => {
    setEditId(item.id);
    setForm({ title: item.title, description: item.description || '', speaker_name: item.speaker_name || '', speaker_title: item.speaker_title || '', start_time: item.start_time?.slice(0,16) || '', end_time: item.end_time?.slice(0,16) || '', location: item.location || '', type: item.type || 'talk' });
    setAdding(true);
  };

  if (loading) return <div className="animate-pulse h-24 bg-gray-100 rounded-xl"/>;
  if (items.length === 0 && !isOrganizer) return null;

  const grouped: Record<string, AgendaItem[]> = {};
  items.forEach(item => {
    const day = item.start_time ? new Date(item.start_time).toDateString() : 'TBD';
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(item);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Schedule / Agenda</h2>
        {isOrganizer && (
          <button onClick={() => { setAdding(!adding); setEditId(null); setForm({ title: '', description: '', speaker_name: '', speaker_title: '', start_time: '', end_time: '', location: '', type: 'talk' }); }}
            className="flex items-center gap-1 text-sm text-indigo-600 font-medium hover:underline">
            <Plus size={14}/> Add Item
          </button>
        )}
      </div>

      {adding && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 space-y-3">
          <h3 className="font-semibold text-gray-800">{editId ? 'Edit' : 'Add'} Agenda Item</h3>
          <div className="grid grid-cols-2 gap-3">
            <input className="border rounded-lg px-3 py-2 text-sm col-span-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})}/>
            <input className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" type="datetime-local" placeholder="Start Time *" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})}/>
            <input className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" type="datetime-local" placeholder="End Time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})}/>
            <input className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Speaker Name" value={form.speaker_name} onChange={e => setForm({...form, speaker_name: e.target.value})}/>
            <input className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Speaker Title/Role" value={form.speaker_title} onChange={e => setForm({...form, speaker_title: e.target.value})}/>
            <input className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Room / Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})}/>
            <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              {['talk','keynote','panel','workshop','break','networking'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </div>
          <textarea className="border rounded-lg px-3 py-2 text-sm w-full resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Description (optional)" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})}/>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setAdding(false); setEditId(null); }} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"><X size={14}/></button>
            <button onClick={save} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"><Check size={14}/> Save</button>
          </div>
        </div>
      )}

      {Object.keys(grouped).length === 0 && isOrganizer && (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
          No agenda items yet. Add sessions, talks, breaks, etc.
        </div>
      )}

      {Object.entries(grouped).map(([day, dayItems]) => (
        <div key={day} className="mb-6">
          <div className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-200"/>
            <span>{day}</span>
            <div className="h-px flex-1 bg-gray-200"/>
          </div>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"/>
            <div className="space-y-3">
              {dayItems.map(item => {
                const TypeIcon = TYPE_ICONS[item.type] || Mic;
                return (
                  <div key={item.id} className="flex gap-4 relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${TYPE_COLORS[item.type] || 'bg-gray-100 text-gray-600'}`}>
                      <TypeIcon size={16}/>
                    </div>
                    <div className="flex-1 bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-gray-900">{item.title}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[item.type] || 'bg-gray-100 text-gray-600'}`}>{item.type}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                            {item.start_time && <span className="flex items-center gap-1"><Clock size={10}/>{new Date(item.start_time).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}{item.end_time ? ' – '+new Date(item.end_time).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : ''}</span>}
                            {item.location && <span className="flex items-center gap-1"><MapPin size={10}/>{item.location}</span>}
                          </div>
                          {item.speaker_name && <p className="text-sm text-indigo-600 font-medium mt-1">{item.speaker_name}{item.speaker_title ? ` · ${item.speaker_title}` : ''}</p>}
                          {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                        </div>
                        {isOrganizer && (
                          <div className="flex gap-1">
                            <button onClick={() => startEdit(item)} className="p-1 text-gray-400 hover:text-indigo-600"><Edit2 size={14}/></button>
                            <button onClick={() => del(item.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
