import { getConfig } from '../config/environments';

/** Convierte rutas relativas de media (`/api/v1/media/...`) en URL absoluta. */
export function resolveApiMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const { apiUrl } = getConfig();
  const origin = apiUrl.replace(/\/api\/v1\/?$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

export function extractMediaIdFromContentPath(input: string): string | null {
  const match = input.trim().match(/\/media\/([0-9a-f-]{36})\/content\/?$/i);
  return match?.[1] ?? null;
}

export function parseYouTubeVideoId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id && id.length === 11 ? id : null;
    }
    if (url.hostname.includes('youtube.com')) {
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v');
        return id && id.length === 11 ? id : null;
      }
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'embed' || parts[0] === 'shorts') {
        return parts[1] && parts[1].length === 11 ? parts[1] : null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function isAbsoluteHttpUrl(input: string) {
  return /^https?:\/\//i.test(input.trim());
}
