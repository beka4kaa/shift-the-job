'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { GoogleButton } from '@/components/GoogleButton';

/**
 * Two session-level failures both trace back to the same Django auth bridge
 * (see src/auth.ts): 'GoogleAuthError' when the initial Google id_token
 * exchange fails, and 'RefreshTokenError' when the ~1hr Django access-token
 * refresh fails for an already-signed-in user (Google OR password). Either
 * way the session ends up with a name/photo but no usable role — proxy.ts
 * then bounces any dashboard visit back here. None of this shows up in the
 * browser's network tab (it's a server-to-server call), so without this
 * banner it looks like the account is silently rejected or randomly logged
 * out mid-session.
 */
const AUTH_BRIDGE_ERRORS = new Set(['GoogleAuthError', 'RefreshTokenError']);
const AUTH_BRIDGE_ERROR_MESSAGE =
  "Your session couldn't be verified — our login service didn't respond. Please sign in again in a moment.";

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const hasAuthBridgeError = Boolean(session?.error && AUTH_BRIDGE_ERRORS.has(session.error));
  // Derived at render time (not stored in state) so the message shows the
  // instant the broken session loads, with no extra render round-trip.
  const displayedError = error || (hasAuthBridgeError ? AUTH_BRIDGE_ERROR_MESSAGE : '');

  useEffect(() => {
    if (hasAuthBridgeError) {
      // Clear the broken half-signed-in session so a retry starts clean
      // instead of the stale profile lingering in the header.
      void signOut({ redirect: false });
    }
  }, [hasAuthBridgeError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', { email, password, redirect: false });

    if (result?.error) {
      setError('Invalid email or password');
      setLoading(false);
      return;
    }

    router.push('/dashboard/student');
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

        {displayedError && (
          <div className="border border-red-600/30 text-red-700 p-3 mb-6 text-sm text-center">
            {displayedError}
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
            disabled={loading}
            className="w-full py-3 bg-[#171813] text-white font-semibold hover:bg-[#91a838] hover:text-black transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="h-px flex-1 bg-black/10" />
          <span className="text-xs uppercase tracking-[0.14em] text-black/40">or</span>
          <div className="h-px flex-1 bg-black/10" />
        </div>

        <GoogleButton />

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
