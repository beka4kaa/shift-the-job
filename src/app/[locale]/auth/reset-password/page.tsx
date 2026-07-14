'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PUBLIC_DJANGO_API_URL } from '@/lib/django-api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch(`${PUBLIC_DJANGO_API_URL}/api/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.detail || body?.password?.[0] || 'This reset link is invalid or has expired');
        setStatus('error');
        return;
      }

      setStatus('done');
    } catch {
      setError('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  if (!token) {
    return (
      <div className="max-w-md w-full border border-black/10 p-8 text-center">
        <h1 className="text-2xl font-medium tracking-[-0.02em] mb-4">Invalid reset link</h1>
        <p className="text-black/55 mb-6">This link is missing its reset token.</p>
        <Link href="/auth/forgot-password" className="text-sm font-semibold underline decoration-1 underline-offset-4">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full border border-black/10 p-8">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-1 mb-6 text-xl font-semibold tracking-[-0.05em] text-[#171813]">
          YouTeach<span className="text-[#91a838]">.</span>
        </Link>
        <h1 className="text-2xl font-medium tracking-[-0.02em]">Choose a new password</h1>
        <p className="text-black/55 mt-2">Must be at least 8 characters</p>
      </div>

      {status === 'done' ? (
        <div className="space-y-4">
          <div className="border border-[#91a838]/40 text-[#5f6f26] p-4 text-sm text-center">
            Password updated. You can now sign in.
          </div>
          <Link
            href="/auth/login"
            className="block w-full py-3 bg-[#171813] text-white font-semibold text-center hover:bg-[#91a838] hover:text-black transition-colors"
          >
            Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="border border-red-600/30 text-red-700 p-3 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-black/60 mb-1">
              New password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-black/15 px-4 py-3 placeholder:text-black/35 focus:outline-none focus:border-black/40"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black/60 mb-1">
              Confirm new password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-transparent border border-black/15 px-4 py-3 placeholder:text-black/35 focus:outline-none focus:border-black/40"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3 bg-[#171813] text-white font-semibold hover:bg-[#91a838] hover:text-black transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f4f1e9] flex items-center justify-center p-4 pt-32">
      <Suspense
        fallback={
          <div className="max-w-md w-full border border-black/10 p-8 text-center text-black/45">
            Loading…
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
