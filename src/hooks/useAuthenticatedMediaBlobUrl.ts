import { useEffect, useState } from 'react';
import { getConfig } from '../config/environments';

/**
 * Descarga media inline autenticado y expone un blob URL usable en <video>/<img>.
 * Necesario porque el navegador no puede enviar Authorization en el src de <video>.
 */
export function useAuthenticatedMediaBlobUrl(mediaId: string | null | undefined) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mediaId) {
      setBlobUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    const { apiUrl } = getConfig();
    const token = localStorage.getItem('accessToken');

    setLoading(true);
    setError(null);
    setBlobUrl(null);

    void (async () => {
      try {
        const res = await fetch(`${apiUrl}/media/${mediaId}/content`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          throw new Error(`No se pudo cargar el video (${res.status})`);
        }
        const contentType = res.headers.get('Content-Type') || 'video/mp4';
        const buffer = await res.arrayBuffer();
        if (cancelled) return;
        // Tipo MIME explícito: sin él algunos navegadores no buscan ni reproducen audio bien.
        const blob = new Blob([buffer], { type: contentType.split(';')[0] || 'video/mp4' });
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el video');
          setBlobUrl(null);
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

  return { blobUrl, loading, error };
}
