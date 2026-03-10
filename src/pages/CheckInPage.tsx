import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { QrCode, CheckCircle, XCircle, Search, Users, Clock, Download, ArrowLeft, ScanLine, RefreshCw } from 'lucide-react';

interface Attendee {
  id: string; name: string; email: string; avatar: string;
  ticket_code: string; checked_in: boolean; checked_in_at: string;
  status: string; ticket_type_name: string; phone: string;
}

export default function CheckInPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState<{ ok: boolean; msg: string; name?: string } | null>(null);
  const [filter, setFilter] = useState('');
  const [tab, setTab] = useState<'scan' | 'list'>('scan');
  const scanRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const checkInRes = await api.get(`/events/${id}/checkin/dashboard`).catch(()=>null);
      const d = checkInRes ? (checkInRes as any).data : null;
      setData(d);
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => { if (tab === 'scan') setTimeout(() => scanRef.current?.focus(), 100); }, [tab]);

  const doScan = async () => {
    const code = scanInput.trim().toUpperCase();
    if (!code) return;
    setScanInput('');
    try {
      const { data: r } = await api.post(`/events/${id}/checkin/scan`, { ticket_code: code });
      setScanResult({ ok: true, msg: r.message, name: r.attendee?.name });
      load();
    } catch (e: any) {
      setScanResult({ ok: false, msg: e.message });
    }
    setTimeout(() => setScanResult(null), 4000);
  };

  const exportCSV = async () => {
    const { data: d } = await api.get(`/events/${id}/checkin/export`);
    const headers = ['Name','Email','Phone','Status','Ticket Code','Ticket Type','Checked In','Check-In Time'];
    const rows = d.attendees.map((a: any) => [a.name, a.email, a.phone||'', a.status, a.ticket_code, a.ticket_type||'', a.checked_in, a.checked_in_at||'']);
    const csv = [headers, ...rows].map(r => r.map((c: any) => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${d.event_title}-attendees.csv`; a.click();
  };

  const filtered = (data?.attendees || []).filter((a: Attendee) =>
    !filter || a.name?.toLowerCase().includes(filter.toLowerCase()) ||
    a.email?.toLowerCase().includes(filter.toLowerCase()) ||
    a.ticket_code?.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"/></div>;
  if (!data) return <div className="text-center p-8 text-red-500">Not authorized or event not found</div>;

  const { stats, event } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link to={`/events/${id}`} className="text-gray-500 hover:text-gray-800"><ArrowLeft size={18}/></Link>
        <div>
          <h1 className="font-bold text-gray-900">Check-In Dashboard</h1>
          <p className="text-xs text-gray-500">{event.title}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={load} className="p-2 rounded-lg border text-gray-500 hover:bg-gray-50"><RefreshCw size={16}/></button>
          <button onClick={exportCSV} className="flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download size={14}/> Export
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-0 border-b bg-white">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-800' },
          { label: 'Checked In', value: stats.checked_in, color: 'text-green-600' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="text-center py-4 border-r last:border-r-0">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
      {stats.total > 0 && (
        <div className="h-2 bg-gray-200">
          <div className="h-2 bg-green-500 transition-all" style={{ width: `${(stats.checked_in / stats.total) * 100}%` }}/>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b flex">
        {(['scan', 'list'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>
            {t === 'scan' ? <><ScanLine size={14} className="inline mr-1"/>Scan Ticket</> : <><Users size={14} className="inline mr-1"/>Attendee List</>}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {tab === 'scan' ? (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-6 text-center">
              <QrCode size={48} className="mx-auto text-indigo-600 mb-3"/>
              <p className="text-gray-600 text-sm mb-4">Scan a QR code or type the ticket code manually</p>
              <div className="flex gap-2">
                <input ref={scanRef} value={scanInput} onChange={e => setScanInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && doScan()}
                  placeholder="Ticket code (e.g. EVT-XXXX)" autoComplete="off"
                  className="flex-1 border rounded-lg px-4 py-3 text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                <button onClick={doScan} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700">
                  Check In
                </button>
              </div>
            </div>

            {scanResult && (
              <div className={`rounded-xl p-5 flex items-center gap-4 ${scanResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                {scanResult.ok ? <CheckCircle size={32} className="text-green-600 shrink-0"/> : <XCircle size={32} className="text-red-600 shrink-0"/>}
                <div>
                  <p className={`font-bold text-lg ${scanResult.ok ? 'text-green-800' : 'text-red-800'}`}>
                    {scanResult.ok ? '✓ ' + (scanResult.name || 'Check-in successful!') : 'Check-in failed'}
                  </p>
                  <p className="text-sm text-gray-600">{scanResult.msg}</p>
                </div>
              </div>
            )}

            {/* Recent check-ins */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Clock size={14}/> Recent Check-ins</h3>
              {data.attendees.filter((a: Attendee) => a.checked_in).slice(-5).reverse().map((a: Attendee) => (
                <div key={a.id} className="bg-white border rounded-lg px-4 py-2 mb-2 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">{a.name?.[0]?.toUpperCase()}</div>
                  <div className="flex-1"><p className="text-sm font-medium">{a.name}</p><p className="text-xs text-gray-500">{a.ticket_code}</p></div>
                  <CheckCircle size={16} className="text-green-500"/>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search by name, email or ticket code…"
                className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div className="space-y-2">
              {filtered.map((a: Attendee) => (
                <div key={a.id} className="bg-white border rounded-lg px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">{a.name?.[0]?.toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{a.name || a.email}</p>
                    <p className="text-xs text-gray-500 font-mono">{a.ticket_code}{a.ticket_type_name ? ` · ${a.ticket_type_name}` : ''}</p>
                  </div>
                  {a.checked_in
                    ? <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full font-medium"><CheckCircle size={12}/>In</span>
                    : <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full font-medium">Pending</span>}
                </div>
              ))}
              {filtered.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No attendees found</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
