import { http } from '@/shared/api/http';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  VerifyRequest,
} from '@/shared/types';

export const signup = async (data: SignupRequest) => {
  const response = await http.post<ApiResponse<null>>('/api/auth/signup', data);
  return response.data;
};

export const verifyEmail = async (data: VerifyRequest) => {
  const response = await http.post<ApiResponse<null>>('/api/auth/verify', data);
  return response.data;
};

export const login = async (data: LoginRequest) => {
  const response = await http.post<ApiResponse<LoginResponse>>('/api/auth/login', data);
  return response.data;
};
