
import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
const { X, Star, Heart, Send } = Lucide;

interface RatingModalProps { onClose: () => void; }

export const RatingModal: React.FC<RatingModalProps> = ({ onClose }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    localStorage.setItem('emerald_user_rating', JSON.stringify({ rating, feedback, date: new Date().toISOString() }));
    setSubmitted(true);
    setTimeout(onClose, 2500);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        {submitted && (
            <div className="absolute inset-0 z-20 bg-emerald-500 flex flex-col items-center justify-center text-white animate-in fade-in">
                <Heart size={40} fill="currentColor" className="mb-4 animate-bounce" />
                <h3 className="text-xl font-bold">Thank You!</h3>
            </div>
        )}
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Feedback</h3>
                <p className="text-slate-400 text-xs font-bold uppercase mt-1">Rate your experience</p>
            </div>
            <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} className="text-slate-400"/></button>
        </div>
        <div className="flex justify-between mb-8 px-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="transition-transform active:scale-90 hover:scale-110">
                    <Star size={32} className={`transition-colors ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} strokeWidth={star <= rating ? 0 : 2} />
                </button>
            ))}
        </div>
        <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Thoughts?" className="w-full h-24 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none outline-none text-sm mb-4 resize-none focus:ring-1 focus:ring-slate-200 dark:focus:ring-slate-700" />
        <button onClick={handleSubmit} disabled={rating === 0} className="w-full py-3 rounded-xl font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            <Send size={18} /> Submit
        </button>
      </div>
    </div>
  );
};
