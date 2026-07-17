import { apiClient } from './client';

export type MediaAssetDto = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  storage?: string;
  size?: number;
};

export const mediaApi = {
  upload: (file: File, type?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (type) formData.append('type', type);
    return apiClient.post<{ data: MediaAssetDto }>('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  registerExternal: (data: {
    url: string;
    filename: string;
    mimeType: string;
    size?: number;
    type?: string;
  }) => apiClient.post<{ data: MediaAssetDto }>('/media/external', data),

  gcsStatus: () =>
    apiClient.get<{
      data: { configured: boolean; inlineMaxBytes: number; maxUploadBytes: number };
    }>('/media/gcs/status'),

  createGcsUploadUrl: (data: {
    filename: string;
    mimeType: string;
    size: number;
    type?: string;
  }) =>
    apiClient.post<{
      data: {
        uploadUrl: string;
        objectPath: string;
        publicUrl: string;
        expiresAt: string;
        headers: Record<string, string>;
        type: string;
        maxUploadBytes: number;
      };
    }>('/media/gcs/upload-url', data),

  confirmGcsUpload: (data: {
    objectPath: string;
    filename: string;
    mimeType: string;
    size: number;
    type?: string;
  }) => apiClient.post<{ data: MediaAssetDto }>('/media/gcs/confirm', data),

  /**
   * Sube un archivo grande a GCS con URL firmada y confirma el MediaAsset.
   * El PUT va directo a Cloud Storage (no pasa por la API).
   */
  uploadViaGcs: async (
    file: File,
    type?: string,
    onProgress?: (ratio: number) => void,
  ): Promise<MediaAssetDto> => {
    const signed = await mediaApi.createGcsUploadUrl({
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      type,
    });
    const { uploadUrl, objectPath, headers } = signed.data.data;

    await putFileToSignedUrl(file, uploadUrl, headers['Content-Type'] || file.type, onProgress);

    const confirmed = await mediaApi.confirmGcsUpload({
      objectPath,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      type,
    });
    return confirmed.data.data;
  },

  delete: (id: string) => apiClient.delete(`/media/${id}`),
};

function putFileToSignedUrl(
  file: File,
  uploadUrl: string,
  contentType: string,
  onProgress?: (ratio: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded / event.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(
        new Error(
          `Error al subir a GCS (${xhr.status}). Revisa CORS del bucket y las credenciales.`,
        ),
      );
    };

    xhr.onerror = () => {
      reject(new Error('No se pudo conectar con Cloud Storage. Revisa CORS del bucket.'));
    };

    xhr.send(file);
  });
}
