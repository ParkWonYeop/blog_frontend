import { ApiResponse, Post, PostListResponse } from '@/types';

export const PUBLIC_POSTS_REVALIDATE_SECONDS = 300;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

type PublicPostListParams = {
  page?: number;
  size?: number;
  keyword?: string;
  category?: string;
  tag?: string;
  sort?: string;
};

const buildPostListUrl = (params: PublicPostListParams = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries({
    ...params,
    sort: params.sort || 'createdAt,desc',
  }).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  return `${API_URL}/api/posts?${searchParams.toString()}`;
};

export const fetchPublicPosts = async (
  params: PublicPostListParams = {},
): Promise<PostListResponse | null> => {
  try {
    const response = await fetch(buildPostListUrl(params), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: PUBLIC_POSTS_REVALIDATE_SECONDS },
    });

    if (!response.ok) return null;

    const json = (await response.json()) as ApiResponse<PostListResponse>;
    return json.data;
  } catch (error) {
    console.error('Public posts fetch error:', error);
    return null;
  }
};

export const fetchPublicPost = async (slug: string): Promise<Post | null> => {
  try {
    const response = await fetch(`${API_URL}/api/posts/${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 },
    });

    if (!response.ok) return null;

    const json = (await response.json()) as ApiResponse<Post>;
    return json.data;
  } catch (error) {
    console.error('Public post fetch error:', error);
    return null;
  }
};

