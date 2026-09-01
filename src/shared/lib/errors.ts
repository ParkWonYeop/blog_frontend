import axios from 'axios';

type ApiErrorBody = {
  message?: string;
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<ApiErrorBody>(error) && error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error instanceof Error && error.message) return error.message;

  return fallback;
};

export const getPrefixedErrorMessage = (error: unknown, fallback: string) => {
  const detail = getErrorMessage(error, fallback);
  return detail === fallback ? fallback : `${fallback}: ${detail}`;
};
