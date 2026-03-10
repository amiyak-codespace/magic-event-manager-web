import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Calendar, MapPin, Users, Search, Filter, Tag, Globe, ChevronRight, Star, TrendingUp } from 'lucide-react';
import { SEO } from '@/components/SEO';

export default function DiscoverPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = async (reset = false) => {
    setLoading(true);
    const p = reset ? 1 : page;
    try {
      const params = new URLSearchParams({ page: String(p), limit: '12' });
      if (search) params.set('search', search);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedType) params.set('type', selectedType);
      const { data: d } = await api.get('/events?' + params.toString());
      const list = d.events || d;
      if (reset) { setEvents(list); setPage(2); }
      else { setEvents(prev => [...prev, ...list]); setPage(p + 1); }
      setHasMore(list.length === 12);
    } finally { setLoading(false); }
  };

  const loadMeta = async () => {
    try {
      const [cats, trend] = await Promise.all([
        api.get('/events/categories').then((r:any)=>r.data).catch(() => []),
        api.get('/events/trending').then((r:any)=>r.data).catch(() => []),
      ]);
      setCategories(cats || []);
      setTrending(trend?.slice(0, 4) || []);
    } catch {}
  };

  useEffect(() => { loadMeta(); load(true); }, []);
  useEffect(() => { load(true); }, [search, selectedCategory, selectedType]);

  const typeFilters = [
    { id: '', label: 'All' },
    { id: 'free', label: 'Free' },
    { id: 'paid', label: 'Paid' },
    { id: 'online', label: 'Online' },
    { id: 'in-person', label: 'In-Person' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Discover Events | AppsMagic Events"
        description="Discover trending events by category, format, and location on AppsMagic Events."
        path="/discover"
      />
      {/* Hero search bar */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-2">Discover Events Near You</h1>
          <p className="text-indigo-200 mb-6">Find conferences, meetups, workshops and more</p>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search events, topics, or organizers…"
              className="w-full pl-11 pr-4 py-4 rounded-xl text-gray-900 text-base shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"/>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Trending section */}
        {trending.length > 0 && (
          <div className="mb-8">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
              <TrendingUp size={18} className="text-indigo-600"/> Trending Events
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {trending.map((e: any) => (
                <Link key={e.id} to={`/events/${e.id}`}
                  className="bg-white rounded-xl border hover:shadow-md transition-shadow overflow-hidden group">
                  <div className="h-24 bg-gradient-to-br from-indigo-500 to-purple-600 relative overflow-hidden">
                    {e.banner_url && <img src={e.banner_url} alt="" className="w-full h-full object-cover opacity-80"/>}
                    <div className="absolute inset-0 p-2 flex flex-col justify-end">
                      <span className="text-white text-xs font-semibold line-clamp-2 drop-shadow">{e.title}</span>
                    </div>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-xs text-gray-500">{new Date(e.start_date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</p>
                    {e.views > 0 && <p className="text-xs text-indigo-600 font-medium">{e.views} views</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <Filter size={16} className="text-gray-400"/>
          <div className="flex gap-2 flex-wrap">
            {typeFilters.map(f => (
              <button key={f.id} onClick={() => setSelectedType(f.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedType === f.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                {f.label}
              </button>
            ))}
          </div>
          {categories.length > 0 && (
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
              className="border rounded-full px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Categories</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>

        {/* Events grid */}
        {loading && events.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border animate-pulse h-64"/>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <Globe size={40} className="mx-auto text-gray-300 mb-3"/>
            <p className="text-gray-500">No events found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((e: any) => (
              <Link key={e.id} to={`/events/${e.id}`}
                className="bg-white rounded-xl border hover:shadow-lg transition-all overflow-hidden group">
                <div className="h-44 bg-gradient-to-br from-indigo-500 to-purple-600 relative overflow-hidden">
                  {e.banner_url
                    ? <img src={e.banner_url} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                    : <div className="flex items-center justify-center h-full text-white/30"><Calendar size={40}/></div>}
                  <div className="absolute top-2 left-2 flex gap-2">
                    {e.is_online ? <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">Online</span>
                      : <span className="bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">{e.city || 'In-Person'}</span>}
                    {e.is_free ? <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">Free</span>
                      : e.price > 0 && <span className="bg-white/90 text-gray-800 text-xs px-2 py-0.5 rounded-full font-semibold">₹{Number(e.price).toLocaleString('en-IN')}</span>}
                  </div>
                  {e.avg_rating > 0 && (
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star size={10} className="fill-yellow-400 text-yellow-400"/>{Number(e.avg_rating).toFixed(1)}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">{e.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Calendar size={11}/>
                    <span>{new Date(e.start_date).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}</span>
                  </div>
                  {(e.venue_name || e.is_online) && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <MapPin size={11}/>
                      <span className="truncate">{e.is_online ? 'Virtual Event' : e.venue_name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users size={11}/> {e.current_attendees || 0} going
                      {e.max_attendees > 0 && <span className="text-gray-400">/ {e.max_attendees}</span>}
                    </div>
                    <span className="text-xs text-indigo-600 font-medium flex items-center gap-0.5">View <ChevronRight size={12}/></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="text-center mt-8">
            <button onClick={() => load()} disabled={loading}
              className="bg-white border border-indigo-300 text-indigo-600 font-semibold px-8 py-3 rounded-full hover:bg-indigo-50 transition-colors disabled:opacity-50">
              {loading ? 'Loading…' : 'Load More Events'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
