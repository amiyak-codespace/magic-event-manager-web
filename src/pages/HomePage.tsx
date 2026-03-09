import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Event, listEvents } from '../api/events';
import EventCard from '../components/EventCard';

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  useEffect(() => {
    listEvents().then(setEvents).catch(() => setEvents([]));
  }, []);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Events</h1>
        <Link to="/events/new" className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm">Create Event</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
        {events.length === 0 && <p className="text-sm text-gray-500">No events yet.</p>}
      </div>
    </div>
  );
}
