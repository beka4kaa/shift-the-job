import NextAuth from 'next-auth';
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
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.djangoAccessToken = user.djangoAccessToken;
        token.djangoRefreshToken = user.djangoRefreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      session.djangoAccessToken = token.djangoAccessToken as string;
      return session;
    },
  },
});
