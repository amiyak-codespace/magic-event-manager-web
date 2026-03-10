// Generate .ics file content for an event
export function generateICS(event: {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  venue_name: string;
  venue_address: string;
  city: string;
  is_online: boolean;
  online_link: string | null;
  id: string;
}): string {
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const location = event.is_online
    ? event.online_link || 'Online'
    : `${event.venue_name}, ${event.venue_address}, ${event.city}`;

  const desc = event.description.replace(/\n/g, '\\n').substring(0, 500);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AppsMagic Events//AppsMagic//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@host-events.appsmagic.in`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${desc}`,
    `LOCATION:${location}`,
    `URL:https://host-events.appsmagic.in/events/${event.id}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadICS(event: Parameters<typeof generateICS>[0]) {
  const ics = generateICS(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function googleCalendarUrl(event: {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  venue_name: string;
  city: string;
  is_online: boolean;
  online_link: string | null;
}): string {
  const start = new Date(event.start_date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = new Date(event.end_date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const location = event.is_online ? (event.online_link || 'Online') : `${event.venue_name}, ${event.city}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description.substring(0, 500),
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
