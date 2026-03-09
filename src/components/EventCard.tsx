import { Link } from 'react-router-dom';
import { Event } from '../api/events';

export default function EventCard({ event }: { event: Event }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{event.name}</h3>
          <p className="text-sm text-gray-500">{new Date(event.date).toLocaleString()}</p>
        </div>
        <Link className="text-blue-600 text-sm hover:underline" to={`/events/${event.id}`}>View</Link>
      </div>
    </div>
  );
}
