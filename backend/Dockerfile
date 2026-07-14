# syntax=docker/dockerfile:1

# ---- deps: install Python dependencies once, reused by the runtime stage ----
FROM python:3.12-slim AS deps
WORKDIR /app

# psycopg2-binary needs libpq at runtime; build-essential/libpq-dev only for this stage.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ---- runtime ----
FROM python:3.12-slim AS runtime
WORKDIR /app

# libpq5 is the runtime-only counterpart to libpq-dev (no compiler needed here).
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app && useradd --system --gid app --home /app app

COPY --from=deps /install /usr/local
COPY . .

RUN mkdir -p /app/staticfiles && chown -R app:app /app

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DJANGO_SETTINGS_MODULE=config.settings

EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
