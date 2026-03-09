import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Event, getEvent } from '../api/events';

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  useEffect(() => {
    if (id) getEvent(id).then(setEvent).catch(() => setEvent(null));
  }, [id]);
  if (!event) return <p className="text-sm text-gray-500">Loading...</p>;
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">{event.name}</h1>
      <p className="text-gray-600">{new Date(event.date).toLocaleString()}</p>
    </div>
  );
}
