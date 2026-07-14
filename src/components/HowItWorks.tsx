import { CalendarDays, Search, Video } from 'lucide-react';

const STEPS = [
  { number: '01', icon: Search, title: 'Discover', description: 'Filter by subject, experience, availability, and price. Find someone whose approach feels right.' },
  { number: '02', icon: CalendarDays, title: 'Schedule', description: 'Pick a time that works for both of you. No subscriptions and no complicated commitments.' },
  { number: '03', icon: Video, title: 'Learn', description: 'Meet online, get focused feedback, and build a study rhythm around your real goals.' },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-black/40">How it works</p>
            <h2 className="text-4xl font-medium leading-[1.05] tracking-[-0.05em] sm:text-6xl">Three steps.<br /><span className="font-serif font-normal italic">One good match.</span></h2>
          </div>
          <div className="border-t border-black/15">
            {STEPS.map((step) => (
              <div key={step.number} className="grid gap-5 border-b border-black/15 py-7 sm:grid-cols-[4rem_1fr_1.4fr] sm:items-start">
                <span className="text-xs font-semibold text-black/35">{step.number}</span>
                <div className="flex items-center gap-3"><step.icon className="h-4 w-4" /><h3 className="text-lg font-medium">{step.title}</h3></div>
                <p className="text-sm leading-6 text-black/50">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
