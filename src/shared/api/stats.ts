import { http } from '@/shared/api/http';
import type { ApiResponse } from '@/shared/types';

export interface BlogStatsSummary {
  monthlyPostCount: number;
  monthlyViewCount: number;
  totalPostCount: number;
}

export const getBlogStats = async () => {
  const response = await http.get<ApiResponse<BlogStatsSummary>>('/api/stats/summary');
  return response.data.data;
};
