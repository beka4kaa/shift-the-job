import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency: string = 'USD'): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    KZT: '₸',
    RUB: '₽',
    TRY: '₺',
    KRW: '₩',
    CNY: '¥',
    JPY: '¥',
  };
  const symbol = symbols[currency] || currency + ' ';
  return `${symbol}${amount}`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    'United States': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'Kazakhstan': '🇰🇿',
    'Turkey': '🇹🇷',
    'South Korea': '🇰🇷',
    'Russia': '🇷🇺',
    'Germany': '🇩🇪',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'India': '🇮🇳',
    'China': '🇨🇳',
    'Japan': '🇯🇵',
    'France': '🇫🇷',
    'UAE': '🇦🇪',
    'Uzbekistan': '🇺🇿',
    'Kyrgyzstan': '🇰🇬',
  };
  return flags[country] || '🌍';
}

export function pluralize(count: number, one: string, few: string, many: string): string {
  if (count % 10 === 1 && count % 100 !== 11) return `${count} ${one}`;
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return `${count} ${few}`;
  return `${count} ${many}`;
}
