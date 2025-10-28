import type { PaginatedResponse } from './api';

export interface PostNeighbor {
  slug: string;
  title: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  categoryName: string;
  viewCount: number;
  createdAt: string;
  updatedAt?: string | null;
  content?: string;
  tags: string[];
  prevPost?: PostNeighbor | null;
  nextPost?: PostNeighbor | null;
}

export type PostListResponse = PaginatedResponse<Post>;

export interface PostSaveRequest {
  title: string;
  content: string;
  categoryId: number;
  tags: string[];
}

export interface PostListParams {
  page?: number;
  size?: number;
  keyword?: string;
  category?: string;
  tag?: string;
  sort?: string;
}
