import { describe, it, expect } from 'vitest';
import {
  djangoTeacherToProfileView,
  mockToProfileView,
  type DjangoTeacherRow,
} from './teacher-profile';
import type { MockTeacher, MockReview } from './mock-data';

function buildRow(overrides: Partial<DjangoTeacherRow> = {}): DjangoTeacherRow {
  return {
    id: 1,
    name: 'Aigerim',
    image: null,
    headline: 'Math Tutor',
    bio: 'Bio',
    subjects: ['Mathematics', 'Algebra'],
    languages: ['English'],
    hourly_rate: 25,
    currency: 'USD',
    experience: 10,
    country: 'Kazakhstan',
    city: 'Almaty',
    rating: 4.9,
    review_count: 3,
    total_students: 120,
    is_verified: false,
    availability: ['Mon', 'Fri'],
    reviews: [],
    ...overrides,
  };
}

describe('djangoTeacherToProfileView', () => {
  it('passes through is_verified from the Django API as-is', () => {
    expect(djangoTeacherToProfileView(buildRow({ is_verified: true })).isVerified).toBe(true);
    expect(djangoTeacherToProfileView(buildRow({ is_verified: false })).isVerified).toBe(false);
  });

  it('tags the source as db and stringifies the numeric id', () => {
    const view = djangoTeacherToProfileView(buildRow({ id: 42 }));
    expect(view.source).toBe('db');
    expect(view.id).toBe('42');
  });

  it('falls back to a default avatar when image is null', () => {
    const view = djangoTeacherToProfileView(buildRow({ image: null }));
    expect(view.image).toContain('dicebear');
  });

  it('passes subjects, languages, and availability through as plain string arrays', () => {
    const view = djangoTeacherToProfileView(
      buildRow({ subjects: ['Mathematics'], languages: ['English', 'Russian'], availability: ['Mon', 'Fri'] }),
    );
    expect(view.subjects).toEqual(['Mathematics']);
    expect(view.languages).toEqual(['English', 'Russian']);
    expect(view.availability).toEqual(['Mon', 'Fri']);
  });

  it('maps reviews and fills subject from the primary subject', () => {
    const view = djangoTeacherToProfileView(
      buildRow({
        subjects: ['Mathematics'],
        reviews: [
          {
            id: 7,
            rating: 5,
            comment: 'Great',
            created_at: '2026-01-02T00:00:00Z',
            student_name: 'Sam',
            student_image: null,
          },
        ],
      }),
    );
    expect(view.reviews).toHaveLength(1);
    expect(view.reviews[0]).toMatchObject({
      id: '7',
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
