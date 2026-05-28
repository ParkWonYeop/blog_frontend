import { http } from './http';
import {
  AdminComment,
  AdminCommentListResponse,
  ApiResponse,
  Comment,
  CommentDeleteRequest,
  CommentSaveRequest,
} from '@/types';

type RawCommentAuthor = {
  nickname?: string;
  name?: string;
};

type RawCommentPost = {
  slug?: string;
  title?: string;
  postSlug?: string;
  postTitle?: string;
};

type RawAdminComment = AdminComment & {
  nickname?: string;
  authorName?: string;
  writer?: string;
  member?: RawCommentAuthor | null;
  guest?: RawCommentAuthor | null;
  post?: RawCommentPost | null;
  postResponse?: RawCommentPost | null;
  postName?: string;
  articleSlug?: string;
  articleTitle?: string;
};

type RawAdminCommentListResponse = Omit<AdminCommentListResponse, 'content'> & {
  content: RawAdminComment[];
};

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

const normalizeAdminComment = (comment: RawAdminComment): AdminComment => ({
  ...comment,
  author: comment.author
    ?? comment.memberNickname
    ?? comment.guestNickname
    ?? comment.nickname
    ?? comment.authorName
    ?? comment.writer
    ?? comment.member?.nickname
    ?? comment.member?.name
    ?? comment.guest?.nickname
    ?? comment.guest?.name,
  postSlug: comment.postSlug
    ?? comment.post?.slug
    ?? comment.post?.postSlug
    ?? comment.postResponse?.slug
    ?? comment.postResponse?.postSlug
    ?? comment.articleSlug,
  postTitle: comment.postTitle
    ?? comment.post?.title
    ?? comment.post?.postTitle
    ?? comment.postResponse?.title
    ?? comment.postResponse?.postTitle
    ?? comment.postName
    ?? comment.articleTitle,
});

const normalizeAdminComments = (
  data: RawAdminCommentListResponse | RawAdminComment[],
): AdminCommentListResponse => {
  if (Array.isArray(data)) {
    return {
      content: data.map(normalizeAdminComment),
      totalElements: data.length,
      totalPages: 1,
      number: 0,
      last: true,
    };
  }

  return {
    ...data,
    content: data.content.map(normalizeAdminComment),
    totalElements: data.page?.totalElements ?? data.totalElements,
    totalPages: data.page?.totalPages ?? data.totalPages,
    number: data.page?.number ?? data.number,
    last: data.page?.last ?? data.last,
  };
};

// 4. 관리자 댓글 목록 조회 (대시보드용)
export const getAdminComments = async (page = 0, size = 20) => {
  const response = await http.get<ApiResponse<RawAdminCommentListResponse | RawAdminComment[]>>('/api/admin/comments', {
    params: { page, size },
  });
  return normalizeAdminComments(response.data.data);
};

// 5. 관리자 댓글 강제 삭제
export const deleteAdminComment = async (id: number) => {
  const response = await http.delete<ApiResponse<null>>(`/api/admin/comments/${id}`);
  return response.data;
};
