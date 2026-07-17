/** Límite de almacenamiento inline en la API (Postgres). */
export const INLINE_MEDIA_MAX_BYTES = 5 * 1024 * 1024;

/** Límite de subida vía GCS (signed URL). */
export const MAX_MEDIA_UPLOAD_BYTES = 100 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function pickMimeType(withAudio: boolean): string {
  const candidates = withAudio
    ? [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ]
    : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];

  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'video/webm';
}

type LoadedVideo = {
  video: HTMLVideoElement;
  objectUrl: string;
};

function loadVideo(file: File): Promise<LoadedVideo> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    // muted permite autoplay para capturar frames; el audio sí se puede capturar del stream.
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    const objectUrl = URL.createObjectURL(file);
    video.onloadedmetadata = () => resolve({ video, objectUrl });
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo leer el video'));
    };
    video.src = objectUrl;
  });
}

function captureSourceAudioTracks(source: HTMLVideoElement): MediaStreamTrack[] {
  const mediaEl = source as HTMLVideoElement & {
    captureStream?: () => MediaStream;
    mozCaptureStream?: () => MediaStream;
  };
  try {
    const stream =
      typeof mediaEl.captureStream === 'function'
        ? mediaEl.captureStream()
        : typeof mediaEl.mozCaptureStream === 'function'
          ? mediaEl.mozCaptureStream()
          : null;
    return stream?.getAudioTracks() ?? [];
  } catch {
    return [];
  }
}

/**
 * Re-codifica el video a menor resolución/bitrate para acercarlo al límite inline.
 * Incluye pista de audio cuando el navegador lo permite.
 */
export async function compressVideoFile(
  file: File,
  options?: {
    maxBytes?: number;
    maxWidth?: number;
    onProgress?: (ratio: number) => void;
  },
): Promise<File> {
  const maxBytes = options?.maxBytes ?? INLINE_MEDIA_MAX_BYTES;
  const maxWidth = options?.maxWidth ?? 1280;

  if (file.size <= maxBytes) return file;
  if (typeof MediaRecorder === 'undefined') {
    throw new Error(
      'Este navegador no puede comprimir video. Usa una URL externa (YouTube o enlace MP4) o un archivo ≤ 5 MB.',
    );
  }

  const { video: source, objectUrl } = await loadVideo(file);
  const audioTracks: MediaStreamTrack[] = [];
  const videoTracks: MediaStreamTrack[] = [];

  try {
    const duration = Number.isFinite(source.duration) && source.duration > 0 ? source.duration : 30;
    const scale = Math.min(1, maxWidth / (source.videoWidth || maxWidth));
    const width = Math.max(2, Math.round(((source.videoWidth || 1280) * scale) / 2) * 2);
    const height = Math.max(2, Math.round(((source.videoHeight || 720) * scale) / 2) * 2);

    const targetBits = Math.floor((maxBytes * 0.8 * 8) / duration);
    const videoBitsPerSecond = Math.max(250_000, Math.min(2_500_000, targetBits));
    const audioBitsPerSecond = 128_000;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo preparar el compresor de video');

    source.currentTime = 0;
    await source.play().catch(() => undefined);

    // Audio del original + video del canvas (para bajar resolución).
    audioTracks.push(...captureSourceAudioTracks(source));
    const canvasStream = canvas.captureStream(24);
    videoTracks.push(...canvasStream.getVideoTracks());

    const combined = new MediaStream([...videoTracks, ...audioTracks]);
    const hasAudio = audioTracks.length > 0;
    const mimeType = pickMimeType(hasAudio);

    const recorder = new MediaRecorder(combined, {
      mimeType,
      videoBitsPerSecond,
      ...(hasAudio ? { audioBitsPerSecond } : {}),
    });

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    const recorded = new Promise<Blob>((resolve, reject) => {
      recorder.onerror = () => reject(new Error('Falló la compresión del video'));
      recorder.onstop = () => {
        const type = mimeType.split(';')[0] || 'video/webm';
        resolve(new Blob(chunks, { type }));
      };
    });

    // Un solo blob al final mejora el seek frente a timeslices muy cortos.
    recorder.start();

    await new Promise<void>((resolve, reject) => {
      let frameId = 0;
      const draw = () => {
        if (source.ended) {
          resolve();
          return;
        }
        ctx.drawImage(source, 0, 0, width, height);
        options?.onProgress?.(Math.min(0.95, source.currentTime / duration));
        frameId = requestAnimationFrame(draw);
      };
      source.onended = () => {
        cancelAnimationFrame(frameId);
        resolve();
      };
      source.onerror = () => {
        cancelAnimationFrame(frameId);
        reject(new Error('Error al reproducir el video para comprimir'));
      };
      draw();
    });

    source.pause();
    if (recorder.state !== 'inactive') recorder.stop();
    options?.onProgress?.(1);

    const blob = await recorded;
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'video';
    const compressed = new File([blob], `${baseName}-comprimido.${ext}`, {
      type: blob.type || (ext === 'mp4' ? 'video/mp4' : 'video/webm'),
      lastModified: Date.now(),
    });

    if (compressed.size > maxBytes) {
      throw new Error(
        `Tras comprimir sigue pesando ${formatBytes(compressed.size)} (límite ${formatBytes(maxBytes)}). Usa YouTube o una URL MP4 externa.`,
      );
    }

    return compressed;
  } finally {
    for (const track of [...audioTracks, ...videoTracks]) {
      try {
        track.stop();
      } catch {
        /* ignore */
      }
    }
    URL.revokeObjectURL(objectUrl);
  }
}

export async function prepareMediaFile(
  file: File,
  options?: {
    mediaType?: string;
    maxBytes?: number;
    onProgress?: (ratio: number) => void;
  },
): Promise<{ file: File; compressed: boolean }> {
  const maxBytes = options?.maxBytes ?? INLINE_MEDIA_MAX_BYTES;
  const isVideo = options?.mediaType === 'VIDEO' || file.type.startsWith('video/');

  if (file.size <= maxBytes) {
    return { file, compressed: false };
  }

  if (!isVideo) {
    throw new Error(
      `El archivo pesa ${formatBytes(file.size)}. El máximo inline es ${formatBytes(maxBytes)}. Usa una URL externa.`,
    );
  }

  const compressed = await compressVideoFile(file, {
    maxBytes,
    onProgress: options?.onProgress,
  });
  return { file: compressed, compressed: true };
}
