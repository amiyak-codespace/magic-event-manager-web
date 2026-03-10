import { useState } from 'react';
import { X, Star, Send, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface Props {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function FeedbackModal({ eventId, eventTitle, onClose, onSubmitted }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  const submit = async () => {
    if (!rating) { setError('Please select a rating'); return; }
    setSubmitting(true);
    try {
      await api.post(`/events/${eventId}/feedback`, { rating, comment, is_anonymous: isAnonymous });
      onSubmitted();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Rate this Event</h2>
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{eventTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-2 my-6">
          {[1,2,3,4,5].map(s => (
            <button key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => setRating(s)}>
              <Star size={36} className={`transition-colors ${s <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}/>
            </button>
          ))}
        </div>
        {(hover || rating) > 0 && (
          <p className="text-center text-sm font-semibold text-yellow-600 -mt-3 mb-4">{labels[hover || rating]}</p>
        )}

        <textarea value={comment} onChange={e => setComment(e.target.value)}
          placeholder="Share your experience (optional)…"
          rows={3}
          className="w-full border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"/>

        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer mb-4">
          <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="rounded"/>
          Submit anonymously
        </label>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button onClick={submit} disabled={submitting || !rating}
          className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
          Submit Feedback
        </button>
      </div>
    </div>
  );
}
