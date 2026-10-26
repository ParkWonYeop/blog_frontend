import { SITE_URL } from '@/shared/lib/site';

export const decodePathSegment = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const encodePathSegment = (value: string) => {
  return encodeURIComponent(decodePathSegment(value));
};

export const getSafeRedirectPath = (value: string | null, fallback = '/') => {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;

  try {
    const target = new URL(value, SITE_URL);
    if (target.origin !== SITE_URL || target.pathname.startsWith('/login')) return fallback;

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
};
