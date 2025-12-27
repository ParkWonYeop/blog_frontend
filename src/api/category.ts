import { http } from './http';
import { ApiResponse, Category, CategoryCreateRequest, CategoryUpdateRequest } from '@/types';

// 카테고리 트리 구조 조회 (GET /api/categories)
export const getCategories = async () => {
  const response = await http.get<ApiResponse<Category[]>>('/api/categories');
  return response.data.data;
};

// 카테고리 생성 (POST /api/admin/categories)
export const createCategory = async (data: CategoryCreateRequest) => {
  const response = await http.post<ApiResponse<Category>>('/api/admin/categories', data);
  return response.data;
};

// 카테고리 수정/이동 (PUT /api/admin/categories/{id})
// 백엔드 반환값이 ApiResponse<Nothing> 이므로 data는 null입니다.
export const updateCategory = async (id: number, data: CategoryUpdateRequest) => {
  const response = await http.put<ApiResponse<null>>(`/api/admin/categories/${id}`, data);
  return response.data;
};

// 카테고리 삭제 (DELETE /api/admin/categories/{id})
export const deleteCategory = async (id: number) => {
  const response = await http.delete<ApiResponse<null>>(`/api/admin/categories/${id}`);
  return response.data;
};