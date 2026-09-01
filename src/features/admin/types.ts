import type { AdminComment } from '@/features/comment/types';
import type { Post } from '@/features/post/types';

export type DashboardRange = '7d' | '30d' | '90d';

export interface DashboardMetric {
  value: number;
  previousValue?: number;
  changeRate?: number;
}

export interface DashboardOverview {
  todayViews: DashboardMetric;
  weekViews: DashboardMetric;
  monthViews: DashboardMetric;
  totalPosts: number;
  totalComments: number;
  totalCategories: number;
  lastPublishedAt?: string | null;
  generatedAt: string;
}

export interface DashboardTrafficPoint {
  date: string;
  views: number;
}

export interface DashboardPostStat {
  id: number;
  title: string;
  slug: string;
  categoryName: string;
  viewCount: number;
  rangeViewCount: number;
  commentCount?: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface DashboardCategoryStat {
  id: number;
  name: string;
  parentId?: number | null;
  postCount: number;
  viewCount: number;
  recentViewCount: number;
  lastPublishedAt?: string | null;
  childrenCount: number;
}

export interface DashboardActionItems {
  unansweredComments: number;
  uncategorizedPosts: number;
  stalePopularPosts: number;
}

export interface AdminDashboardResponse {
  overview: DashboardOverview;
  traffic: DashboardTrafficPoint[];
  topPosts: DashboardPostStat[];
  risingPosts: DashboardPostStat[];
  stalePopularPosts: DashboardPostStat[];
  recentPosts: Post[];
  recentComments: AdminComment[];
  categoryStats: DashboardCategoryStat[];
  actionItems: DashboardActionItems;
}
