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

### Port Stripe/booking to Django, then delete Prisma

**What:** Frontend auth (login/register/session), teacher-profile data, and forgot/reset-password all now run through the Django backend — the only piece still on Prisma is Stripe checkout/connect/webhook (`src/app/api/stripe/*`, `src/lib/stripe.ts`) and its underlying `Booking`/`Review` writes.

**Why:** Same cutover effort as the rest of the Django migration (see Completed below) — Stripe was deliberately deferred rather than ported in the same pass, to keep that change reviewable on its own (payment code deserves its own focused pass, not a footnote on an auth rewrite).

**Remaining work:**
1. Port `POST /api/stripe/checkout` and `/connect` to Django views (create `Booking` rows via Django's ORM, matching `tutoring.serializers.BookingSerializer`'s price/platform_fee computation already in place).
2. Port the Stripe webhook handler (`src/app/api/stripe/webhook/route.ts`) to a Django view — needs Stripe's Python SDK and the same signature verification.
3. Once bookings/reviews/checkout all run through Django: delete `prisma/`, `@prisma/client` + `prisma` from `package.json`, `src/lib/prisma.ts`, and the local `dev.db`/`prisma/dev.db` files.
4. Trust-layer admin-queue TODO above should target Django's `TeacherCertificate` model (already exists there) once picked up — not Prisma.

**Effort:** M
**Priority:** P1 (last remaining piece of an in-progress migration — don't let it stall half-migrated)
**Depends on:** None — unblocked, ready to continue.

## Completed

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
