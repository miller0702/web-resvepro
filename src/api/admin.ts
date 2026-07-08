import { apiClient } from './client';
import type { ListParams, PaginatedResponse } from '../types/api';

export const adminApi = {
  getStats: () => apiClient.get('/admin/stats'),
  getUsers: (params?: ListParams) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>('/users', {
      params: { limit: 20, ...params },
    }),

  // Libros
  getBooks: (params?: ListParams) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>('/books', {
      params: { limit: 20, ...params },
    }),
  getBook: (id: string) => apiClient.get(`/books/${id}`),
  createBook: (data: unknown) => apiClient.post('/books', data),
  updateBook: (id: string, data: unknown) => apiClient.patch(`/books/${id}`, data),
  deleteBook: (id: string) => apiClient.delete(`/books/${id}`),
  addChapter: (bookId: string, data: unknown) => apiClient.post(`/books/${bookId}/chapters`, data),
  updateChapter: (chapterId: string, data: unknown) =>
    apiClient.patch(`/chapters/${chapterId}`, data),
  deleteChapter: (chapterId: string) => apiClient.delete(`/chapters/${chapterId}`),

  // Categorías
  getCategories: (kind?: string) =>
    apiClient.get<{ data: Array<Record<string, unknown>> }>('/categories', { params: { kind } }),
  getCategory: (id: string) => apiClient.get(`/categories/${id}`),
  createCategory: (data: unknown) => apiClient.post('/categories', data),
  updateCategory: (id: string, data: unknown) => apiClient.patch(`/categories/${id}`, data),
  deleteCategory: (id: string) => apiClient.delete(`/categories/${id}`),

  // Colecciones
  getCollections: () =>
    apiClient.get<{ data: Array<Record<string, unknown>> }>('/collections'),
  getCollection: (id: string) => apiClient.get(`/collections/${id}`),
  createCollection: (data: unknown) => apiClient.post('/collections', data),
  updateCollection: (id: string, data: unknown) => apiClient.patch(`/collections/${id}`, data),
  deleteCollection: (id: string) => apiClient.delete(`/collections/${id}`),
  addBookToCollection: (collectionId: string, data: { bookId: string; sortOrder?: number }) =>
    apiClient.post(`/collections/${collectionId}/books`, data),
  removeBookFromCollection: (collectionId: string, bookId: string) =>
    apiClient.delete(`/collections/${collectionId}/books/${bookId}`),

  // Autores
  getAuthors: () =>
    apiClient.get<{ data: Array<Record<string, unknown>> }>('/authors'),
  getAuthor: (id: string) => apiClient.get(`/authors/${id}`),
  createAuthor: (data: unknown) => apiClient.post('/authors', data),
  updateAuthor: (id: string, data: unknown) => apiClient.patch(`/authors/${id}`, data),
  deleteAuthor: (id: string) => apiClient.delete(`/authors/${id}`),

  // Podcasts
  getPodcasts: (params?: { categoryId?: string }) =>
    apiClient.get<{ data: Array<Record<string, unknown>> }>('/podcasts/series', { params }),
  getPodcast: (id: string) => apiClient.get(`/podcasts/series/${id}`),
  createPodcast: (data: unknown) => apiClient.post('/podcasts/series', data),
  updatePodcast: (id: string, data: unknown) => apiClient.patch(`/podcasts/series/${id}`, data),
  deletePodcast: (id: string) => apiClient.delete(`/podcasts/series/${id}`),
  addPodcastEpisode: (seriesId: string, data: unknown) =>
    apiClient.post(`/podcasts/series/${seriesId}/episodes`, data),
  updatePodcastEpisode: (episodeId: string, data: unknown) =>
    apiClient.patch(`/podcasts/episodes/${episodeId}`, data),
  deletePodcastEpisode: (episodeId: string) => apiClient.delete(`/podcasts/episodes/${episodeId}`),

  // Videos
  getVideos: (params?: { categoryId?: string }) =>
    apiClient.get<{ data: Array<Record<string, unknown>> }>('/videos', { params }),
  getVideo: (id: string) => apiClient.get(`/videos/${id}`),
  createVideo: (data: unknown) => apiClient.post('/videos', data),
  updateVideo: (id: string, data: unknown) => apiClient.patch(`/videos/${id}`, data),
  deleteVideo: (id: string) => apiClient.delete(`/videos/${id}`),
  previewYouTube: (url: string) =>
    apiClient.get('/videos/youtube/preview', { params: { url } }),

  // Radio
  getRadioStations: () =>
    apiClient.get<{ data: Array<Record<string, unknown>> }>('/radio/stations'),
  getRadioStation: (id: string) => apiClient.get(`/radio/stations/${id}`),
  createRadio: (data: unknown) => apiClient.post('/radio/stations', data),
  updateRadio: (id: string, data: unknown) => apiClient.patch(`/radio/stations/${id}`, data),
  deleteRadio: (id: string) => apiClient.delete(`/radio/stations/${id}`),

  // Roles
  getRoles: () => apiClient.get('/roles'),
  getRole: (id: string) => apiClient.get(`/roles/${id}`),
  getPermissions: () => apiClient.get('/permissions'),
  createRole: (data: unknown) => apiClient.post('/roles', data),
  updateRole: (id: string, data: unknown) => apiClient.patch(`/roles/${id}`, data),
  deleteRole: (id: string) => apiClient.delete(`/roles/${id}`),

  getModerationReports: (status?: string, page = 1) =>
    apiClient.get<{ data: Array<Record<string, unknown>>; meta: Record<string, unknown> }>(
      '/admin/moderation/reports',
      { params: { status, page, limit: 50 } },
    ),
  updateModerationReport: (id: string, data: { status: string; adminNotes?: string }) =>
    apiClient.patch(`/admin/moderation/reports/${id}`, data),

  createUser: (data: unknown) => apiClient.post('/admin/users', data),
  getUserById: (id: string) => apiClient.get(`/admin/users/${id}`),
  updateUser: (id: string, data: unknown) => apiClient.patch(`/admin/users/${id}`, data),
  deleteUserAccount: (id: string) => apiClient.post(`/admin/users/${id}/delete-account`),
  impersonateUser: (id: string) => apiClient.post(`/admin/users/${id}/impersonate`),
  stopImpersonation: () => apiClient.post('/admin/impersonate/stop'),
  getAuditLogs: (params?: { page?: number; limit?: number; action?: string }) =>
    apiClient.get('/admin/audit-logs', { params }),
};
