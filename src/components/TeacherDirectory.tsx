'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Sliders, X } from 'lucide-react';
import { TeacherCard } from '@/components/TeacherCard';
import { AppliedTeacherFilters, EMPTY_TEACHER_FILTERS, SearchFilters } from '@/components/SearchFilters';
import type { ProfileView } from '@/lib/teacher-profile';

type Sort = 'rating' | 'price-asc' | 'price-desc' | 'reviews' | 'students';

export function TeacherDirectory({ teachers }: { teachers: ProfileView[] }) {
  const [filters, setFilters] = useState<AppliedTeacherFilters>(EMPTY_TEACHER_FILTERS);
  const [sort, setSort] = useState<Sort>('rating');
  const [mobileFilters, setMobileFilters] = useState(false);
  const subjectOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const teacher of teachers) for (const subject of teacher.subjects) counts.set(subject, (counts.get(subject) ?? 0) + 1);
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => ({ id: name.toLocaleLowerCase(), name, count }));
  }, [teachers]);
  const languageOptions = useMemo(() => [...new Set(teachers.flatMap((teacher) => teacher.languages))].sort(), [teachers]);

  const visible = useMemo(() => {
    const lower = (values: string[]) => values.map((value) => value.toLocaleLowerCase());
    const wantedSubjects = lower(filters.subjects);
    const wantedLanguages = lower(filters.languages);
    const rows = teachers.filter((teacher) => {
      const subjects = lower(teacher.subjects);
      const languages = lower(teacher.languages);
      return (
        (wantedSubjects.length === 0 || wantedSubjects.some((subject) => subjects.includes(subject))) &&
        teacher.hourlyRate >= filters.minPrice &&
        (filters.maxPrice === null || teacher.hourlyRate <= filters.maxPrice) &&
        teacher.rating >= filters.rating &&
        (wantedLanguages.length === 0 || wantedLanguages.some((language) => languages.includes(language))) &&
        (filters.days.length === 0 || filters.days.some((day) => teacher.availability.includes(day)))
      );
    });

    return rows.sort((a, b) => {
      if (sort === 'price-asc') return a.hourlyRate - b.hourlyRate;
      if (sort === 'price-desc') return b.hourlyRate - a.hourlyRate;
      if (sort === 'reviews') return b.reviewCount - a.reviewCount;
      if (sort === 'students') return b.totalStudents - a.totalStudents;
      return b.rating - a.rating;
    });
  }, [filters, sort, teachers]);

  const apply = (next: AppliedTeacherFilters) => {
    setFilters(next);
    setMobileFilters(false);
  };

  return (
    <>
      <div className="mb-10 border-b border-black/10 pb-8">
        <h1 className="text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Find your perfect tutor</h1>
        <p className="mt-3 text-black/50">Showing {visible.length} {visible.length === 1 ? 'tutor' : 'tutors'}</p>
      </div>
      <div className="flex gap-8">
        <aside className="hidden w-80 shrink-0 lg:block"><SearchFilters onApply={apply} subjects={subjectOptions} languages={languageOptions} /></aside>
        <div className="min-w-0 flex-1">
          <div className="mb-6 flex items-center justify-between">
            <button type="button" onClick={() => setMobileFilters(true)} className="flex items-center gap-2 border border-black/15 px-4 py-2 text-sm text-black/60 lg:hidden">
              <Sliders className="h-4 w-4" />Filters
            </button>
            <label className="ml-auto">
              <span className="sr-only">Sort tutors</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="cursor-pointer border border-black/15 bg-transparent px-4 py-2 text-sm text-black/60 outline-none focus:border-black/40">
                <option value="rating">Top Rated</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="reviews">Most Reviews</option>
                <option value="students">Most Students</option>
              </select>
            </label>
          </div>

          {visible.length === 0 ? (
            <div className="border border-black/10 p-12 text-center text-black/50">
              <p>No tutors match these filters.</p>
              <button type="button" onClick={() => setFilters(EMPTY_TEACHER_FILTERS)} className="mt-4 text-sm font-semibold underline underline-offset-4">Clear filters</button>
              {teachers.length === 0 && <p className="mt-3">Be the first to <Link href="/auth/register" className="text-black underline underline-offset-4">create a teaching profile</Link>.</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-px bg-black/10 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((teacher) => <TeacherCard key={teacher.id} teacher={teacher} />)}
            </div>
          )}
        </div>
      </div>

      {mobileFilters && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#f4f1e9] p-5 lg:hidden">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-medium">Filter tutors</h2><button type="button" onClick={() => setMobileFilters(false)} aria-label="Close filters" className="p-2"><X className="h-5 w-5" /></button></div>
          <SearchFilters onApply={apply} subjects={subjectOptions} languages={languageOptions} />
        </div>
      )}
    </>
  );
}
