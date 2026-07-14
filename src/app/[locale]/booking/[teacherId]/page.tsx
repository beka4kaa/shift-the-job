'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mockTeachers, type MockTeacher } from '@/lib/mock-data';
import Link from 'next/link';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const teacher = mockTeachers.find((t) => t.id === params.teacherId) as MockTeacher | undefined;

  const [date, setDate] = useState('');
  const [duration, setDuration] = useState(60);
  const [subject, setSubject] = useState(teacher?.subjects[0] || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!teacher) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#f1f5f9] flex items-center justify-center">
        <h1 className="text-2xl font-bold">Teacher not found</h1>
      </div>
    );
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacher.id,
          subject,
          date,
          duration,
        }),
      });

      if (!res.ok) {
        throw new Error('Booking failed. Please ensure you are logged in.');
      }

      const { url } = await res.json();
      window.location.href = url; // Redirect to Stripe
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const amount = (teacher.hourlyRate / 60) * duration;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f1f5f9] flex items-center justify-center py-12 px-4">
      <div className="max-w-xl w-full">
        <Link
          href={`/teachers/${teacher.id}`}
          className="text-purple-400 hover:text-purple-300 text-sm mb-6 inline-block"
        >
          ← Back to profile
        </Link>
        
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-6">Book a session with {teacher.name}</h1>

          <div className="flex items-center gap-4 mb-8 bg-[#0a0a0f] p-4 rounded-xl border border-white/5">
            <img src={teacher.image} alt={teacher.name} className="w-16 h-16 rounded-full object-cover" />
            <div>
              <p className="font-semibold text-white">{teacher.name}</p>
              <p className="text-sm text-gray-400">{teacher.headline}</p>
              <p className="text-sm text-purple-400 mt-1">${teacher.hourlyRate}/hr</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleBooking} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                required
              >
                {teacher.subjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date & Time</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
              <div className="grid grid-cols-3 gap-3">
                {[30, 60, 90].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`py-3 rounded-xl border transition-colors ${
                      duration === mins 
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300' 
                        : 'bg-[#0a0a0f] border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-6 mt-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-300">Total Price</span>
                <span className="text-3xl font-bold text-white">${amount.toFixed(2)}</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
