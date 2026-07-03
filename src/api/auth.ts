import { apiClient } from './client';

export const authApi = {
  login: (login: string, password: string) =>
    apiClient.post('/auth/login', { login, password }),
};
