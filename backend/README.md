# youteach backend (Django + DRF + PostgreSQL)

Replaces the Next.js app's Prisma/SQLite layer. **Not yet wired to the frontend** —
the Next.js app (repo root) still talks to Prisma directly. See `TODOS.md` at the
repo root for the cutover plan (rewire frontend pages to call this API, then
remove Prisma).

## Data model

Mirrors `prisma/schema.prisma` from the Next.js app:
- `accounts.User` — custom user model, email login, `role` (STUDENT/TEACHER/ADMIN)
- `accounts.PasswordResetToken` — same hashed-token/single-use/1hr-expiry design as
  the Next.js app's `src/lib/password-reset.ts`
- `tutoring.TeacherProfile`, `TeacherSubject`, `TeacherLanguage`, `TeacherCertificate`,
  `TeacherAvailability`, `Subject`, `Booking`, `Review`

## API

| Endpoint | Method | Auth | Notes |
|---|---|---|---|
| `/api/auth/register/` | POST | — | `{email, name, password, role}` |
| `/api/auth/login/` | POST | — | `{email, password}` → JWT `{access, refresh}` |
| `/api/auth/login/refresh/` | POST | — | `{refresh}` → new `access` |
| `/api/auth/me/` | GET | JWT | current user |
| `/api/auth/forgot-password/` | POST | — | generic response either way; logs reset link (no email provider configured yet) |
| `/api/auth/reset-password/` | POST | — | `{token, password}` |
| `/api/teachers/` | GET | — | list/detail, read-only |
| `/api/subjects/` | GET | — | catalog, read-only |
| `/api/bookings/` | GET/POST | JWT | scoped to the requesting student |
| `/api/reviews/?teacher=<id>` | GET/POST | JWT for POST | |
| `/admin/` | — | Django superuser | `python manage.py createsuperuser` |

## Local development (no Docker)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate      # uses local SQLite fallback if DATABASE_URL is unset
python manage.py runserver
```

## Docker (Postgres)

From the repo root:

```bash
cp backend/.env.example backend/.env
# fill in DJANGO_SECRET_KEY — generate with:
python3 -c "import secrets; print(secrets.token_urlsafe(50))"

docker compose up --build
```

This starts Postgres + the Django app on `http://localhost:8000`. Migrations and
`collectstatic` run automatically on container start (see `docker-entrypoint.sh`).

**Not yet built:** the Next.js frontend isn't containerized here — it still runs on
the host. Stripe integration also hasn't been ported yet (the Next.js app's
`/api/stripe/*` routes are the only working Stripe integration right now).
