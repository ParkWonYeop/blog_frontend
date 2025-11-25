import { http } from './http';
import { encodePathSegment } from '@/lib/paths';
import type { ApiResponse, Post, PostListParams, PostListResponse, PostSaveRequest } from '@/types';

export const getPosts = async (params?: PostListParams) => {
  const response = await http.get<ApiResponse<PostListResponse>>('/api/posts', {
    params: {
      ...params,
      sort: params?.sort || 'createdAt,desc',
    }
  });
  return response.data.data;
};

export const getPostsByCategory = async (categoryName: string, page = 0, size = 10, keyword?: string) => {
  return getPosts({ 
    page, 
    size, 
    category: categoryName,
    keyword,
  });
};

export const getPost = async (slug: string) => {
  const response = await http.get<ApiResponse<Post>>(`/api/posts/${encodePathSegment(slug)}`);
  return response.data.data;
};

export const createPost = async (data: PostSaveRequest) => {
  const response = await http.post<ApiResponse<Post>>('/api/admin/posts', data);
  return response.data;
};

export const updatePost = async (id: number, data: PostSaveRequest) => {
  const response = await http.put<ApiResponse<Post>>(`/api/admin/posts/${id}`, data);
  return response.data;
};

export const deletePost = async (id: number) => {
  const response = await http.delete<ApiResponse<null>>(`/api/admin/posts/${id}`);
  return response.data;
};
