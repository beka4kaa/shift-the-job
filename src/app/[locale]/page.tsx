import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, Search, Star } from 'lucide-react';
import { SubjectCard } from '@/components/SubjectCard';
import { TeacherCard } from '@/components/TeacherCard';
import { ReviewCard } from '@/components/ReviewCard';
import { HowItWorks } from '@/components/HowItWorks';
import { SUBJECTS } from '@/lib/constants';
import { mockTeachers, mockReviews } from '@/lib/mock-data';

const quickTags = ['SAT', 'IELTS', 'TOEFL', 'GRE', 'GMAT'];

export default function HomePage() {
  const featuredTeachers = mockTeachers.filter((teacher) => teacher.featured).slice(0, 3);
  const spotlightTeacher = featuredTeachers[0];

  return (
    <>
      <section className="border-b border-black/10 px-5 pb-20 pt-32 sm:px-8 lg:pb-28 lg:pt-40">
        <div className="mx-auto grid max-w-7xl items-end gap-14 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 border border-black/15 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-black/60">
              <span className="h-2 w-2 rounded-full bg-[#91a838]" />
              Tutors available this week
            </div>
            <h1 className="max-w-5xl text-[clamp(3.4rem,8vw,7.5rem)] font-medium leading-[0.88] tracking-[-0.07em] text-[#171813]">
              Learning, made <span className="font-serif font-normal italic tracking-[-0.04em]">personal.</span>
            </h1>
            <div className="mt-10 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
              <p className="max-w-xl text-lg leading-8 text-black/60">
                Meet experienced tutors who understand your goals, your pace,
                and the way you learn best.
              </p>
              <Link
                href="/teachers"
                className="group inline-flex w-fit items-center gap-3 bg-[#171813] px-6 py-4 text-sm font-semibold text-white transition-colors hover:bg-[#91a838] hover:text-black"
              >
                Find your tutor
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="border border-black/10 bg-[#e8e3d8] p-3">
            <div className="relative aspect-[4/3] overflow-hidden bg-[#d8d4ca]">
              <Image
                src={spotlightTeacher.image}
                alt={spotlightTeacher.name}
                fill
                priority
                unoptimized
                sizes="(min-width: 1024px) 34vw, 90vw"
                className="object-cover grayscale-[15%]"
              />
              <div className="absolute inset-x-3 bottom-3 flex items-end justify-between bg-[#f4f1e9]/95 p-4 backdrop-blur-sm">
                <div>
                  <p className="font-semibold text-[#171813]">{spotlightTeacher.name}</p>
                  <p className="mt-1 text-xs text-black/55">SAT · Harvard graduate</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold">
                  <Star className="h-3.5 w-3.5 fill-[#171813]" />
                  {spotlightTeacher.rating}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-3 border-b border-black/25 pb-3 lg:max-w-2xl">
            <Search className="h-5 w-5 text-black/45" />
            <input
              type="search"
              aria-label="Search tutors"
              placeholder="What would you like to learn?"
              className="w-full bg-transparent text-base text-black outline-none placeholder:text-black/40"
            />
            <Link href="/teachers" className="text-sm font-semibold underline decoration-1 underline-offset-4">
              Search
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-black/55 lg:ml-auto">
            <span className="text-xs uppercase tracking-widest text-black/35">Popular</span>
            {quickTags.map((tag) => (
              <Link key={tag} href={`/teachers?subject=${tag.toLowerCase()}`} className="hover:text-black">
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="subjects" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col justify-between gap-5 border-b border-black/10 pb-7 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-black/40">Explore</p>
              <h2 className="text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Popular subjects</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-black/50">Focused support for exams, languages, and the subjects that open doors.</p>
          </div>
          <div className="grid grid-cols-1 border-l border-t border-black/10 sm:grid-cols-2 lg:grid-cols-4">
            {SUBJECTS.slice(0, 8).map((subject, index) => (
              <SubjectCard key={subject.id} subject={subject} index={index + 1} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#171813] px-5 py-20 text-white sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Selected educators</p>
              <h2 className="text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Tutors worth meeting</h2>
            </div>
            <Link href="/teachers" className="group inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
              Browse all tutors <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-px bg-white/15 md:grid-cols-3">
            {featuredTeachers.map((teacher) => <TeacherCard key={teacher.id} teacher={teacher} />)}
          </div>
        </div>
      </section>

      <HowItWorks />

      <section id="for-teachers" className="px-5 pb-20 sm:px-8 lg:pb-28">
        <div className="mx-auto grid max-w-7xl overflow-hidden border border-black/10 bg-[#dceaa8] lg:grid-cols-2">
          <div className="p-8 sm:p-12 lg:p-16">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-black/45">For educators</p>
            <h2 className="max-w-lg text-4xl font-medium leading-[1.05] tracking-[-0.05em] sm:text-6xl">Teach on your terms.</h2>
            <p className="mt-6 max-w-md leading-7 text-black/60">Build an independent practice with students who value your expertise.</p>
          </div>
          <div className="flex flex-col justify-between border-t border-black/10 p-8 sm:p-12 lg:border-l lg:border-t-0 lg:p-16">
            <div className="space-y-4">
              {['Choose your own schedule', 'Set a rate that reflects your experience', 'Teach students around the world'].map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 border-b border-black/10 pb-4 text-sm">
                  <Check className="h-4 w-4" /> {benefit}
                </div>
              ))}
            </div>
            <Link href="/auth/register" className="mt-10 inline-flex w-fit items-center gap-3 bg-[#171813] px-6 py-4 text-sm font-semibold text-white">
              Become a tutor <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-black/10 px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 grid gap-5 md:grid-cols-2">
            <h2 className="text-4xl font-medium tracking-[-0.04em] sm:text-5xl">What progress sounds like.</h2>
            <p className="max-w-md text-sm leading-6 text-black/50 md:justify-self-end">Honest notes from students who found the right person to learn with.</p>
          </div>
          <div className="grid grid-cols-1 border-l border-t border-black/10 md:grid-cols-3">
            {mockReviews.slice(0, 3).map((review) => <ReviewCard key={review.id} review={review} />)}
          </div>
        </div>
      </section>
    </>
  );
}
