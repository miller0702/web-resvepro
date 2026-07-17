import { useEffect, useState } from 'react';
import { getConfig } from '../config/environments';
import { isAbsoluteHttpUrl, resolveApiMediaUrl } from '../utils/mediaUrl';

type PlayUrlState = {
  /** URL lista para <video src> (https pública o blob: de inline). */
  playUrl: string | null;
  loading: boolean;
  error: string | null;
};

/**
 * Resuelve una URL reproducible para un mediaId:
 * - EXTERNAL (GCS/CDN): usa la URL pública de GET /media/:id/url
 * - INLINE: descarga /content con JWT y crea un blob URL
 */
export function useAuthenticatedMediaBlobUrl(mediaId: string | null | undefined): PlayUrlState {
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mediaId) {
      setPlayUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    const { apiUrl } = getConfig();
    const token = localStorage.getItem('accessToken');
    const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    setLoading(true);
    setError(null);
    setPlayUrl(null);

    void (async () => {
      try {
        const metaRes = await fetch(`${apiUrl}/media/${mediaId}/url`, { headers: authHeaders });
        if (!metaRes.ok) {
          throw new Error(`No se pudo resolver el video (${metaRes.status})`);
        }
        const metaJson = (await metaRes.json()) as {
          data?: { url?: string; storage?: string };
        };
        const rawUrl = metaJson.data?.url?.trim() ?? '';
        const storage = metaJson.data?.storage;

        // GCS / CDN / URL externa: reproducir directo (sin /content).
        if (storage === 'EXTERNAL' || isAbsoluteHttpUrl(rawUrl)) {
          if (!cancelled) setPlayUrl(rawUrl);
          return;
        }

        // INLINE: el src de <video> no envía Authorization → blob autenticado.
        const contentPath = rawUrl.includes('/content')
          ? resolveApiMediaUrl(rawUrl) ?? `${apiUrl}/media/${mediaId}/content`
          : `${apiUrl}/media/${mediaId}/content`;

        const res = await fetch(contentPath, { headers: authHeaders });
        if (!res.ok) {
          throw new Error(`No se pudo cargar el video (${res.status})`);
        }
        const contentType = res.headers.get('Content-Type') || 'video/mp4';
        const buffer = await res.arrayBuffer();
        if (cancelled) return;
        const blob = new Blob([buffer], { type: contentType.split(';')[0] || 'video/mp4' });
        objectUrl = URL.createObjectURL(blob);
        setPlayUrl(objectUrl);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el video');
          setPlayUrl(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mediaId]);

  return { playUrl, loading, error };
}
