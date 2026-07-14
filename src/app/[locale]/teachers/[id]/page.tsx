import { resolveTeacherProfile } from '@/lib/teacher-profile';
import { getCountryFlag } from '@/lib/utils';
import { Star, MapPin, Clock, Users, Award, MessageCircle, ArrowRight } from 'lucide-react';
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
      <div className="min-h-[80vh] bg-[#f4f1e9] text-[#171813] flex items-center justify-center px-5">
        <div className="text-center">
          <h1 className="text-2xl font-medium tracking-[-0.02em] mb-4">Teacher not found</h1>
          <Link
            href="/teachers"
            className="text-sm font-semibold underline decoration-1 underline-offset-4"
          >
            ← Back to teachers
          </Link>
        </div>
      </div>
    );
  }

  const teacherReviews = teacher.reviews;

  return (
    <div className="min-h-screen bg-[#f4f1e9] text-[#171813]">
      {/* Hero */}
      <div className="border-b border-black/10 px-5 sm:px-8 pt-32 pb-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start gap-8">
          <img
            src={teacher.image}
            alt={teacher.name}
            className="w-24 h-24 border border-black/10 object-cover"
          />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-medium tracking-[-0.03em]">{teacher.name}</h1>
              <VerifiedBadge verified={teacher.isVerified} />
            </div>
            <p className="text-black/55 text-lg mb-2">{teacher.headline}</p>
            <div className="flex items-center gap-2 text-black/55">
              <MapPin className="w-4 h-4" />
              <span>
                {getCountryFlag(teacher.country)} {teacher.city}, {teacher.country}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 border-l border-t border-black/10">
          <div className="border-r border-b border-black/10 p-6 text-center">
            <Users className="w-5 h-5 text-black/45 mx-auto mb-2" />
            <p className="text-2xl font-medium tracking-[-0.02em]">{teacher.totalStudents}</p>
            <p className="text-black/45 text-sm">Total Students</p>
          </div>
          <div className="border-r border-b border-black/10 p-6 text-center">
            <Star className="w-5 h-5 text-black/45 mx-auto mb-2" />
            <p className="text-2xl font-medium tracking-[-0.02em]">{teacher.reviewCount}</p>
            <p className="text-black/45 text-sm">Reviews</p>
          </div>
          <div className="border-r border-b border-black/10 p-6 text-center">
            <Award className="w-5 h-5 text-black/45 mx-auto mb-2" />
            <p className="text-2xl font-medium tracking-[-0.02em]">{teacher.experience} years</p>
            <p className="text-black/45 text-sm">Experience</p>
          </div>
          <div className="border-r border-b border-black/10 p-6 text-center">
            <Star className="w-5 h-5 text-[#91a838] fill-[#91a838] mx-auto mb-2" />
            <p className="text-2xl font-medium tracking-[-0.02em]">{teacher.rating}</p>
            <p className="text-black/45 text-sm">Rating</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
            {/* About Section */}
            <section className="mb-8">
              <h2 className="text-xl font-medium tracking-[-0.02em] mb-4">About</h2>
              <p className="text-black/65 leading-relaxed">{teacher.bio}</p>
            </section>

            {/* Subjects Section */}
            <section className="mb-8">
              <h2 className="text-xl font-medium tracking-[-0.02em] mb-4">Subjects</h2>
              <div className="flex flex-wrap gap-2">
                {teacher.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="border border-black/15 px-4 py-2 text-sm text-black/70"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </section>

            {/* Languages Section */}
            <section className="mb-8">
              <h2 className="text-xl font-medium tracking-[-0.02em] mb-4">Languages</h2>
              <div className="flex flex-wrap gap-2">
                {teacher.languages.map((lang) => (
                  <span
                    key={lang}
                    className="border border-black/15 px-4 py-2 text-sm text-black/70"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </section>

            {/* Rating Breakdown */}
            <section className="mb-8">
              <h2 className="text-xl font-medium tracking-[-0.02em] mb-4">Rating distribution</h2>
              <div className="space-y-3">
                {ratingBreakdown.map(({ stars, percentage }) => (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="text-sm text-black/55 w-12">{stars} star</span>
                    <div className="flex-1 h-2 bg-black/10">
                      <div
                        className="h-full bg-[#171813]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-black/45 w-10 text-right">{percentage}%</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews Section */}
            <section className="mb-8">
              <h2 className="text-xl font-medium tracking-[-0.02em] mb-4">
                Student reviews ({teacherReviews.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 border-l border-t border-black/10">
                {teacherReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            </section>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 border border-black/10 p-6">
              {/* Price */}
              <div className="mb-4">
                <span className="text-3xl font-medium tracking-[-0.02em]">
                  {teacher.currency === 'USD' ? '$' : ''}{teacher.hourlyRate}
                </span>
                <span className="text-black/45 ml-1">/hr</span>
                <p className="text-black/45 text-sm mt-1">per hour</p>
              </div>

              {/* Response Time */}
              <div className="flex items-center gap-2 text-black/55 text-sm mb-6">
                <Clock className="w-4 h-4" />
                <span>Replies within 1 hour</span>
              </div>

              {/* Book Button */}
              <Link
                href={`/booking/${teacher.id}`}
                className="group w-full flex items-center justify-center gap-2 bg-[#171813] px-6 py-3 text-sm font-semibold text-white hover:bg-[#91a838] hover:text-black transition-colors"
              >
                Book a Lesson
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              {/* Message Button */}
              <button className="w-full py-3 border border-black/15 text-black/70 hover:border-black/30 hover:text-black transition-colors mt-3 flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Message
              </button>

              {/* Divider */}
              <div className="border-t border-black/10 my-4" />

              {/* Availability */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-black/40 mb-3">Available on</h3>
                <div className="flex flex-wrap gap-2">
                  {allDays.map((day) => {
                    const isAvailable = teacher.availability.includes(day);
                    return (
                      <span
                        key={day}
                        className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                          isAvailable
                            ? 'bg-[#171813] text-white border-[#171813]'
                            : 'bg-transparent text-black/35 border-black/10'
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
