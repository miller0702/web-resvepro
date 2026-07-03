import { apiClient } from './client';

export const mediaApi = {
  upload: (file: File, type?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (type) formData.append('type', type);
    return apiClient.post<{ data: { id: string; url: string; filename: string; mimeType: string } }>(
      '/media/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  registerExternal: (data: {
    url: string;
    filename: string;
    mimeType: string;
    size?: number;
    type?: string;
  }) => apiClient.post('/media/external', data),

  delete: (id: string) => apiClient.delete(`/media/${id}`),
};
