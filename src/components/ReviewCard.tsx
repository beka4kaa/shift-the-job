import Image from 'next/image';
import { Star } from 'lucide-react';

export interface ReviewCardData { id: string; studentName: string; studentImage: string; rating: number; comment: string; date: string; subject: string }
interface ReviewCardProps { review: ReviewCardData }

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <article className="flex min-h-[360px] flex-col justify-between border-b border-r border-black/10 p-7 sm:p-8">
      <div>
        <div className="mb-7 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-black/35">{review.subject}</span>
          <div className="flex items-center gap-1 text-sm"><Star className="h-3.5 w-3.5 fill-black" /> {review.rating}.0</div>
        </div>
        <blockquote className="text-xl leading-8 tracking-[-0.02em]">“{review.comment}”</blockquote>
      </div>
      <div className="mt-10 flex items-center gap-3">
        <Image src={review.studentImage} alt={review.studentName} width={40} height={40} unoptimized className="h-10 w-10 rounded-full object-cover grayscale" />
        <div><p className="text-sm font-semibold">{review.studentName}</p><p className="mt-0.5 text-xs text-black/40">Verified student</p></div>
      </div>
    </article>
  );
}
