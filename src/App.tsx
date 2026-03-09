import { Link, Route, Routes, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EventDetailPage from './pages/EventDetailPage';
import CreateEventPage from './pages/CreateEventPage';
import CampaignTemplatesPage from './pages/CampaignTemplatesPage';
import CampaignTemplateBuilderPage from './pages/CampaignTemplateBuilderPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold text-lg">Magic Event Manager</Link>
          <nav className="space-x-4 text-sm">
            <Link to="/" className="hover:underline">Events</Link>
            <Link to="/campaigns" className="hover:underline">Campaigns</Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events/new" element={<CreateEventPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/campaigns" element={<CampaignTemplatesPage />} />
          <Route path="/campaigns/new" element={<CampaignTemplateBuilderPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-gray-500 py-4">© 2026 Magic Event Manager</footer>
    </div>
  );
}
