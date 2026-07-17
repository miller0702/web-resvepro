import { useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { mediaApi } from '../api/media';
import { Button } from './ui/Button';
import { toast } from '../lib/toast';
import {
  formatBytes,
  INLINE_MEDIA_MAX_BYTES,
  MAX_MEDIA_UPLOAD_BYTES,
  prepareMediaFile,
} from '../utils/compressVideo';

interface MediaUploadProps {
  label: string;
  accept?: string;
  mediaType?: string;
  currentFilename?: string | null;
  disabled?: boolean;
  /**
   * Si true (default en VIDEO): cuando GCS no está disponible, comprime archivos > 5 MB
   * para intentar subirlos inline.
   */
  compressLargeVideo?: boolean;
  onUploaded: (asset: { id: string; url: string; filename: string; mimeType: string }) => void;
}

function isGcsUnavailable(err: unknown): boolean {
  if (!isAxiosError(err)) return false;
  const status = err.response?.status;
  return status === 503 || status === 500;
}

export function MediaUpload({
  label,
  accept,
  mediaType,
  currentFilename,
  disabled = false,
  compressLargeVideo,
  onUploaded,
}: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shouldCompress =
    compressLargeVideo ?? (mediaType === 'VIDEO' || Boolean(accept?.includes('video')));

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setProgressLabel(null);
    try {
      if (file.size > MAX_MEDIA_UPLOAD_BYTES) {
        const msg = `El archivo pesa ${formatBytes(file.size)}. Máximo permitido: ${formatBytes(MAX_MEDIA_UPLOAD_BYTES)}.`;
        setError(msg);
        toast.warning(msg);
        return;
      }

      // Archivos pequeños → Postgres inline
      if (file.size <= INLINE_MEDIA_MAX_BYTES) {
        setProgressLabel('Subiendo…');
        const res = await mediaApi.upload(file, mediaType);
        onUploaded(res.data.data);
        toast.success('Archivo subido correctamente.');
        return;
      }

      // Archivos grandes → GCS (signed URL)
      try {
        toast.info(
          `Subiendo ${formatBytes(file.size)} a Cloud Storage…`,
          'Archivo grande',
        );
        setProgressLabel('Preparando subida…');
        const asset = await mediaApi.uploadViaGcs(file, mediaType, (ratio) => {
          setProgressLabel(`Subiendo a la nube… ${Math.round(ratio * 100)}%`);
        });
        onUploaded(asset);
        toast.success('Archivo subido a Cloud Storage.');
        return;
      } catch (gcsErr) {
        if (!shouldCompress || !isGcsUnavailable(gcsErr)) {
          throw gcsErr;
        }
        // Fallback: comprimir e intentar inline si GCS no está configurado
        toast.info(
          `Cloud Storage no disponible. Comprimiendo a ≤ ${formatBytes(INLINE_MEDIA_MAX_BYTES)}…`,
          'Compresión',
        );
        setProgressLabel('Comprimiendo video…');
        const prepared = await prepareMediaFile(file, {
          mediaType: mediaType ?? 'VIDEO',
          maxBytes: INLINE_MEDIA_MAX_BYTES,
          onProgress: (ratio) => {
            setProgressLabel(`Comprimiendo… ${Math.round(ratio * 100)}%`);
          },
        });
        if (prepared.file.size > INLINE_MEDIA_MAX_BYTES) {
          throw new Error(
            `Tras comprimir sigue pesando ${formatBytes(prepared.file.size)}. Configura GCS_BUCKET o usa una URL externa.`,
          );
        }
        setProgressLabel('Subiendo…');
        const res = await mediaApi.upload(prepared.file, mediaType);
        onUploaded(res.data.data);
        toast.success(
          prepared.compressed
            ? `Comprimido a ${formatBytes(prepared.file.size)} y subido.`
            : 'Archivo subido correctamente.',
        );
      }
    } catch (err) {
      const message = isAxiosError(err)
        ? String(
            (err.response?.data as { message?: string | string[] })?.message ??
              err.message,
          )
        : err instanceof Error
          ? err.message
          : 'No se pudo subir el archivo.';
      const display = Array.isArray(message) ? message.join(', ') : message;
      setError(display);
      toast.error(display);
    } finally {
      setUploading(false);
      setProgressLabel(null);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-theme-secondary">{label}</label>
      {currentFilename ? (
        <p className="text-sm text-theme-muted truncate">Archivo: {currentFilename}</p>
      ) : (
        disabled ? <p className="text-sm text-theme-muted">Sin archivo</p> : null
      )}
      {!disabled ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading
              ? progressLabel ?? 'Subiendo...'
              : currentFilename
                ? 'Reemplazar archivo'
                : 'Subir archivo'}
          </Button>
          <p className="text-xs text-theme-muted">
            Hasta {formatBytes(INLINE_MEDIA_MAX_BYTES)} se guarda en la base de datos. De ahí hasta{' '}
            {formatBytes(MAX_MEDIA_UPLOAD_BYTES)} se sube a Cloud Storage. También puedes usar
            YouTube o una URL MP4 externa.
          </p>
        </>
      ) : null}
      {error ? <p className="text-sm text-ember">{error}</p> : null}
    </div>
  );
}
