// src/api/auth.ts
import { http } from './http';
import { ApiResponse, LoginRequest, LoginResponse, SignupRequest, VerifyRequest } from '@/types';

// 1. 회원가입 (이메일 발송)
export const signup = async (data: SignupRequest) => {
  const response = await http.post<ApiResponse<null>>('/api/auth/signup', data);
  return response.data;
};

// 2. 이메일 인증 코드 확인
export const verifyEmail = async (data: VerifyRequest) => {
  const response = await http.post<ApiResponse<null>>('/api/auth/verify', data);
  return response.data;
};

// 3. 로그인 (토큰 발급)
export const login = async (data: LoginRequest) => {
  const response = await http.post<ApiResponse<LoginResponse>>('/api/auth/login', data);
  return response.data;
};