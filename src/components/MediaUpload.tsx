import { useRef, useState } from 'react';
import { mediaApi } from '../api/media';
import { Button } from './ui/Button';
import { toast } from '../lib/toast';
import {
  formatBytes,
  INLINE_MEDIA_MAX_BYTES,
  prepareMediaFile,
} from '../utils/compressVideo';

interface MediaUploadProps {
  label: string;
  accept?: string;
  mediaType?: string;
  currentFilename?: string | null;
  disabled?: boolean;
  /** Si true (default en VIDEO), comprime archivos > 5 MB antes de subir. */
  compressLargeVideo?: boolean;
  onUploaded: (asset: { id: string; url: string; filename: string; mimeType: string }) => void;
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
      let toUpload = file;
      if (file.size > INLINE_MEDIA_MAX_BYTES) {
        if (!shouldCompress) {
          const msg = `El archivo pesa ${formatBytes(file.size)}. Máximo inline: ${formatBytes(INLINE_MEDIA_MAX_BYTES)}. Usa una URL externa.`;
          setError(msg);
          toast.warning(msg);
          return;
        }
        toast.info(
          `El video pesa ${formatBytes(file.size)}. Comprimiendo para poder subirlo…`,
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
        toUpload = prepared.file;
        if (prepared.compressed) {
          toast.success(
            `Comprimido a ${formatBytes(toUpload.size)}. Subiendo…`,
            'Video listo',
          );
        }
      }

      setProgressLabel('Subiendo…');
      const res = await mediaApi.upload(toUpload, mediaType);
      onUploaded(res.data.data);
      toast.success('Archivo subido correctamente.');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudo subir el archivo. Máximo 5 MB para inline (o usa URL externa).';
      setError(message);
      toast.error(message);
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
          {shouldCompress ? (
            <p className="text-xs text-theme-muted">
              Archivos de video mayores a 5 MB se comprimen automáticamente. Si aún superan el
              límite, usa YouTube o una URL MP4 externa.
            </p>
          ) : null}
        </>
      ) : null}
      {error ? <p className="text-sm text-ember">{error}</p> : null}
    </div>
  );
}
