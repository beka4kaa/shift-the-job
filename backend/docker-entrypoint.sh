#!/bin/sh
set -e

# Fail loudly rather than silently running with an insecure default key.
if [ -z "$DJANGO_SECRET_KEY" ]; then
  echo "ERROR: DJANGO_SECRET_KEY is not set. Refusing to start." >&2
  exit 1
fi

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

exec "$@"
