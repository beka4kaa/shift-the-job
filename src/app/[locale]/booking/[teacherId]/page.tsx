'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { mockTeachers, type MockTeacher } from '@/lib/mock-data';
import Link from 'next/link';

export default function BookingPage() {
  const params = useParams();
  const teacher = mockTeachers.find((t) => t.id === params.teacherId) as MockTeacher | undefined;

  const [date, setDate] = useState('');
  const [duration, setDuration] = useState(60);
  const [subject, setSubject] = useState(teacher?.subjects[0] || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!teacher) {
    return (
      <div className="min-h-screen bg-[#f4f1e9] text-[#171813] flex items-center justify-center">
        <h1 className="text-2xl font-medium tracking-[-0.02em]">Teacher not found</h1>
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
    <div className="min-h-screen bg-[#f4f1e9] text-[#171813] flex items-center justify-center py-12 px-5 pt-32">
      <div className="max-w-xl w-full">
        <Link
          href={`/teachers/${teacher.id}`}
          className="text-sm font-semibold underline decoration-1 underline-offset-4 mb-6 inline-block"
        >
          ← Back to profile
        </Link>

        <div className="border border-black/10 p-8">
          <h1 className="text-2xl font-medium tracking-[-0.02em] mb-6">Book a session with {teacher.name}</h1>

          <div className="flex items-center gap-4 mb-8 border border-black/10 p-4">
            <img src={teacher.image} alt={teacher.name} className="w-16 h-16 object-cover" />
            <div>
              <p className="font-semibold">{teacher.name}</p>
              <p className="text-sm text-black/55">{teacher.headline}</p>
              <p className="text-sm text-black/70 mt-1">${teacher.hourlyRate}/hr</p>
            </div>
          </div>

          {error && (
            <div className="border border-red-600/30 text-red-700 p-4 mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleBooking} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-black/60 mb-2">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-transparent border border-black/15 px-4 py-3 focus:outline-none focus:border-black/40"
                required
              >
                {teacher.subjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black/60 mb-2">Date & Time</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent border border-black/15 px-4 py-3 focus:outline-none focus:border-black/40"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black/60 mb-2">Duration</label>
              <div className="grid grid-cols-3 gap-px bg-black/10">
                {[30, 60, 90].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`py-3 border transition-colors ${
                      duration === mins
                        ? 'bg-[#171813] border-[#171813] text-white'
                        : 'bg-[#f4f1e9] border-black/15 text-black/60 hover:border-black/30'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-black/10 pt-6 mt-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-black/60">Total Price</span>
                <span className="text-3xl font-medium tracking-[-0.02em]">${amount.toFixed(2)}</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#171813] text-white font-semibold text-lg hover:bg-[#91a838] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing…' : 'Proceed to Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
