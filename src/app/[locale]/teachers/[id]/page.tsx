import { resolveTeacherProfile } from '@/lib/teacher-profile';
import { getCountryFlag } from '@/lib/utils';
import { Star, MapPin, Clock, Users, Award, MessageCircle } from 'lucide-react';
import { ReviewCard } from '@/components/ReviewCard';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import Link from 'next/link';

const ratingBreakdown = [
  { stars: 5, percentage: 78 },
  { stars: 4, percentage: 15 },
  { stars: 3, percentage: 5 },
  { stars: 2, percentage: 1 },
  { stars: 1, percentage: 1 },
];

const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teacher = await resolveTeacherProfile(id);

  if (!teacher) {
    return (
      <div className="min-h-[80vh] bg-[#0a0a0f] text-[#f1f5f9] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Teacher not found</h1>
          <Link
            href="/teachers"
            className="text-purple-400 hover:text-purple-300 underline transition-colors"
          >
            ← Back to teachers
          </Link>
        </div>
      </div>
    );
  }

  const teacherReviews = teacher.reviews;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f1f5f9]">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-purple-900/30 to-blue-900/20 pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start gap-8">
          <img
            src={teacher.image}
            alt={teacher.name}
            className="w-24 h-24 rounded-full border-4 border-purple-500/30 object-cover"
          />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">{teacher.name}</h1>
              <VerifiedBadge verified={teacher.isVerified} />
            </div>
            <p className="text-gray-400 text-lg mb-2">{teacher.headline}</p>
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>
                {getCountryFlag(teacher.country)} {teacher.city}, {teacher.country}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="max-w-7xl mx-auto px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
            <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{teacher.totalStudents}</p>
            <p className="text-gray-400 text-sm">Total Students</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
            <Star className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{teacher.reviewCount}</p>
            <p className="text-gray-400 text-sm">Reviews</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
            <Award className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{teacher.experience} years</p>
            <p className="text-gray-400 text-sm">Experience</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{teacher.rating}</p>
            <p className="text-gray-400 text-sm">Rating</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
            {/* About Section */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">About</h2>
              <p className="text-gray-300 leading-relaxed">{teacher.bio}</p>
            </section>

            {/* Subjects Section */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Subjects</h2>
              <div className="flex flex-wrap gap-2">
                {teacher.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-sm"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </section>

            {/* Languages Section */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Languages</h2>
              <div className="flex flex-wrap gap-2">
                {teacher.languages.map((lang) => (
                  <span
                    key={lang}
                    className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-sm flex items-center gap-2"
                  >
                    <span>{lang}</span>
                  </span>
                ))}
              </div>
            </section>

            {/* Rating Breakdown */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Rating Distribution</h2>
              <div className="space-y-3">
                {ratingBreakdown.map(({ stars, percentage }) => (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 w-12">{stars} star</span>
                    <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 w-10 text-right">{percentage}%</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews Section */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                Student Reviews ({teacherReviews.length})
              </h2>
              <div className="space-y-4">
                {teacherReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            </section>
          </div>

          {/* Right Column - Pricing Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              {/* Price */}
              <div className="mb-4">
                <span className="text-3xl font-bold">
                  {teacher.currency === 'USD' ? '$' : ''}{teacher.hourlyRate}
                </span>
                <span className="text-gray-500 ml-1">/hr</span>
                <p className="text-gray-500 text-sm mt-1">per hour</p>
              </div>

              {/* Response Time */}
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
                <Clock className="w-4 h-4" />
                <span>Replies within 1 hour</span>
              </div>

              {/* Book Button */}
              <Link
                href={`/booking/${teacher.id}`}
                className="w-full block text-center py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Book a Lesson
              </Link>

              {/* Message Button */}
              <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors mt-3 flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Message
              </button>

              {/* Divider */}
              <div className="border-t border-white/10 my-4" />

              {/* Availability */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Available on</h3>
                <div className="flex flex-wrap gap-2">
                  {allDays.map((day) => {
                    const isAvailable = teacher.availability.includes(day);
                    return (
                      <span
                        key={day}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          isAvailable
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'bg-white/5 text-gray-600 border-transparent'
                        }`}
                      >
                        {day}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
