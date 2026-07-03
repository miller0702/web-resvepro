export type EgwEnv = 'development' | 'production';

export interface AdminConfig {
  env: EgwEnv;
  apiUrl: string;
  appName: string;
  appTagline: string;
}
