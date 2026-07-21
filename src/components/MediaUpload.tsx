import { useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { mediaApi } from '../api/media';
import { Button } from './ui/Button';
import { toast } from '../lib/toast';
import {
  formatBytes,
  prepareMediaFile,
  VIDEO_LARGE_WARNING_BYTES,
  VIDEO_SOFT_COMPRESS_BYTES,
} from '../utils/compressVideo';

interface MediaUploadProps {
  label: string;
  accept?: string;
  mediaType?: string;
  currentFilename?: string | null;
  disabled?: boolean;
  /** Si false, no comprime videos (default: comprime si > 15 MB). */
  compressLargeVideo?: boolean;
  onUploaded: (asset: { id: string; url: string; filename: string; mimeType: string }) => void;
}

export function MediaUpload({
  label,
  accept,
  mediaType,
  currentFilename,
  disabled = false,
  compressLargeVideo = true,
  onUploaded,
}: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setProgressLabel(null);
    try {
      if (file.size > VIDEO_LARGE_WARNING_BYTES) {
        toast.info(
          `El archivo pesa ${formatBytes(file.size)}. Se comprimirá si es video y la subida puede tardar varios minutos.`,
          'Archivo grande',
        );
      }

      setProgressLabel('Optimizando…');
      const prepared = await prepareMediaFile(file, {
        mediaType,
        softCompressVideo: compressLargeVideo,
        onProgress: (ratio) => {
          setProgressLabel(`Optimizando… ${Math.round(ratio * 100)}%`);
        },
      });

      if (prepared.compressed) {
        toast.info(
          `Optimizado: ${formatBytes(file.size)} → ${formatBytes(prepared.file.size)}`,
          'Compresión',
        );
      }

      setProgressLabel('Subiendo a la nube…');
      const asset = await mediaApi.uploadViaGcs(prepared.file, mediaType, (ratio) => {
        setProgressLabel(`Subiendo… ${Math.round(ratio * 100)}%`);
      });
      onUploaded(asset);
      toast.success(
        prepared.compressed
          ? `Subido a Cloud Storage (${formatBytes(prepared.file.size)}).`
          : 'Archivo subido a Cloud Storage.',
      );
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
      ) : disabled ? (
        <p className="text-sm text-theme-muted">Sin archivo</p>
      ) : null}
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
              ? (progressLabel ?? 'Subiendo...')
              : currentFilename
                ? 'Reemplazar archivo'
                : 'Subir archivo'}
          </Button>
          <p className="text-xs text-theme-muted">
            Sin límite de tamaño. Se guarda en Cloud Storage. Imágenes y videos (&gt;{' '}
            {formatBytes(VIDEO_SOFT_COMPRESS_BYTES)}) se optimizan para bajar costes.{' '}
            <Link to="/storage" className="text-gold-dim underline-offset-2 hover:underline dark:text-gold-light">
              Ver guía de facturación
            </Link>
            .
          </p>
        </>
      ) : null}
      {error ? <p className="text-sm text-ember">{error}</p> : null}
    </div>
  );
}
