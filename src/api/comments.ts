import { http } from './http';
import { ApiResponse, Comment, CommentSaveRequest, CommentDeleteRequest } from '@/types';

// 1. 댓글 목록 조회
export const getComments = async (postSlug: string) => {
  const response = await http.get<ApiResponse<Comment[]>>('/api/comments', {
    params: { postSlug },
  });
  return response.data.data;
};

// 2. 댓글 작성
export const createComment = async (data: CommentSaveRequest) => {
  const response = await http.post<ApiResponse<null>>('/api/comments', data);
  return response.data;
};

// 3. 댓글 삭제
export const deleteComment = async (id: number, password?: string) => {
  // Axios의 delete 메서드에서 body를 보내려면 data 속성을 사용해야 합니다.
  const config = password ? { data: { guestPassword: password } as CommentDeleteRequest } : undefined;
  
  const response = await http.delete<ApiResponse<null>>(`/api/comments/${id}`, config);
  return response.data;
};

// 4. 관리자 댓글 목록 조회 (대시보드용)
export const getAdminComments = async (page = 0, size = 20) => {
  const response = await http.get<ApiResponse<any>>('/api/admin/comments', {
    params: { page, size },
  });
  return response.data.data;
};

// 5. 관리자 댓글 강제 삭제
export const deleteAdminComment = async (id: number) => {
  const response = await http.delete<ApiResponse<null>>(`/api/admin/comments/${id}`);
  return response.data;
};