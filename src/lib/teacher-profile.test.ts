import { describe, it, expect } from 'vitest';
import {
  certificatesAreVerified,
  teacherRowToProfileView,
  mockToProfileView,
  type TeacherRow,
} from './teacher-profile';
import type { MockTeacher, MockReview } from './mock-data';

function buildRow(overrides: Partial<TeacherRow> = {}): TeacherRow {
  return {
    id: 't1',
    headline: 'Math Tutor',
    bio: 'Bio',
    hourlyRate: 25,
    currency: 'USD',
    experience: 10,
    country: 'Kazakhstan',
    city: 'Almaty',
    rating: 4.9,
    reviewCount: 3,
    totalStudents: 120,
    user: { name: 'Aigerim', image: null },
    certificates: [],
    subjects: [{ name: 'Mathematics' }, { name: 'Algebra' }],
    languages: [{ code: 'English' }],
    availabilities: [{ dayOfWeek: 0 }, { dayOfWeek: 4 }],
    reviews: [],
    ...overrides,
  };
}

describe('certificatesAreVerified', () => {
  it('is false for an empty certificate list', () => {
    expect(certificatesAreVerified([])).toBe(false);
  });

  it('is false when every certificate is PENDING or REJECTED', () => {
    expect(
      certificatesAreVerified([
        { verificationStatus: 'PENDING' },
        { verificationStatus: 'REJECTED' },
      ]),
    ).toBe(false);
  });

  it('is true when at least one certificate is VERIFIED', () => {
    expect(
      certificatesAreVerified([
        { verificationStatus: 'PENDING' },
        { verificationStatus: 'VERIFIED' },
      ]),
    ).toBe(true);
  });
});

describe('teacherRowToProfileView', () => {
  it('marks the profile verified when a certificate is VERIFIED', () => {
    const view = teacherRowToProfileView(
      buildRow({ certificates: [{ verificationStatus: 'VERIFIED' }] }),
    );
    expect(view.isVerified).toBe(true);
    expect(view.source).toBe('db');
  });

  it('marks the profile not verified when no certificate is VERIFIED', () => {
    const view = teacherRowToProfileView(
      buildRow({ certificates: [{ verificationStatus: 'PENDING' }] }),
    );
    expect(view.isVerified).toBe(false);
  });

  it('falls back to a default avatar when the user has no image', () => {
    const view = teacherRowToProfileView(buildRow({ user: { name: 'A', image: null } }));
    expect(view.image).toContain('dicebear');
  });

  it('maps dayOfWeek to day labels and drops out-of-range days', () => {
    const view = teacherRowToProfileView(
      buildRow({ availabilities: [{ dayOfWeek: 0 }, { dayOfWeek: 4 }, { dayOfWeek: 99 }] }),
    );
    expect(view.availability).toEqual(['Mon', 'Fri']);
  });

  it('maps reviews and fills subject from the primary subject', () => {
    const view = teacherRowToProfileView(
      buildRow({
        subjects: [{ name: 'Mathematics' }],
        reviews: [
          {
            id: 'r1',
            rating: 5,
            comment: 'Great',
            createdAt: new Date('2026-01-02T00:00:00Z'),
            student: { name: 'Sam', image: null },
          },
        ],
      }),
    );
    expect(view.reviews).toHaveLength(1);
    expect(view.reviews[0]).toMatchObject({
      id: 'r1',
      studentName: 'Sam',
      subject: 'Mathematics',
    });
    expect(view.reviews[0].studentImage).toContain('dicebear');
  });
});

describe('mockToProfileView', () => {
  const mockTeacher: MockTeacher = {
    id: '7',
    name: 'Anastasia',
    image: 'https://img/anastasia',
    headline: 'Chem',
    bio: 'Bio',
    subjects: ['Chemistry'],
    hourlyRate: 30,
    currency: 'USD',
    experience: 4,
    languages: ['English'],
    country: 'Russia',
    city: 'Moscow',
    rating: 4.6,
    reviewCount: 1,
    totalStudents: 130,
    verified: false,
    featured: false,
    availability: ['Tue'],
  };

  it('derives isVerified from the mock verified flag', () => {
    expect(mockToProfileView({ ...mockTeacher, verified: true }, []).isVerified).toBe(true);
    expect(mockToProfileView({ ...mockTeacher, verified: false }, []).isVerified).toBe(false);
  });

  it('maps mock reviews straight through and tags the source', () => {
    const reviews: MockReview[] = [
      {
        id: 'r1',
        studentName: 'Anna',
        studentImage: 'https://img/anna',
        teacherId: '7',
        rating: 5,
        comment: 'Loved it',
        date: '2025-07-15',
        subject: 'Chemistry',
      },
    ];
    const view = mockToProfileView(mockTeacher, reviews);
    expect(view.source).toBe('mock');
    expect(view.reviews[0]).toMatchObject({ id: 'r1', studentName: 'Anna', subject: 'Chemistry' });
  });
});
