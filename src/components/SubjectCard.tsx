import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

interface SubjectCardProps {
  subject: { id: string; name: string; icon: string; color?: string; count: number };
  index?: number;
}

export function SubjectCard({ subject, index = 1 }: SubjectCardProps) {
  return (
    <Link href={`/teachers?subject=${subject.id}`} className="group min-h-48 border-b border-r border-black/10 p-6 transition-colors hover:bg-[#dceaa8] sm:min-h-56">
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="text-xs font-medium text-black/35">{String(index).padStart(2, '0')}</span>
          <ArrowUpRight className="h-4 w-4 text-black/30 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-black" />
        </div>
        <div>
          <h3 className="text-2xl font-medium tracking-[-0.03em]">{subject.name}</h3>
          <p className="mt-2 text-sm text-black/45">{subject.count} verified tutors</p>
        </div>
      </div>
    </Link>
  );
}
