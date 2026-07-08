import axios from 'axios';
import { getConfig } from '../config/environments';

const { apiUrl } = getConfig();

export const publicApiClient = axios.create({
  baseURL: apiUrl,
  headers: { 'Content-Type': 'application/json' },
});

export const publicApi = {
  getLegalDocument: (type: string) =>
    publicApiClient.get<{
      data: { title: string; content: string; version: string; updatedAt: string };
    }>(`/legal/${type}`),

  requestAccountDeletion: (payload: { email: string; message?: string }) =>
    publicApiClient.post('/account/deletion-request', payload),
};
