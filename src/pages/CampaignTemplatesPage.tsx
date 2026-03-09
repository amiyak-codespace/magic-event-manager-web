import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CampaignTemplate, listTemplates } from '../api/campaignTemplates';

export default function CampaignTemplatesPage() {
  const [items, setItems] = useState<CampaignTemplate[]>([]);
  useEffect(() => {
    listTemplates().then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Campaign Templates</h1>
        <Link to="/campaigns/new" className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm">New Template</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <div key={t.id} className="rounded border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{t.name}</h3>
                <p className="text-xs text-gray-500 uppercase">{t.channel}</p>
              </div>
              <span className="text-xs text-gray-500">{new Date(t.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500">No templates yet.</p>}
      </div>
    </div>
  );
}

