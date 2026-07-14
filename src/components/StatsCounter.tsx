'use client';

import { useEffect, useRef, useState } from 'react';

interface StatsCounterProps {
  value: number;
  label: string;
  suffix?: string;
}

export function StatsCounter({ value, label, suffix = '' }: StatsCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);

            const duration = 2000; // ms
            const steps = 60;
            const stepDuration = duration / steps;
            let current = 0;

            const timer = setInterval(() => {
              current += 1;
              // Ease-out cubic
              const progress = current / steps;
              const eased = 1 - Math.pow(1 - progress, 3);
              setDisplayValue(Math.round(eased * value));

              if (current >= steps) {
                setDisplayValue(value);
                clearInterval(timer);
              }
            }, stepDuration);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [value, hasAnimated]);

  const formattedValue =
    displayValue >= 1000
      ? `${(displayValue / 1000).toFixed(displayValue >= 10000 ? 0 : 1)}k`
      : displayValue.toLocaleString();

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent tabular-nums">
        {formattedValue}
        {suffix}
      </div>
      <p className="mt-2 text-sm text-gray-400">{label}</p>
    </div>
  );
}
