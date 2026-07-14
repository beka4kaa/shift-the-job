# TODOS

## Trust Layer

### Build full admin credential-review queue

**What:** Build the admin review queue UI, middleware role-gate on `/dashboard/admin/*`, verification state machine, and test suite for tutor credential verification — the architecture already reviewed and approved in the 2026-07-13 `/plan-eng-review` pass, deferred when v1 was rescoped to a manual process.

**Why:** A founder manually flipping `verificationStatus` via Django admin doesn't scale past a handful of tutors. Once submissions exceed what's manually trackable, this becomes necessary.

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

## Completed

### Port Stripe/booking to Django, delete Prisma entirely

**What:** Ported the last Prisma-backed slice — Stripe checkout/connect/webhook and the `Booking` writes behind them — to Django, then removed Prisma from the codebase completely.

- `backend/tutoring/stripe_views.py` (new): `StripeCheckoutView` creates the `Booking` row and Stripe Checkout Session (with Connect `transfer_data` when the teacher has a linked Stripe account); `StripeConnectView` handles Express onboarding; `StripeWebhookView` verifies the signature and confirms the booking on `checkout.session.completed`. Same logic/error handling as the old Next.js routes, now backed by Django's ORM. Covered by new tests in `backend/tutoring/tests.py` (mocked Stripe calls) — 42 Django tests passing.
- `src/app/api/stripe/{checkout,connect,webhook}/route.ts`: converted to thin proxies that forward the caller's `djangoAccessToken` (webhook proxy forwards the raw body + `Stripe-Signature` header unchanged, no auth, so Django's signature check still matches the exact bytes Stripe signed).
- `src/app/[locale]/booking/[teacherId]/page.tsx`: was still reading exclusively from `mockTeachers`, unlike every other rewired page — converted to a server component using `resolveTeacherProfile()` (same pattern as the teacher-profile page), with the interactive form split out to `BookingForm.tsx`. Real Django teachers now resolve correctly; ids with no Django match still fall back to mock data.
- Deleted: `prisma/` (schema, seed script, dev.db), root `dev.db`, `src/lib/prisma.ts`, `src/lib/stripe.ts` (no longer had consumers). Removed `@prisma/client`, `prisma`, `@auth/prisma-adapter` from `package.json`, plus `bcryptjs` and the Node `stripe`/`@stripe/stripe-js` packages (all had zero remaining references once auth and payments moved server-side into Django). Dropped the now-dead `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` entries from `.env`/`.env.example`.

**Verified end-to-end:** booking page for a real Django teacher id renders that teacher's actual name/rate/subjects (confirmed live, not mock data); an expired/invalid session token is correctly forwarded by the proxy and rejected by Django (401, matching Django's real DRF error rather than a proxy-level stub); a valid token reaches Django's checkout view, creates a `Booking` row with server-computed `price`/`platform_fee` matching the teacher's hourly rate, and fails only at Stripe's real API call (expected — no real Stripe key has ever been configured in this project, same as the original Next.js implementation). Zero remaining Prisma references outside `git grep`-confirmed docs/comments cleanup.

**Effort:** M
**Completed:** 2026-07-14

### Django backend built and wired to the frontend (auth, teacher data, password reset)

**What:** Built a full Django + DRF + PostgreSQL backend (`backend/`) mirroring `prisma/schema.prisma` — `accounts` app (custom User, JWT auth, password reset) and `tutoring` app (TeacherProfile/Booking/Review/etc.) — then cut the frontend over to it:
- `src/auth.ts`: NextAuth's Credentials provider now calls Django's `/api/auth/login/` instead of querying Prisma directly (NextAuth stays as the session/cookie layer; Django is the source of truth for credentials). Session exposes `djangoAccessToken` for future authenticated calls.
- `src/lib/teacher-profile.ts`: fetches from Django's `/api/teachers/{id}/` instead of Prisma; `isVerified` now computed by Django.
- Login/register pages wired to real `signIn()`/Django register (previously `console.log` stubs); forgot/reset-password pages point directly at Django, replacing the Prisma-backed Next.js API routes (deleted, along with `src/lib/password-reset.ts`).
- Added `backend/tutoring/management/commands/seed_demo.py` (mirrors `prisma/seed.mjs`).

**Deliberately NOT ported:** Stripe checkout/connect/webhook and the `Booking`/`Review` writes behind them — see the Architecture TODO above.

**Bugs found and fixed during the cutover:**
- `eslint.config.mjs`'s `globalIgnores` didn't exclude `backend/` — ESLint was scanning the Python venv and Django's collected static JS assets, inflating lint output from ~7 errors to 3,884 problems.
- Root `.gitignore`'s blanket `.env*` rule was also silently excluding `.env.example` files (both root and `backend/`), which have no secrets and are meant to be committed.
- `ReviewSerializer.Meta.fields` omitted `teacher` entirely, so it was silently dropped from POST input, causing a NOT NULL constraint violation on insert (caught via manual curl testing, not by the type system, since DRF doesn't error on unknown-but-absent fields).

**Verified end-to-end** with both servers running: teacher profile page renders real Django data with correct verified badge; register creates a real Django user, auto-signs-in, and redirects by role; login authenticates against Django; forgot-password issues a token and logs the reset link (enumeration-safe); reset-password updates the password and the new password works for login; unauthenticated dashboard access still redirects to login; booking page and Stripe routes (untouched) still work. 30 Django tests + 10 Vitest tests passing, clean production build.

**Effort:** XL
**Completed:** 2026-07-14

### Broken /auth/forgot-password link

**What:** The login page linked to `/auth/forgot-password`, which had no corresponding route — a 404 for any real user who clicked it.

**Fix:** Originally built as a Prisma-backed flow (`PasswordResetToken` model, Next.js API routes) on 2026-07-14, then superseded the same day when the Django cutover (see above) replaced it with the equivalent Django-backed flow — same design (SHA-256-hashed token, 1-hour expiry, single-use, enumeration-safe generic response), just served by Django instead of Next.js API routes.

**Verified:** enumeration protection, invalid/expired/reused token rejection, short-password rejection, successful reset, full UI click-through — verified twice, once against each implementation.

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
