import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, BadgeCheck, Star } from 'lucide-react';
import { formatPrice, getCountryFlag } from '@/lib/utils';

/**
 * Minimal shape a teacher card needs. `ProfileView` (the uniform Django/mock
 * view) is a superset, so both real and fallback data satisfy it.
 */
export interface TeacherCardData {
  id: string;
  name: string;
  image: string;
  headline: string;
  country: string;
  city: string;
  hourlyRate: number;
  currency: string;
  subjects: string[];
  rating: number;
  isVerified: boolean;
}

interface TeacherCardProps { teacher: TeacherCardData }

export function TeacherCard({ teacher }: TeacherCardProps) {
  return (
    <Link href={`/teachers/${teacher.id}`} className="group bg-[#171813] p-5 transition-colors hover:bg-[#22231d]">
      <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
        <Image src={teacher.image} alt={teacher.name} fill unoptimized sizes="(min-width: 768px) 33vw, 90vw" className="object-cover grayscale-[20%] transition duration-500 group-hover:scale-[1.025] group-hover:grayscale-0" />
        <div className="absolute right-3 top-3 bg-[#f4f1e9] px-2.5 py-1 text-xs font-semibold text-black">
          {formatPrice(teacher.hourlyRate, teacher.currency)} / hour
        </div>
      </div>
      <div className="pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-lg font-medium tracking-[-0.02em] text-white">{teacher.name}</h3>
              {teacher.isVerified && <BadgeCheck className="h-4 w-4 text-[#cfe16f]" />}
            </div>
            <p className="mt-1 line-clamp-1 text-sm text-white/45">{getCountryFlag(teacher.country)} {teacher.city} · {teacher.headline}</p>
          </div>
          <ArrowUpRight className="h-5 w-5 shrink-0 text-white/35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <div className="flex gap-2 overflow-hidden">
            {teacher.subjects.slice(0, 2).map((subject) => <span key={subject} className="text-xs text-white/45">{subject}</span>)}
          </div>
          <div className="flex items-center gap-1 text-sm text-white"><Star className="h-3.5 w-3.5 fill-[#cfe16f] text-[#cfe16f]" /> {teacher.rating}</div>
        </div>
      </div>
    </Link>
  );
}
