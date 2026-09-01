import { http } from '@/shared/api/http';
import type { ApiResponse, Profile, ProfileUpdateRequest } from '@/shared/types';

// 블로그 프로필 정보 조회 (GET /api/profile)
export const getProfile = async () => {
  const response = await http.get<ApiResponse<Profile>>('/api/profile');
  return response.data.data;
};

// 프로필 수정 (PUT /api/admin/profile) - 관리자 전용
export const updateProfile = async (data: ProfileUpdateRequest) => {
  const response = await http.put<ApiResponse<Profile>>('/api/admin/profile', data);
  return response.data.data;
};
