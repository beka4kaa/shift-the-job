'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { PUBLIC_DJANGO_API_URL } from '@/lib/django-api';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${PUBLIC_DJANGO_API_URL}/api/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const firstError = body && typeof body === 'object' ? Object.values(body)[0] : null;
        setError(Array.isArray(firstError) ? firstError[0] : 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        // Account was created but auto-login failed — send them to log in manually.
        router.push('/auth/login');
        return;
      }

      router.push(role === 'TEACHER' ? '/dashboard/teacher' : '/dashboard/student');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f1e9] flex items-center justify-center p-4 py-12 pt-32">
      <div className="max-w-md w-full border border-black/10 p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1 mb-6 text-xl font-semibold tracking-[-0.05em] text-[#171813]">
            YouTeach<span className="text-[#91a838]">.</span>
          </Link>
          <h1 className="text-2xl font-medium tracking-[-0.02em]">Create an account</h1>
          <p className="text-black/55 mt-2">Join our community today</p>
        </div>

        {error && (
          <div className="border border-red-600/30 text-red-700 p-3 mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black/60 mb-1">
              I want to
            </label>
            <div className="grid grid-cols-2 gap-px bg-black/10">
              <button
                type="button"
                onClick={() => setRole('STUDENT')}
                className={`py-2 px-4 text-sm font-medium transition-colors ${
                  role === 'STUDENT'
                    ? 'bg-[#171813] text-white'
                    : 'bg-[#f4f1e9] text-black/55 hover:text-black'
                }`}
              >
                Learn
              </button>
              <button
                type="button"
                onClick={() => setRole('TEACHER')}
                className={`py-2 px-4 text-sm font-medium transition-colors ${
                  role === 'TEACHER'
                    ? 'bg-[#171813] text-white'
                    : 'bg-[#f4f1e9] text-black/55 hover:text-black'
                }`}
              >
                Teach
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black/60 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border border-black/15 px-4 py-3 placeholder:text-black/35 focus:outline-none focus:border-black/40"
              placeholder="John Doe"
            />
          </div>

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
            <label className="block text-sm font-medium text-black/60 mb-1">
              Password
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#171813] text-white font-semibold hover:bg-[#91a838] hover:text-black transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-black/55">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium underline decoration-1 underline-offset-4 text-black hover:text-[#91a838]">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
