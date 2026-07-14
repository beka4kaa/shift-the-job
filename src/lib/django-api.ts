/**
 * Base URL for the Django backend (see /backend). Server-side only — use
 * NEXT_PUBLIC_DJANGO_API_URL instead in client components.
 */
export const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000';

/** Client-safe counterpart of DJANGO_API_URL, for 'use client' components. */
export const PUBLIC_DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
