import type { AdminConfig } from './types';

const DEFAULT_PROD_API =
  'https://api-resvepro-web-1046799880752.us-west1.run.app/api/v1';

export const productionConfig: AdminConfig = {
  env: 'production',
  apiUrl: import.meta.env.VITE_API_URL || DEFAULT_PROD_API,
  appName: 'RESVEPRO',
  appTagline: 'Restaurando Verdades Proféticas',
};
