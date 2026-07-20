import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
    djangoAccessToken: string;
    // Set to 'RefreshTokenError' when the Django refresh token could no longer
    // be exchanged (expired/revoked) — the app can use it to force a re-login.
    error?: string;
  }

  interface User {
    id: string;
    role: string;
    djangoAccessToken: string;
    djangoRefreshToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    djangoAccessToken: string;
    djangoRefreshToken: string;
    // Ms-epoch expiry of djangoAccessToken; drives transparent refresh.
    accessTokenExpires?: number;
    error?: string;
  }
}
