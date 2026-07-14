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

## Completed
