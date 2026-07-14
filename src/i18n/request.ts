import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['en', 'ru', 'kz'];

export default getRequestConfig(async ({ locale }) => {
  let currentLocale = locale;
  if (!currentLocale || !locales.includes(currentLocale as any)) {
    currentLocale = 'en';
  }

  return {
    locale: currentLocale,
    messages: (await import(`../../messages/${currentLocale}.json`)).default
  };
});
