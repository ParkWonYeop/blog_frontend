import { jwtDecode } from 'jwt-decode';

type ExpiringJwtPayload = {
  exp?: number;
};

export const isTokenExpired = (token: string, clockSkewSeconds = 0) => {
  try {
    const { exp } = jwtDecode<ExpiringJwtPayload>(token);
    return !exp || Date.now() / 1000 >= exp - clockSkewSeconds;
  } catch {
    return true;
  }
};
