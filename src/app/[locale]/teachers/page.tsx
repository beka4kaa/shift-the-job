import Link from 'next/link';
import { getTeacherList } from '@/lib/teacher-profile';
import { TeacherCard } from '@/components/TeacherCard';
import { SearchFilters } from '@/components/SearchFilters';
import { Sliders } from 'lucide-react';

export default async function TeachersPage() {
  const teachers = await getTeacherList();

  return (
    <div className="min-h-screen bg-[#f4f1e9] text-[#171813]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-32 pb-16">
        {/* Page Header */}
        <div className="mb-10 border-b border-black/10 pb-8">
          <h1 className="text-4xl font-medium tracking-[-0.04em] sm:text-5xl">
            Find your perfect tutor
          </h1>
          <p className="text-black/50 mt-3">
            Showing {teachers.length} {teachers.length === 1 ? 'tutor' : 'tutors'}
          </p>
        </div>

        {/* Main Layout */}
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <aside className="hidden lg:block w-80 shrink-0">
            <SearchFilters />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
              {/* Mobile Filter Button */}
              <button className="lg:hidden flex items-center gap-2 border border-black/15 px-4 py-2 text-sm text-black/60 hover:border-black/30 hover:text-black transition-colors">
                <Sliders className="w-4 h-4" />
                Filters
              </button>

              {/* Sort Dropdown */}
              <select className="bg-transparent border border-black/15 px-4 py-2 text-sm text-black/60 outline-none focus:border-black/40 transition-colors ml-auto cursor-pointer">
                <option>Top Rated</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Most Reviews</option>
                <option>Most Students</option>
              </select>
            </div>

            {/* Teacher Grid */}
            {teachers.length === 0 ? (
              <div className="border border-black/10 p-12 text-center text-black/50">
                No tutors yet. Be the first to{' '}
                <Link href="/auth/register" className="underline decoration-1 underline-offset-4 text-black">
                  create a teaching profile
                </Link>
                .
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-black/10">
                {teachers.map((teacher) => (
                  <TeacherCard key={teacher.id} teacher={teacher} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
