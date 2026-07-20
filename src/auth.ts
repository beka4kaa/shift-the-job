import NextAuth from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { DJANGO_API_URL } from '@/lib/django-api';

const DEFAULT_AVATAR = '/default-avatar.svg';

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

/**
 * Trade a Google id_token (from the NextAuth Google provider) for this app's
 * own Django JWTs, so a Google sign-in yields a real Django user + access token
 * — the rest of the app (bookings, Stripe) then works exactly as with password
 * login. Returns null if Django rejects the token or is unreachable.
 */
async function exchangeGoogleToken(idToken: string): Promise<DjangoLoginResponse | null> {
  try {
    const res = await fetch(`${DJANGO_API_URL}/api/auth/google/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken }),
    });
    if (!res.ok) return null;
    return (await res.json()) as DjangoLoginResponse;
  } catch {
    return null;
  }
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
    // Reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET from the environment.
    Google,
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
          image: data.user.image ?? DEFAULT_AVATAR,
          role: data.user.role,
          djangoAccessToken: data.access,
          djangoRefreshToken: data.refresh,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Settings can refresh display-only session fields after a profile save.
      // Never accept ids, roles, or Django tokens from this client-triggered update.
      if (trigger === 'update' && session?.user) {
        if (typeof session.user.name === 'string' && session.user.name.trim()) {
          token.name = session.user.name.trim().slice(0, 255);
        }
        if (typeof session.user.image === 'string' || session.user.image === null) {
          token.picture = session.user.image;
        }
        return token;
      }

      // Initial sign-in via Google: exchange the Google id_token for Django
      // JWTs so this session is backed by a real Django user, same as password
      // login. `account`/`user` are only present on the initial call.
      if (account?.provider === 'google' && account.id_token) {
        const django = await exchangeGoogleToken(account.id_token);
        if (!django) return { ...token, error: 'GoogleAuthError' };

        token.role = django.user.role;
        token.id = String(django.user.id);
        token.name = django.user.name;
        token.email = django.user.email;
        token.picture = django.user.image ?? token.picture ?? DEFAULT_AVATAR;
        token.djangoAccessToken = django.access;
        token.djangoRefreshToken = django.refresh;
        token.accessTokenExpires = getAccessTokenExpiry(django.access);
        return token;
      }

      // Initial sign-in via Credentials: seed the token from the Django login
      // response and record when the access token expires.
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.djangoAccessToken = user.djangoAccessToken;
        token.djangoRefreshToken = user.djangoRefreshToken;
        token.picture = user.image ?? DEFAULT_AVATAR;
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
        session.user.image = token.picture ?? DEFAULT_AVATAR;
      }
      session.djangoAccessToken = token.djangoAccessToken as string;
      session.error = token.error;
      return session;
    },
  },
});
