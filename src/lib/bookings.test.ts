import { describe, expect, it, vi } from 'vitest';
import { isPast, isUpcoming, type DashboardBooking } from './bookings';

function booking(overrides: Partial<DashboardBooking> = {}): DashboardBooking {
  return {
    id: 1,
    student: 2,
    teacher: 3,
    teacher_name: 'Tutor',
    teacher_image: null,
    student_name: 'Student',
    student_image: null,
    subject: 'Mathematics',
    date: '2026-08-01T12:00:00Z',
    duration: 60,
    price: 25,
    currency: 'USD',
    status: 'CONFIRMED',
    meeting_link: null,
    ...overrides,
  };
}

describe('dashboard booking groups', () => {
  it('does not show unpaid pending checkouts as scheduled lessons', () => {
    vi.setSystemTime(new Date('2026-07-19T12:00:00Z'));
    const pending = booking({ status: 'PENDING' });
    expect(isUpcoming(pending)).toBe(false);
    expect(isPast(pending)).toBe(false);
    vi.useRealTimers();
  });

  it('separates confirmed future and completed lessons', () => {
    vi.setSystemTime(new Date('2026-07-19T12:00:00Z'));
    expect(isUpcoming(booking())).toBe(true);
    expect(isPast(booking({ status: 'COMPLETED' }))).toBe(true);
    vi.useRealTimers();
  });
});
