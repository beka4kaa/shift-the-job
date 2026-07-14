import { mockTeachers } from '@/lib/mock-data';
import { TeacherCard } from '@/components/TeacherCard';
import { SearchFilters } from '@/components/SearchFilters';
import { Sliders } from 'lucide-react';

export default function TeachersPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f1f5f9]">
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Find Your Perfect Tutor
          </h1>
          <p className="text-gray-400 mt-2">
            Showing {mockTeachers.length} tutors
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
              <button className="lg:hidden flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors">
                <Sliders className="w-4 h-4" />
                Filters
              </button>

              {/* Sort Dropdown */}
              <select className="bg-[#12121a] border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-300 outline-none focus:border-purple-500/50 transition-colors ml-auto cursor-pointer">
                <option>Top Rated</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Most Reviews</option>
                <option>Most Students</option>
              </select>
            </div>

            {/* Teacher Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {mockTeachers.map((teacher) => (
                <TeacherCard key={teacher.id} teacher={teacher} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
