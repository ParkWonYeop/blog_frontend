export const SITE_URL = 'https://blog.wypark.me';
export const SITE_NAME = 'WYPark Blog';
export const DEFAULT_DESCRIPTION = '개발 블로그';

const API_DATE_TIMEZONE = '+09:00';
const TIMEZONE_SUFFIX_PATTERN = /(z|[+-]\d{2}:?\d{2})$/i;

const trimSubMilliseconds = (value: string) => {
  return value.replace(/(\.\d{3})\d+/, '$1');
};

const withApiTimezone = (value: string) => {
  if (TIMEZONE_SUFFIX_PATTERN.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00${API_DATE_TIMEZONE}`;

  return `${value}${API_DATE_TIMEZONE}`;
};

export const getCanonicalUrl = (path = '/') => {
  return new URL(path, SITE_URL).toString();
};

export const parseApiDate = (value?: string | null, fallback = new Date()) => {
  if (!value) return fallback;

  const date = new Date(withApiTimezone(trimSubMilliseconds(value.trim())));

  if (Number.isNaN(date.getTime())) return fallback;

  const now = new Date();
  return date > now ? now : date;
};

