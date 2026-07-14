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

export function SearchFilters() {
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
  };

  const activeFiltersCount =
    selectedSubjects.length +
    (selectedPriceRange > 0 ? 1 : 0) +
    (selectedRating > 0 ? 1 : 0) +
    selectedLanguages.length +
    selectedDays.length;

  return (
    <aside className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Filters</h2>
        {activeFiltersCount > 0 && (
          <span className="text-[11px] font-medium text-purple-400 bg-purple-500/20 rounded-full px-2 py-0.5">
            {activeFiltersCount} active
          </span>
        )}
      </div>

      {/* Subject checkboxes */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">Subject</h3>
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
          {SUBJECTS.map((subject) => (
            <label
              key={subject.id}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selectedSubjects.includes(subject.id)}
                onChange={() => toggleSubject(subject.id)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 focus:ring-1 cursor-pointer"
              />
              <span className="flex items-center gap-1.5 text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
                <span>{subject.icon}</span>
                <span>{subject.name}</span>
              </span>
              <span className="ml-auto text-[11px] text-gray-600">{subject.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Price Range radios */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">Price Range</h3>
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
                className="h-4 w-4 border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 focus:ring-1 cursor-pointer"
              />
              <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
                {range.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Rating selector */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">Minimum Rating</h3>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
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
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-600 hover:text-gray-400'
                }`}
              />
            </button>
          ))}
          {selectedRating > 0 && (
            <span className="ml-2 text-xs text-gray-500">{selectedRating}+ stars</span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Language checkboxes */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">Language</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
          {LANGUAGES.map((lang) => (
            <label
              key={lang}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selectedLanguages.includes(lang)}
                onChange={() => toggleLanguage(lang)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 focus:ring-1 cursor-pointer"
              />
              <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
                {lang}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Availability day pills */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">Availability</h3>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                selectedDays.includes(day)
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 shadow-sm shadow-purple-500/10'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-gray-300'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <button className="w-full rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-medium text-white py-2.5 transition-colors">
          Apply Filters
        </button>
        <button
          onClick={resetFilters}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-400 hover:text-gray-200 py-2.5 transition-colors border border-white/5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset All
        </button>
      </div>
    </aside>
  );
}
