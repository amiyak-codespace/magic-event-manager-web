import { api } from './client';

export interface Event {
  id: string;
  name: string;
  date: string;
}

export async function listEvents(): Promise<Event[]> {
  const { data } = await api.get('/events');
  return data;
}

export async function createEvent(payload: { name: string; date: string }): Promise<Event> {
  const { data } = await api.post('/events', payload);
  return data;
}

export async function getEvent(id: string): Promise<Event> {
  const { data } = await api.get(`/events/${id}`);
  return data;
}
