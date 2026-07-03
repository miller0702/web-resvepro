import { apiClient } from './client';

export const platformApi = {
  getRequirements: (status?: string) =>
    apiClient.get('/admin/requirements', { params: status ? { status } : {} }),
  updateRequirement: (id: string, data: unknown) =>
    apiClient.patch(`/admin/requirements/${id}`, data),
  getLegalDocuments: () => apiClient.get('/admin/legal'),
  updateLegalDocument: (type: string, data: unknown) =>
    apiClient.patch(`/admin/legal/${type}`, data),
  getSettings: () => apiClient.get('/admin/settings'),
  updateSettings: (data: unknown) => apiClient.patch('/admin/settings', data),
  getSecuritySettings: () => apiClient.get('/admin/settings/security'),
  updateSecuritySettings: (data: unknown) => apiClient.patch('/admin/settings/security', data),
  getAppSections: () => apiClient.get('/admin/app/sections'),
  getAppSection: (code: string) => apiClient.get(`/admin/app/sections/${code}`),
  updateAppSection: (code: string, data: unknown) =>
    apiClient.patch(`/admin/app/sections/${code}`, data),
  reorderAppSections: (codes: string[]) =>
    apiClient.patch('/admin/app/sections/reorder', { codes }),
  getDrawerItems: () => apiClient.get('/admin/app/drawer'),
  updateDrawerItem: (code: string, data: unknown) =>
    apiClient.patch(`/admin/app/drawer/${code}`, data),
  bulkUpdateDrawerItems: (items: unknown[]) => apiClient.patch('/admin/app/drawer', { items }),
  getManualSections: () => apiClient.get('/admin/app/manual'),
  bulkUpdateManualSections: (items: unknown[]) => apiClient.patch('/admin/app/manual', { items }),
  getTutorialSteps: () => apiClient.get('/admin/app/tutorial'),
  bulkUpdateTutorialSteps: (items: unknown[]) => apiClient.patch('/admin/app/tutorial', { items }),
};
