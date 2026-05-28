import { http } from './http';
import { AdminDashboardResponse, ApiResponse, DashboardRange } from '@/types';

export const getAdminDashboard = async (
  range: DashboardRange = '30d',
  timezone = 'Asia/Seoul',
) => {
  const response = await http.get<ApiResponse<AdminDashboardResponse>>('/api/admin/dashboard', {
    params: { range, timezone },
  });

  return response.data.data;
};
