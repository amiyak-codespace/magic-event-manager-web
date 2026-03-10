import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Ticket, Plus, Trash2, Edit2, Check, X, Users, Clock } from 'lucide-react';

interface TicketType {
  id: string; name: string; description: string; price: number; currency: string;
  capacity: number | null; sold_count: number; is_free: boolean;
  sale_start: string | null; sale_end: string | null;
}

interface Props { eventId: string; isOrganizer: boolean; onSelect?: (tt: TicketType) => void; selectedId?: string; }

export default function TicketTypesSection({ eventId, isOrganizer, onSelect, selectedId }: Props) {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState({ name:'', description:'', price:0, capacity:'', is_free:true, sale_end:'' });

  const load = async () => { const res = await api.get(`/events/${eventId}/tickets`).catch(()=>({ data: [] }));
    const d = res.data; setTickets(d||[]); };
  useEffect(() => { load(); }, [eventId]);

  const save = async () => {
    if (!form.name) return;
    const payload = { ...form, price: form.is_free ? 0 : Number(form.price), capacity: form.capacity ? Number(form.capacity) : null, is_free: form.is_free };
    if (editId) await api.put(`/events/${eventId}/tickets/${editId}`, payload);
    else await api.post(`/events/${eventId}/tickets`, payload);
    setAdding(false); setEditId(null); setForm({ name:'', description:'', price:0, capacity:'', is_free:true, sale_end:'' }); load();
  };

  const del = async (id: string) => { await api.delete(`/events/${eventId}/tickets/${id}`); load(); };
  const startEdit = (t: TicketType) => { setEditId(t.id); setForm({ name:t.name, description:t.description||'', price:t.price||0, capacity: t.capacity?.toString()||'', is_free:t.is_free, sale_end:t.sale_end?.slice(0,16)||'' }); setAdding(true); };

  if (tickets.length === 0 && !isOrganizer) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Ticket size={20} className="text-indigo-600"/> Tickets</h2>
        {isOrganizer && (
          <button onClick={() => { setAdding(!adding); setEditId(null); setForm({ name:'', description:'', price:0, capacity:'', is_free:true, sale_end:'' }); }}
            className="flex items-center gap-1 text-sm text-indigo-600 font-medium hover:underline"><Plus size={14}/> Add Ticket Type</button>
        )}
      </div>

      {adding && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 space-y-3">
          <h3 className="font-semibold">{editId ? 'Edit' : 'Add'} Ticket Type</h3>
          <div className="grid grid-cols-2 gap-3">
            <input className="border rounded-lg px-3 py-2 text-sm col-span-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Name * (e.g. General, VIP, Early Bird)" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/>
            <input className="border rounded-lg px-3 py-2 text-sm col-span-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Description (optional)" value={form.description} onChange={e => setForm({...form, description: e.target.value})}/>
            <label className="col-span-2 flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_free} onChange={e => setForm({...form, is_free: e.target.checked})} className="rounded"/> Free Ticket
            </label>
            {!form.is_free && <input className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" type="number" placeholder="Price (₹)" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})}/>}
            <input className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${!form.is_free ? '' : 'col-span-2'}`} placeholder="Capacity (leave blank for unlimited)" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})}/>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Sale ends</label>
              <input className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500" type="datetime-local" value={form.sale_end} onChange={e => setForm({...form, sale_end: e.target.value})}/>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setAdding(false); setEditId(null); }} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"><X size={14}/></button>
            <button onClick={save} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"><Check size={14}/> Save</button>
          </div>
        </div>
      )}

      {tickets.length === 0 && isOrganizer && (
        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">No ticket types yet. Add Free, Paid, VIP, or Early Bird tickets.</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {tickets.map(t => {
          const remaining = t.capacity ? t.capacity - t.sold_count : null;
          const soldOut = remaining !== null && remaining <= 0;
          const isSelected = selectedId === t.id;
          return (
            <div key={t.id}
              onClick={() => !soldOut && onSelect && onSelect(t)}
              className={`border rounded-xl p-4 transition-all ${onSelect && !soldOut ? 'cursor-pointer hover:shadow-md hover:border-indigo-400' : ''} ${isSelected ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-400' : 'bg-white'} ${soldOut ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{t.name}</h4>
                  {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`text-lg font-bold ${t.is_free ? 'text-green-600' : 'text-gray-900'}`}>
                      {t.is_free ? 'Free' : `₹${Number(t.price).toLocaleString('en-IN')}`}
                    </span>
                    {remaining !== null && (
                      <span className={`text-xs flex items-center gap-1 ${remaining <= 10 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        <Users size={11}/>{soldOut ? 'Sold Out' : `${remaining} left`}
                      </span>
                    )}
                    {t.sale_end && new Date(t.sale_end) > new Date() && (
                      <span className="text-xs text-amber-600 flex items-center gap-1"><Clock size={11}/> Sale ends {new Date(t.sale_end).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                {isOrganizer && (
                  <div className="flex gap-1 ml-2">
                    <button onClick={e => { e.stopPropagation(); startEdit(t); }} className="p-1 text-gray-400 hover:text-indigo-600"><Edit2 size={13}/></button>
                    <button onClick={e => { e.stopPropagation(); del(t.id); }} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={13}/></button>
                  </div>
                )}
              </div>
              {isSelected && <div className="mt-2 text-xs text-indigo-600 font-semibold">✓ Selected</div>}
              {soldOut && <div className="mt-2 text-xs text-red-500 font-semibold">Sold Out</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
