'use client';

import { useState } from 'react';
import { Star, RotateCcw } from 'lucide-react';
import { SUBJECTS, LANGUAGES } from '@/lib/constants';

const PRICE_RANGES = [
  { label: 'Any Price', min: 0, max: Infinity },
  { label: 'Under $25/hr', min: 0, max: 25 },
  { label: '$25 – $50/hr', min: 25, max: 50 },
  { label: '$50 – $100/hr', min: 50, max: 100 },
  { label: '$100+/hr', min: 100, max: Infinity },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface AppliedTeacherFilters {
  subjects: string[];
  minPrice: number;
  maxPrice: number | null;
  rating: number;
  languages: string[];
  days: string[];
}

export const EMPTY_TEACHER_FILTERS: AppliedTeacherFilters = {
  subjects: [], minPrice: 0, maxPrice: null, rating: 0, languages: [], days: [],
};

export interface TeacherFilterOption { id: string; name: string; icon?: string; count: number }

export function SearchFilters({
  onApply,
  subjects = SUBJECTS,
  languages = LANGUAGES,
}: {
  onApply: (filters: AppliedTeacherFilters) => void;
  subjects?: TeacherFilterOption[];
  languages?: string[];
}) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const resetFilters = () => {
    setSelectedSubjects([]);
    setSelectedPriceRange(0);
    setSelectedRating(0);
    setSelectedLanguages([]);
    setSelectedDays([]);
    onApply(EMPTY_TEACHER_FILTERS);
  };

  const applyFilters = () => {
    const price = PRICE_RANGES[selectedPriceRange];
    onApply({
      subjects: selectedSubjects.map((id) => subjects.find((subject) => subject.id === id)?.name).filter((name): name is string => Boolean(name)),
      minPrice: price.min,
      maxPrice: Number.isFinite(price.max) ? price.max : null,
      rating: selectedRating,
      languages: selectedLanguages,
      days: selectedDays,
    });
  };

  const activeFiltersCount =
    selectedSubjects.length +
    (selectedPriceRange > 0 ? 1 : 0) +
    (selectedRating > 0 ? 1 : 0) +
    selectedLanguages.length +
    selectedDays.length;

  return (
    <div className="space-y-6 border border-black/10 p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium tracking-[-0.02em] text-[#171813]">Filters</h2>
        {activeFiltersCount > 0 && (
          <span className="text-[11px] font-medium text-[#171813] bg-[#dceaa8] px-2 py-0.5">
            {activeFiltersCount} active
          </span>
        )}
      </div>

      {/* Subject checkboxes */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-black/40 mb-3">Subject</h3>
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {subjects.map((subject) => (
            <label
              key={subject.id}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selectedSubjects.includes(subject.id)}
                onChange={() => toggleSubject(subject.id)}
                className="h-4 w-4 border-black/20 text-[#171813] focus:ring-1 focus:ring-[#91a838] focus:ring-offset-0 cursor-pointer"
              />
              <span className="flex items-center gap-1.5 text-sm text-black/60 group-hover:text-black transition-colors">
                {subject.icon && <span>{subject.icon}</span>}
                <span>{subject.name}</span>
              </span>
              <span className="ml-auto text-[11px] text-black/35">{subject.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-black/10" />

      {/* Price Range radios */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-black/40 mb-3">Price Range</h3>
        <div className="space-y-2">
          {PRICE_RANGES.map((range, index) => (
            <label
              key={range.label}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="radio"
                name="priceRange"
                checked={selectedPriceRange === index}
                onChange={() => setSelectedPriceRange(index)}
                className="h-4 w-4 border-black/20 text-[#171813] focus:ring-1 focus:ring-[#91a838] focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-sm text-black/60 group-hover:text-black transition-colors">
                {range.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-black/10" />

      {/* Rating selector */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-black/40 mb-3">Minimum Rating</h3>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              type="button"
              key={rating}
              onClick={() =>
                setSelectedRating(selectedRating === rating ? 0 : rating)
              }
              className="p-1 transition-transform hover:scale-110"
              aria-label={`${rating} star${rating > 1 ? 's' : ''}`}
            >
              <Star
                className={`h-5 w-5 transition-colors ${
                  rating <= selectedRating
                    ? 'text-[#91a838] fill-[#91a838]'
                    : 'text-black/25 hover:text-black/40'
                }`}
              />
            </button>
          ))}
          {selectedRating > 0 && (
            <span className="ml-2 text-xs text-black/45">{selectedRating}+ stars</span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-black/10" />

      {/* Language checkboxes */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-black/40 mb-3">Language</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {languages.map((lang) => (
            <label
              key={lang}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selectedLanguages.includes(lang)}
                onChange={() => toggleLanguage(lang)}
                className="h-4 w-4 border-black/20 text-[#171813] focus:ring-1 focus:ring-[#91a838] focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-sm text-black/60 group-hover:text-black transition-colors">
                {lang}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-black/10" />

      {/* Availability day pills */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-black/40 mb-3">Availability</h3>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <button
              type="button"
              key={day}
              onClick={() => toggleDay(day)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border ${
                selectedDays.includes(day)
                  ? 'bg-[#171813] text-white border-[#171813]'
                  : 'bg-transparent text-black/55 border-black/15 hover:border-black/30 hover:text-black'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-black/10" />

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <button type="button" onClick={applyFilters} className="w-full bg-[#171813] hover:bg-[#91a838] text-sm font-semibold text-white hover:text-black py-2.5 transition-colors">
          Apply Filters
        </button>
        <button
          type="button"
          onClick={resetFilters}
          className="w-full flex items-center justify-center gap-1.5 border border-black/15 text-sm text-black/55 hover:text-black hover:border-black/30 py-2.5 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset All
        </button>
      </div>
    </div>
  );
}
