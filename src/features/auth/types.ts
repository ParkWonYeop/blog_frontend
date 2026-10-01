export interface AuthResponse {
  grantType: string;
  accessToken: string;
  accessTokenExpiresIn: number;
}

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface VerifyRequest {
  email: string;
  code: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type LoginResponse = AuthResponse;
