import NextAuth from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';
import { DJANGO_API_URL } from '@/lib/django-api';

interface DjangoLoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    name: string;
    image: string | null;
    role: string;
  };
}

// Refresh a little before the token actually expires so an in-flight request
// never races the expiry boundary.
const EXPIRY_SKEW_MS = 60_000;

/**
 * Read the `exp` claim (seconds since epoch) out of a Django access JWT and
 * return it as an ms timestamp. Runs in the Edge middleware runtime too, so it
 * uses `atob` rather than Node's Buffer. Falls back to "1 hour from now" (the
 * SIMPLE_JWT ACCESS_TOKEN_LIFETIME) if the token can't be decoded.
 */
function getAccessTokenExpiry(accessToken: string): number {
  try {
    const payload = accessToken.split('.')[1];
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const { exp } = JSON.parse(atob(padded)) as { exp?: number };
    return exp ? exp * 1000 : Date.now() + 60 * 60 * 1000;
  } catch {
    return Date.now() + 60 * 60 * 1000;
  }
}

/**
 * Exchange the stored refresh token for a fresh access token via Django's
 * SimpleJWT refresh endpoint. On failure (refresh token expired after 7 days,
 * revoked, or backend unreachable) the token is flagged with an error so the
 * session/app can decide to force a re-login.
 */
async function refreshDjangoToken(token: JWT): Promise<JWT> {
  try {
    const res = await fetch(`${DJANGO_API_URL}/api/auth/login/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: token.djangoRefreshToken }),
    });

    if (!res.ok) throw new Error(`refresh failed: ${res.status}`);

    // ROTATE_REFRESH_TOKENS is off by default, so `refresh` usually isn't
    // returned — keep the existing one when it isn't.
    const data = (await res.json()) as { access: string; refresh?: string };

    return {
      ...token,
      djangoAccessToken: data.access,
      djangoRefreshToken: data.refresh ?? token.djangoRefreshToken,
      accessTokenExpires: getAccessTokenExpiry(data.access),
      error: undefined,
    };
  } catch {
    return { ...token, error: 'RefreshTokenError' };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const res = await fetch(`${DJANGO_API_URL}/api/auth/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!res.ok) {
          return null;
        }

        const data: DjangoLoginResponse = await res.json();

        return {
          id: String(data.user.id),
          email: data.user.email,
          name: data.user.name,
          image: data.user.image,
          role: data.user.role,
          djangoAccessToken: data.access,
          djangoRefreshToken: data.refresh,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in: seed the token from the Django login response and
      // record when the access token expires.
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.djangoAccessToken = user.djangoAccessToken;
        token.djangoRefreshToken = user.djangoRefreshToken;
        token.accessTokenExpires = getAccessTokenExpiry(user.djangoAccessToken);
        return token;
      }

      // Still valid (with skew) — hand it back untouched.
      if (
        token.accessTokenExpires &&
        Date.now() < token.accessTokenExpires - EXPIRY_SKEW_MS
      ) {
        return token;
      }

      // Access token expired or about to — transparently refresh it so
      // authenticated Django calls (bookings, Stripe) keep working past the
      // 1-hour access-token lifetime, up to the 7-day refresh window.
      return refreshDjangoToken(token);
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      session.djangoAccessToken = token.djangoAccessToken as string;
      session.error = token.error;
      return session;
    },
  },
});
