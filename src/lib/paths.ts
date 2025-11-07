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
  if (value.startsWith('/login') || value.includes('://')) return fallback;

  return value;
};
