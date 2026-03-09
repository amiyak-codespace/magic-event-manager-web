import { api } from './client';

export type Channel = 'email' | 'whatsapp' | 'sms';

export interface CampaignTemplate {
  id: string;
  name: string;
  channel: Channel;
  subject?: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export async function listTemplates(): Promise<CampaignTemplate[]> {
  const { data } = await api.get('/campaign-templates');
  return data;
}

export async function createTemplate(payload: {
  name: string;
  channel: Channel;
  subject?: string;
  body: string;
}): Promise<CampaignTemplate> {
  const { data } = await api.post('/campaign-templates', payload);
  return data;
}

export async function previewTemplate(id: string, variables: Record<string, any>) {
  const { data } = await api.post(`/campaign-templates/${id}/preview`, { variables });
  return data as { channel: Channel; subject?: string; body: string };
}

