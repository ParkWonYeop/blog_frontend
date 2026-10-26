import { http } from '@/shared/api/http';
import type { ApiResponse, McpKey, McpKeyCreateRequest, McpKeyCreateResponse } from '@/shared/types';

export const getMcpKeys = async (): Promise<McpKey[]> => {
  const response = await http.get<ApiResponse<McpKey[]>>('/api/admin/mcp/keys');
  return response.data.data;
};

export const createMcpKey = async (data: McpKeyCreateRequest): Promise<McpKeyCreateResponse> => {
  const response = await http.post<ApiResponse<McpKeyCreateResponse>>('/api/admin/mcp/keys', data);
  return response.data.data;
};

export const revokeMcpKey = async (id: number): Promise<void> => {
  await http.delete<ApiResponse<null>>(`/api/admin/mcp/keys/${id}`);
};
