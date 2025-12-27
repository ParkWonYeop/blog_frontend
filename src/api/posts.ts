import { http } from './http';
import { ApiResponse, PostListResponse, Post } from '@/types';

// 1. 게시글 목록 조회 (검색, 카테고리, 태그 필터링 지원)
export const getPosts = async (params?: { 
  page?: number; 
  size?: number; 
  keyword?: string; 
  category?: string; 
  tag?: string; 
}) => {
  const response = await http.get<ApiResponse<PostListResponse>>('/api/posts', {
    params: {
      ...params,
      sort: 'createdAt,desc',
    }
  });
  return response.data.data;
};

// 2. 카테고리별 게시글 조회
export const getPostsByCategory = async (categoryName: string, page = 0, size = 10) => {
  return getPosts({ 
    page, 
    size, 
    category: categoryName 
  });
};

// 3. 게시글 상세 조회
export const getPost = async (slug: string) => {
  const response = await http.get<ApiResponse<Post>>(`/api/posts/${slug}`);
  return response.data.data;
};

// 4. 게시글 작성 (추가됨)
// PostSaveRequest 타입에 맞춰 데이터를 보냅니다.
export const createPost = async (data: any) => {
  const response = await http.post<ApiResponse<Post>>('/api/admin/posts', data);
  return response.data;
};

// 5. 게시글 수정 (추가됨)
export const updatePost = async (id: number, data: any) => {
  const response = await http.put<ApiResponse<Post>>(`/api/admin/posts/${id}`, data);
  return response.data;
};

// 6. 게시글 삭제 (추가됨)
export const deletePost = async (id: number) => {
  const response = await http.delete<ApiResponse<null>>(`/api/admin/posts/${id}`);
  return response.data;
};