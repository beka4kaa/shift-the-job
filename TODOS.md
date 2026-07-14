# TODOS

## Trust Layer

### Build full admin credential-review queue

**What:** Build the admin review queue UI, middleware role-gate on `/dashboard/admin/*`, verification state machine, and test suite for tutor credential verification — the architecture already reviewed and approved in the 2026-07-13 `/plan-eng-review` pass, deferred when v1 was rescoped to a manual process.

**Why:** A founder manually flipping `verificationStatus` via Prisma Studio doesn't scale past a handful of tutors. Once submissions exceed what's manually trackable, this becomes necessary.

**Context:** Full spec already exists — see `~/.gstack/projects/youteach2/bekzhan-unknown-design-20260713-195142.md` (Approach B, "Eng Review Outcome" section) and the corresponding eng-review findings: middleware role-gate (Architecture finding 1), server-side URL scheme validation on submission (Architecture finding 3), Vitest test setup for the verification state machine (Test finding 4). Reuse that design as-is rather than re-deriving it — it was already reviewed and resolved.

**Effort:** M
**Priority:** P3
**Depends on:** v1 (manual flag + parent-facing badge) producing enough tutor submissions that manual tracking breaks down (rough threshold: >10 pending at once).

### Add real credential authentication beyond a bare URL

**What:** Replace or supplement the URL-only certificate submission with actual credential authentication — either a third-party verification service or a defined manual document cross-check process (e.g., confirming the linked document matches the tutor's stated name/institution).

**Why:** An outside-voice review of the trust-layer plan flagged that URL-only "verification" checks nothing real — an admin (or the founder, in the manual v1) is trusting an arbitrary link with no proof of authenticity. The VERIFIED badge currently asserts more confidence than the process actually provides, which becomes a real liability once bookings and Stripe payments are flowing through the platform.

**Context:** See the outside-voice findings in the 2026-07-13 `/plan-eng-review` session (finding #4, "URL-only verification is theater"). Not urgent at zero users — there's no point authenticating credentials nobody is looking at yet. Revisit once v1 proves parents actually respond to the VERIFIED badge.

**Effort:** M
**Priority:** P3
**Depends on:** v1 proving the badge changes parent behavior at all (the entire point of shipping the rescoped v1 first).

## Design

### Delete unused dead-code components on the old theme

**What:** Delete `src/components/ui/Button.tsx`, `src/components/ui/Input.tsx`, and `src/components/StatsCounter.tsx` — all three are still on the old purple/navy palette and none are imported anywhere in the app.

**Why:** Confirmed via grep that zero files import any of the three. They don't affect what users see today, but they're stale: a future dev could pick one up assuming it's current, silently reintroducing the old theme.

**Context:** Found during the 2026-07-14 `/design-review` pass that converted every rendered page from the old purple/navy theme to the cream/warm-black system (see `DESIGN.md`). These three were the only remaining old-theme hits in the codebase after that pass, and all three are dead code.

**Effort:** S
**Priority:** P4
**Depends on:** None

## Architecture

### Django + PostgreSQL backend rewrite (preference-driven, needs its own session)

**What:** Replace the Next.js/Prisma/SQLite backend with Django + PostgreSQL. Discussed mid-session on 2026-07-14; deliberately NOT scoped or started here.

**Why:** Stated reason is a language/framework preference for Python/Django, not a technical limitation — SQLite/Prisma were explicitly confirmed not to be the blocker. A real preference, worth taking seriously, but the cost is real too.

**Context:** `/plan-eng-review`'s Step 0 scope challenge on 2026-07-14 found this touches the entire app: 9 Prisma models (`User`, `TeacherProfile`, `Booking`, `Review`, `TeacherCertificate` + verification fields, `TeacherSubject`, `TeacherLanguage`, `TeacherAvailability`, `Subject`), NextAuth v5 credentials auth (just fixed the same day), 3 Stripe API routes, and — depending on whether the frontend is kept as an API client or also rewritten — up to 9 Next.js pages plus the design system (`DESIGN.md`) and trust-layer verification feature built the same day. Estimated multi-day effort, not something to improvise inside another session's context.

Before starting, a dedicated session should decide: (1) keep the Next.js frontend and make Django/DRF an API-only backend, or rewrite the frontend too; (2) migration path for existing data (none yet — zero real users, so this is low-stakes right now); (3) whether this blocks or runs parallel to the other TODOs above (forgot-password, trust-layer admin queue) since those assume the current stack.

**Effort:** XL
**Priority:** P2 (real preference, but no technical urgency)
**Depends on:** A dedicated `/office-hours` or `/plan-eng-review` session scoping the actual migration plan — do not start ad hoc.

## Completed

### Broken /auth/forgot-password link

**What:** The login page linked to `/auth/forgot-password`, which had no corresponding route — a 404 for any real user who clicked it.

**Fix:** Built the full flow: `PasswordResetToken` Prisma model (SHA-256-hashed token, 1-hour expiry, single-use), `POST /api/auth/forgot-password` (generic response regardless of whether the email exists, to prevent enumeration), `POST /api/auth/reset-password` (validates token, updates bcrypt password hash, marks token used), and both pages (`/auth/forgot-password`, `/auth/reset-password`) matching the design system. Reset link is logged server-side (`console.log`) instead of emailed — no email provider is configured yet; swap that one line for real delivery once one is chosen.

**Verified:** enumeration protection (same response for real/fake email), invalid token rejected, short password rejected, successful reset, token single-use enforced (reuse rejected), full UI click-through (fill form → submit → success state), 10 new Vitest tests for the token logic (23 total passing), clean production build.

**Effort:** M
**Priority:** P3
**Completed:** 2026-07-14

### Fix middleware.ts auth check — dashboards are effectively unauthenticated

**What:** `src/middleware.ts` used `!!req.auth` to decide `isLoggedIn`, but this read `true` even with zero session cookies present.

**Why:** `/dashboard/*` routes were not actually gated by authentication.

**Root cause:** `.env` had `DATABASE_URL` and `AUTH_SECRET` concatenated on one line with no separator, so `AUTH_SECRET` was never actually set. Auth.js threw `MissingSecret`, and its middleware wrapper put that error object into `req.auth` instead of `null` — objects are truthy in JS, so `isLoggedIn` was always `true`.

**Fix:** Split `.env` onto separate lines (local file, gitignored). Hardened `middleware.ts` to check `req.auth?.user` instead of bare `req.auth`, so a future config error can't be mistaken for a logged-in session again. Verified via fresh curl (no cookies): `/dashboard/teacher` now 302s to `/auth/login`.

**Effort:** M
**Priority:** P1
**Completed:** 2026-07-14
