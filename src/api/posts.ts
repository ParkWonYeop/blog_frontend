// src/api/posts.ts
import { http } from './http';
import { ApiResponse, PostListResponse } from '@/types'; // ApiResponse 타입 추가
import { Post } from '@/types';

export const getPosts = async (page = 0, size = 10, categoryId?: number, search?: string) => {
  const params: any = { page, size };
  
  if (categoryId) params.categoryId = categoryId;
  if (search) params.search = search;

  // 1. 응답 타입을 ApiResponse<PostListResponse>로 변경
  const response = await http.get<ApiResponse<PostListResponse>>('/api/posts', { params });
  
  // 2. response.data는 { code, message, data: {...} } 형태입니다.
  //    우리가 필요한 건 그 안의 data(실제 게시글 목록)이므로 .data를 한번 더 접근합니다.
  return response.data.data; 
};

export const getPostBySlug = async (slug: string) => {
  const response = await http.get<ApiResponse<Post>>(`/api/posts/${slug}`);
  return response.data.data;
};

export interface CreatePostRequest {
  title: string;
  content: string;
  categoryId: number;
}

// 게시글 생성
export const createPost = async (data: CreatePostRequest) => {
  // 👇 여기를 수정했습니다! (/api/posts -> /api/admin/posts)
  const response = await http.post<ApiResponse<any>>('/api/admin/posts', data);
  return response.data;
};