import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, ExternalLink, Edit2, Check, X } from 'lucide-react';

interface Sponsor { id: string; name: string; logo_url: string; website_url: string; tier: string; description: string; }
const TIER_STYLES: Record<string, string> = { platinum: 'text-slate-700 bg-slate-100 border-slate-300', gold: 'text-yellow-700 bg-yellow-50 border-yellow-300', silver: 'text-gray-600 bg-gray-50 border-gray-300', bronze: 'text-orange-700 bg-orange-50 border-orange-300', community: 'text-green-700 bg-green-50 border-green-300' };
const TIER_ORDER = ['platinum','gold','silver','bronze','community'];

interface Props { eventId: string; isOrganizer: boolean; }

export default function SponsorsSection({ eventId, isOrganizer }: Props) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState({ name:'', logo_url:'', website_url:'', tier:'silver', description:'' });

  const load = async () => { const res = await api.get(`/events/${eventId}/sponsors`).catch(()=>({ data: [] }));
    const d = res.data; setSponsors(d||[]); };
  useEffect(() => { load(); }, [eventId]);

  const save = async () => {
    if (!form.name) return;
    if (editId) await api.put(`/events/${eventId}/sponsors/${editId}`, form);
    else await api.post(`/events/${eventId}/sponsors`, form);
    setAdding(false); setEditId(null); setForm({ name:'', logo_url:'', website_url:'', tier:'silver', description:'' }); load();
  };

  const del = async (id: string) => { await api.delete(`/events/${eventId}/sponsors/${id}`); load(); };
  const startEdit = (s: Sponsor) => { setEditId(s.id); setForm({ name:s.name, logo_url:s.logo_url||'', website_url:s.website_url||'', tier:s.tier, description:s.description||'' }); setAdding(true); };

  if (sponsors.length === 0 && !isOrganizer) return null;

  const grouped: Record<string, Sponsor[]> = {};
  TIER_ORDER.forEach(t => { const g = sponsors.filter(s => s.tier === t); if (g.length) grouped[t] = g; });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Sponsors</h2>
        {isOrganizer && (
          <button onClick={() => { setAdding(!adding); setEditId(null); setForm({ name:'', logo_url:'', website_url:'', tier:'silver', description:'' }); }}
            className="flex items-center gap-1 text-sm text-indigo-600 font-medium hover:underline"><Plus size={14}/> Add Sponsor</button>
        )}
      </div>

      {adding && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 space-y-3">
          <h3 className="font-semibold">{editId ? 'Edit' : 'Add'} Sponsor</h3>
          <div className="grid grid-cols-2 gap-3">
            <input className="border rounded-lg px-3 py-2 text-sm col-span-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Sponsor Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/>
            <input className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Logo URL" value={form.logo_url} onChange={e => setForm({...form, logo_url: e.target.value})}/>
            <input className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Website URL" value={form.website_url} onChange={e => setForm({...form, website_url: e.target.value})}/>
            <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 col-span-2" value={form.tier} onChange={e => setForm({...form, tier: e.target.value})}>
              {TIER_ORDER.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
            <input className="border rounded-lg px-3 py-2 text-sm col-span-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Short description (optional)" value={form.description} onChange={e => setForm({...form, description: e.target.value})}/>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setAdding(false); setEditId(null); }} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"><X size={14}/></button>
            <button onClick={save} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"><Check size={14}/> Save</button>
          </div>
        </div>
      )}

      {sponsors.length === 0 && isOrganizer && (
        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">Add sponsors to showcase your event partners</div>
      )}

      {Object.entries(grouped).map(([tier, tierSponsors]) => (
        <div key={tier} className="mb-6">
          <div className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border mb-3 ${TIER_STYLES[tier]}`}>{tier.toUpperCase()} SPONSORS</div>
          <div className={`flex flex-wrap gap-3 ${tier === 'platinum' ? 'justify-center' : ''}`}>
            {tierSponsors.map(s => (
              <div key={s.id} className={`flex items-center gap-3 border rounded-xl px-4 py-3 bg-white hover:shadow-sm transition-shadow ${tier === 'platinum' ? 'w-full max-w-sm' : ''}`}>
                {s.logo_url
                  ? <img src={s.logo_url} alt={s.name} className={`object-contain rounded ${tier === 'platinum' ? 'h-12 w-24' : 'h-8 w-16'}`}/>
                  : <div className={`rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ${tier === 'platinum' ? 'h-12 w-24' : 'h-8 w-16'}`}>{s.name.slice(0,2).toUpperCase()}</div>}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{s.name}</p>
                  {s.description && <p className="text-xs text-gray-500 truncate">{s.description}</p>}
                </div>
                {s.website_url && <a href={s.website_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-indigo-600"><ExternalLink size={14}/></a>}
                {isOrganizer && (
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(s)} className="p-1 text-gray-400 hover:text-indigo-600"><Edit2 size={13}/></button>
                    <button onClick={() => del(s.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={13}/></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
