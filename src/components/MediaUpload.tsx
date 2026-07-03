import { useRef, useState } from 'react';
import { mediaApi } from '../api/media';
import { Button } from './ui/Button';

interface MediaUploadProps {
  label: string;
  accept?: string;
  mediaType?: string;
  currentFilename?: string | null;
  onUploaded: (asset: { id: string; url: string; filename: string; mimeType: string }) => void;
}

export function MediaUpload({
  label,
  accept,
  mediaType,
  currentFilename,
  onUploaded,
}: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const res = await mediaApi.upload(file, mediaType);
      onUploaded(res.data.data);
    } catch {
      setError('No se pudo subir el archivo. Máximo 5 MB para inline.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-theme-secondary">{label}</label>
      {currentFilename ? (
        <p className="text-sm text-theme-muted truncate">Archivo: {currentFilename}</p>
      ) : null}
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
        {uploading ? 'Subiendo...' : currentFilename ? 'Reemplazar archivo' : 'Subir archivo'}
      </Button>
      {error ? <p className="text-sm text-ember">{error}</p> : null}
    </div>
  );
}
