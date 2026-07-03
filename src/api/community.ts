import { apiClient } from './client';

export interface AnnouncementPost {
  id: string;
  kind: string;
  body: string;
  tags: string[];
  isPinned?: boolean;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl: string | null;
    isOfficial?: boolean;
  };
  createdAt: string;
}

export const communityAdminApi = {
  listAnnouncements: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{ data: AnnouncementPost[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      '/admin/community/announcements',
      { params },
    ),
  createAnnouncement: (data: { body: string; tags?: string[]; imageIds?: string[] }) =>
    apiClient.post<{ data: AnnouncementPost }>('/admin/community/announcements', data),
};
