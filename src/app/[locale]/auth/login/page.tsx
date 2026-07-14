'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // In a real app, you would use signIn('credentials', { ... }) from next-auth/react
      console.log('Logging in with', email, password);
      // await signIn('credentials', { email, password, callbackUrl: '/dashboard/student' });
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f1e9] flex items-center justify-center p-4 pt-32">
      <div className="max-w-md w-full border border-black/10 p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1 mb-6 text-xl font-semibold tracking-[-0.05em] text-[#171813]">
            YouTeach<span className="text-[#91a838]">.</span>
          </Link>
          <h1 className="text-2xl font-medium tracking-[-0.02em]">Welcome back</h1>
          <p className="text-black/55 mt-2">Sign in to continue learning</p>
        </div>

        {error && (
          <div className="border border-red-600/30 text-red-700 p-3 mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-black/60">
                Password
              </label>
              <Link href="/auth/forgot-password" className="text-sm underline decoration-1 underline-offset-4 text-black/55 hover:text-black">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-black/15 px-4 py-3 placeholder:text-black/35 focus:outline-none focus:border-black/40"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#171813] text-white font-semibold hover:bg-[#91a838] hover:text-black transition-colors mt-6"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-black/55">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="font-medium underline decoration-1 underline-offset-4 text-black hover:text-[#91a838]">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
