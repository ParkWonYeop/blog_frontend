import { http } from '@/shared/api/http';
import type { AdminDashboardResponse, ApiResponse, DashboardRange } from '@/shared/types';

export const getAdminDashboard = async (
  range: DashboardRange = '30d',
  timezone = 'Asia/Seoul',
) => {
  const response = await http.get<ApiResponse<AdminDashboardResponse>>('/api/admin/dashboard', {
    params: { range, timezone },
  });

  return response.data.data;
};
