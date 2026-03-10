import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Image as ImageIcon, Save, ArrowLeft } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { SEO } from '@/components/SEO';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setMsg('');
    try {
      const { data } = await authApi.updateProfile({ name: name.trim(), avatar: avatar.trim() || undefined });
      setUser(data as { id: string; name: string; email: string; role: string; avatar: string | null });
      setMsg('Profile updated');
    } catch {
      setMsg('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title="Profile | AppsMagic Events" noIndex />
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <button onClick={() => navigate('/dashboard')} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Edit Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Update name and avatar used across events.</p>

          <form onSubmit={onSave} className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Name</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
                <User className="h-4 w-4 text-slate-400" />
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full py-2.5 text-sm outline-none" placeholder="Your name" />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Email</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <input value={user?.email || ''} disabled className="w-full py-2.5 text-sm text-slate-500 outline-none bg-transparent" />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Avatar URL</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
                <ImageIcon className="h-4 w-4 text-slate-400" />
                <input value={avatar} onChange={(e) => setAvatar(e.target.value)} className="w-full py-2.5 text-sm outline-none" placeholder="https://..." />
              </div>
            </label>

            {avatar && (
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-xs font-semibold text-slate-500">Preview</p>
                <img src={avatar} alt="avatar" className="h-16 w-16 rounded-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}

            {msg && <p className="text-sm text-slate-600">{msg}</p>}

            <button disabled={saving || !name.trim()} className="btn-primary w-full justify-center">
              <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
