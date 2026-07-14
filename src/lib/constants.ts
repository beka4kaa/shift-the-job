export interface Subject {
  id: string;
  name: string;
  category: string;
  icon: string;
  count: number;
}

export const SUBJECTS: Subject[] = [
  { id: 'sat', name: 'SAT', category: 'Test Prep', icon: '📝', count: 124 },
  { id: 'ielts', name: 'IELTS', category: 'Test Prep', icon: '🌍', count: 98 },
  { id: 'toefl', name: 'TOEFL', category: 'Test Prep', icon: '🎯', count: 76 },
  { id: 'gre', name: 'GRE', category: 'Test Prep', icon: '🎓', count: 53 },
  { id: 'gmat', name: 'GMAT', category: 'Test Prep', icon: '📊', count: 41 },
  { id: 'act', name: 'ACT', category: 'Test Prep', icon: '✏️', count: 37 },
  { id: 'ap', name: 'AP Courses', category: 'Academic', icon: '📚', count: 89 },
  { id: 'a-levels', name: 'A-Levels', category: 'Academic', icon: '🏫', count: 45 },
  { id: 'math', name: 'Mathematics', category: 'Academic', icon: '🔢', count: 156 },
  { id: 'physics', name: 'Physics', category: 'Academic', icon: '⚛️', count: 67 },
  { id: 'chemistry', name: 'Chemistry', category: 'Academic', icon: '🧪', count: 52 },
  { id: 'biology', name: 'Biology', category: 'Academic', icon: '🧬', count: 48 },
  { id: 'english', name: 'English', category: 'Languages', icon: '🗣️', count: 201 },
  { id: 'programming', name: 'Programming', category: 'Tech', icon: '💻', count: 134 },
  { id: 'lsat', name: 'LSAT', category: 'Test Prep', icon: '⚖️', count: 29 },
  { id: 'mcat', name: 'MCAT', category: 'Test Prep', icon: '🩺', count: 34 },
];

export const LANGUAGES = [
  'English', 'Russian', 'Kazakh', 'Turkish', 'Arabic',
  'Chinese', 'Korean', 'French', 'German', 'Spanish',
];

export const COUNTRIES = [
  'United States', 'United Kingdom', 'Kazakhstan', 'Turkey',
  'South Korea', 'Russia', 'Germany', 'Canada', 'Australia',
  'India', 'China', 'Japan', 'France', 'UAE', 'Uzbekistan', 'Kyrgyzstan',
];

export const PLATFORM_FEE = 0.15;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  KZT: '₸',
  RUB: '₽',
  TRY: '₺',
  KRW: '₩',
  CNY: '¥',
};
