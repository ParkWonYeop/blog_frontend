import type { PaginatedResponse } from '@/shared/types/api';

export interface Comment {
  id: number;
  content: string;
  author: string;
  isPostAuthor: boolean;
  memberId?: number | null;
  createdAt: string;
  children: Comment[];
}

export interface CommentSaveRequest {
  postSlug: string;
  content: string;
  parentId?: number | null;
  guestNickname?: string;
  guestPassword?: string;
}

export interface CommentDeleteRequest {
  guestPassword?: string;
}

export interface AdminComment {
  id: number;
  content: string;
  author?: string;
  guestNickname?: string;
  memberNickname?: string;
  postSlug?: string;
  postTitle?: string;
  createdAt: string;
}

export type AdminCommentListResponse = PaginatedResponse<AdminComment>;
