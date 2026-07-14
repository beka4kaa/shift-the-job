# YouTeach Design System

Extracted from `Header.tsx`, `Footer.tsx`, `TeacherCard.tsx`, `ReviewCard.tsx`, `HowItWorks.tsx`, `SubjectCard.tsx`, and the homepage (`src/app/[locale]/page.tsx`) — the pages already on the current design. Every other page must match this, not invent its own variant.

## Colors

| Token | Value | Use |
|---|---|---|
| Cream (background) | `#f4f1e9` | Default page background |
| Warm near-black (foreground) | `#171813` | Body text; also used as a dark section background |
| Lime bright | `#cfe16f` | Accent on dark backgrounds (stars, checkmarks, footer dot) |
| Lime olive | `#91a838` | Accent on light backgrounds (hero dot, link hover, logo dot) |
| Lime pale | `#dceaa8` | Section background (e.g. "For educators") |
| Warm beige | `#e8e3d8` / `#d8d4ca` | Image frames / placeholders |
| Card near-black | `#171813` (cards use `#171813`–`#22231d` hover) | Dark-section cards |

No purple, no blue gradients, no `#0a0a0f` cold navy-black anywhere. Text/border opacity is expressed via Tailwind opacity utilities on `black`/`white`, not gray-scale classes: `text-black/60`, `border-black/10`, `text-white/45`, `border-white/15`, etc.

## Typography

- Sans: Inter (`font-sans`, loaded via `next/font/google` in the locale layout). This is the only body/UI font.
- Serif: Tailwind's default `font-serif` stack, used ONLY as a one-word italic accent inside a heading (e.g. "Learning, made *personal.*"). Never for body text or full headings.
- Headings: `font-medium` (500), tight tracking (`tracking-[-0.04em]` to `tracking-[-0.07em]`), large responsive sizes via `clamp()` for hero text.
- Eyebrow/label text: `text-xs font-semibold uppercase tracking-[0.16em]` to `tracking-[0.18em]`, muted (`text-black/40` or `text-white/40`).

## Layout & Components

- **Cardless, sharp corners.** No `rounded-xl`/`rounded-2xl` bubbles anywhere. Square edges throughout.
- **Hairlines, not shadows.** `border border-black/10` (light) or `border-white/15` (dark) instead of `shadow-*` / blurred glass cards.
- **Grid dividers**: wrap a grid in `border-l border-t border-black/10` (or `bg-white/15` gap on dark sections) so cells get hairline borders from the grid itself, not individual card borders.
- **Section rhythm**: full-bleed sections alternate background — cream → warm near-black → cream → pale lime → cream. Generous vertical padding (`py-20`/`py-28`).
- **Buttons**: rectangular, solid fill, no gradient. Primary: `bg-[#171813] text-white hover:bg-[#91a838] hover:text-black`. Secondary/outline: `border border-black/20 hover:bg-black hover:text-white`.
- **Inputs**: no rounded corners, thin bottom border or full hairline border, no purple focus rings — focus states use the foreground color, not an accent color.

## What NOT to do

- No `bg-[#0a0a0f]`, `#12121a`, `#1a1a2e` (old dark-navy palette).
- No `from-purple-*`/`to-blue-*` gradients, `bg-purple-500`, `text-purple-400`, `border-purple-500/*`.
- No `rounded-xl`/`rounded-2xl`/`backdrop-blur-xl` "glass card" pattern.
- No yellow star ratings (`text-yellow-400`) on light sections — use the lime tokens above for consistency; yellow-filled stars only survive where they were already part of an established rating widget and should be migrated when touched.
