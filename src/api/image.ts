import { http } from './http';
import { ApiResponse } from '@/types';

// 이미지 업로드 (POST /api/admin/images)
export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  // 👇 헤더에 Content-Type을 'multipart/form-data'로 명시하거나, 
  //    아예 지워서(undefined) 브라우저가 알아서 boundary를 붙이게 해야 합니다.
  //    가장 안전한 방법은 'Content-Type': 'multipart/form-data'를 명시하는 것입니다.
  
  const response = await http.post<ApiResponse<string>>('/api/admin/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data', // 👈 여기! 이거 추가하면 해결됩니다.
    },
  });
  return response.data;
};