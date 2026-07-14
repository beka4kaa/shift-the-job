'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PUBLIC_DJANGO_API_URL } from '@/lib/django-api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch(`${PUBLIC_DJANGO_API_URL}/api/auth/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error('Request failed');
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f1e9] flex items-center justify-center p-4 pt-32">
      <div className="max-w-md w-full border border-black/10 p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1 mb-6 text-xl font-semibold tracking-[-0.05em] text-[#171813]">
            YouTeach<span className="text-[#91a838]">.</span>
          </Link>
          <h1 className="text-2xl font-medium tracking-[-0.02em]">Reset your password</h1>
          <p className="text-black/55 mt-2">Enter your email and we&apos;ll send you a reset link</p>
        </div>

        {status === 'sent' ? (
          <div className="border border-[#91a838]/40 text-[#5f6f26] p-4 text-sm text-center">
            If an account exists for that email, a reset link has been sent.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'error' && (
              <div className="border border-red-600/30 text-red-700 p-3 text-sm text-center">
                Something went wrong. Please try again.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-black/60 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border border-black/15 px-4 py-3 placeholder:text-black/35 focus:outline-none focus:border-black/40"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 bg-[#171813] text-white font-semibold hover:bg-[#91a838] hover:text-black transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-black/55">
          Remembered your password?{' '}
          <Link href="/auth/login" className="font-medium underline decoration-1 underline-offset-4 text-black hover:text-[#91a838]">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
