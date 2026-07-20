/** Shape of a booking row from Django's BookingSerializer. */
export interface DashboardBooking {
  id: number;
  student: number;
  teacher: number;
  teacher_name: string;
  teacher_image: string | null;
  student_name: string;
  student_image: string | null;
  subject: string;
  date: string; // ISO datetime
  duration: number;
  price: number;
  currency: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  meeting_link: string | null;
}

/** A lesson still to happen (booked/paid, in the future). */
export function isUpcoming(b: DashboardBooking): boolean {
  return b.status === 'CONFIRMED' && new Date(b.date).getTime() >= Date.now();
}

/** A lesson already done (explicitly completed, or its time has passed). */
export function isPast(b: DashboardBooking): boolean {
  return b.status === 'COMPLETED' || (b.status === 'CONFIRMED' && new Date(b.date).getTime() < Date.now());
}

export function formatBookingDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
}

const CURRENCY_SYMBOL: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', KZT: '₸' };

export function money(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOL[currency] ?? '';
  return `${symbol}${amount.toFixed(2)}`;
}
