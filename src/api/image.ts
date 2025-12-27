import { http } from './http';
import { ApiResponse } from '@/types';

export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await http.post<ApiResponse<string>>('/api/admin/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};