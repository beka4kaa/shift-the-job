import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'YouTeach | Find Your Perfect Tutor',
  description: 'Connect with expert tutors for SAT, IELTS, TOEFL and more. Book lessons, improve your scores. International tutor marketplace.',
  keywords: ['tutor', 'SAT', 'IELTS', 'TOEFL', 'GRE', 'GMAT', 'online tutoring', 'test prep'],
};

const locales = ['en', 'ru', 'kz'];

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${inter.variable} min-h-screen bg-[#f4f1e9] font-sans text-[#171813] antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
