type DateInput = string | Date | null | undefined;

export const toValidDate = (value: DateInput) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatKoreanDate = (
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  fallback = '',
) => {
  const date = toValidDate(value);
  return date ? new Intl.DateTimeFormat('ko-KR', options).format(date) : fallback;
};

export const formatKoreanDateTime = (value: DateInput, fallback = '-') => {
  return formatKoreanDate(value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }, fallback);
};

export const formatKoreanNumericDate = (value: DateInput, fallback = '') => {
  return formatKoreanDate(value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }, fallback);
};

export const formatKoreanReadableDate = (
  value: DateInput,
  withTime = false,
  fallback = '-',
) => {
  return formatKoreanDate(value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }, fallback);
};
