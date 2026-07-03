import { developmentConfig } from './development';
import { productionConfig } from './production';
import type { AdminConfig, EgwEnv } from './types';

export type { AdminConfig, EgwEnv };

function resolveEnv(): EgwEnv {
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'production') {
    return 'production';
  }
  const env = typeof process !== 'undefined' ? process.env?.EGW_ENV : undefined;
  return env === 'production' ? 'production' : 'development';
}

export function getEgwEnv(): EgwEnv {
  return resolveEnv();
}

export function getConfig(): AdminConfig {
  return getEgwEnv() === 'production' ? productionConfig : developmentConfig;
}
