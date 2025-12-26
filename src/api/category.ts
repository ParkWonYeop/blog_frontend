// src/api/category.ts
import { http } from './http';
import { ApiResponse, Category } from '@/types';

// 카테고리 트리 구조 조회 (GET /api/categories)
export const getCategories = async () => {
  const response = await http.get<ApiResponse<Category[]>>('/api/categories');
  return response.data.data; // ApiResponse로 감싸져 있으므로 .data.data 반환
};