/** Límites de referencia (GCS es el almacén canónico; sin tope duro de tamaño). */
export const INLINE_MEDIA_MAX_BYTES = 5 * 1024 * 1024; // solo fallback sin GCS

/** Aviso en UI: subidas muy grandes pueden tardar. */
export const VIDEO_LARGE_WARNING_BYTES = 500 * 1024 * 1024;

/** Comprimir video si supera este tamaño. */
export const VIDEO_SOFT_COMPRESS_BYTES = 15 * 1024 * 1024;

/** Objetivo orientativo tras compresión (no es un rechazo duro). */
export const VIDEO_SOFT_TARGET_BYTES = 60 * 1024 * 1024;

/** Comprimir imágenes si superan este tamaño. */
export const IMAGE_COMPRESS_THRESHOLD_BYTES = 200 * 1024;

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Comprime una imagen con canvas (JPEG). Ideal para portadas, miniaturas y avatares.
 */
export async function compressImageFile(
  file: File,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    onProgress?: (ratio: number) => void;
  },
): Promise<File> {
  const maxWidth = options?.maxWidth ?? 1920;
  const maxHeight = options?.maxHeight ?? 1920;
  const quality = options?.quality ?? 0.82;

  options?.onProgress?.(0.1);

  const bitmap = await createImageBitmap(file);
  try {
    options?.onProgress?.(0.4);
    let { width, height } = bitmap;
    const scale = Math.min(1, maxWidth / width, maxHeight / height);
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo preparar el canvas de imagen');
    ctx.drawImage(bitmap, 0, 0, width, height);

    options?.onProgress?.(0.7);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('No se pudo comprimir la imagen'))),
        'image/jpeg',
        quality,
      );
    });

    options?.onProgress?.(1);

    // Si no mejora, devolver el original.
    if (blob.size >= file.size * 0.98) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
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

export async function compressVideoFile(
  file: File,
  options?: {
    maxBytes?: number;
    maxWidth?: number;
    videoBitsPerSecond?: number;
    audioBitsPerSecond?: number;
    onProgress?: (ratio: number) => void;
  },
): Promise<File> {
  const maxBytes = options?.maxBytes ?? VIDEO_SOFT_TARGET_BYTES;
  const maxWidth = options?.maxWidth ?? 1280;
  const { video: source, objectUrl } = await loadVideo(file);
  const audioTracks: MediaStreamTrack[] = [];
  const videoTracks: MediaStreamTrack[] = [];

  try {
    await source.play().catch(() => undefined);
    source.pause();
    source.currentTime = 0;

    const duration = Number.isFinite(source.duration) && source.duration > 0 ? source.duration : 1;
    const scale = Math.min(1, maxWidth / (source.videoWidth || maxWidth));
    const width = Math.max(2, Math.round((source.videoWidth || 640) * scale) & ~1);
    const height = Math.max(2, Math.round((source.videoHeight || 360) * scale) & ~1);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo preparar el canvas de video');

    audioTracks.push(...captureSourceAudioTracks(source));
    const canvasStream = canvas.captureStream(24);
    videoTracks.push(...canvasStream.getVideoTracks());

    const combined = new MediaStream([...videoTracks, ...audioTracks]);
    const hasAudio = audioTracks.length > 0;
    const mimeType = pickMimeType(hasAudio);

    // Bitrate suave: ~1.5 Mbps a 1280p, escala con tamaño objetivo.
    const videoBitsPerSecond =
      options?.videoBitsPerSecond ??
      Math.min(2_500_000, Math.max(800_000, Math.round((maxBytes * 8) / Math.max(duration, 1) * 0.7)));
    const audioBitsPerSecond = options?.audioBitsPerSecond ?? 128_000;

    const recorder = new MediaRecorder(combined, {
      mimeType,
      videoBitsPerSecond,
      ...(hasAudio ? { audioBitsPerSecond } : {}),
    });

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };

    const recorded = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      recorder.onerror = () => reject(new Error('Error al grabar el video comprimido'));
    });

    recorder.start(250);
    source.currentTime = 0;
    await source.play();

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

    if (compressed.size >= file.size * 0.95) {
      return file; // no mejoró
    }

    // Ya no rechazamos por tamaño: devolvemos lo mejor que logramos.
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

/**
 * Prepara el archivo antes de subir a GCS:
 * - Imágenes: redimensiona/JPEG si > umbral
 * - Videos: compresión suave/adaptativa si > 15 MB (sin tope de rechazo)
 * - Resto: sin cambios
 */
export async function prepareMediaFile(
  file: File,
  options?: {
    mediaType?: string;
    softCompressVideo?: boolean;
    onProgress?: (ratio: number) => void;
  },
): Promise<{ file: File; compressed: boolean }> {
  const mediaType = options?.mediaType ?? '';
  const isVideo = mediaType === 'VIDEO' || file.type.startsWith('video/');
  const isImage =
    mediaType === 'IMAGE' ||
    mediaType === 'COVER' ||
    file.type.startsWith('image/');

  if (isImage && file.size > IMAGE_COMPRESS_THRESHOLD_BYTES) {
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: mediaType === 'COVER' ? 1600 : 1920,
        quality: 0.82,
        onProgress: options?.onProgress,
      });
      return { file: compressed, compressed: compressed !== file && compressed.size < file.size };
    } catch {
      return { file, compressed: false };
    }
  }

  const soft = options?.softCompressVideo !== false;
  if (isVideo && soft && file.size > VIDEO_SOFT_COMPRESS_BYTES) {
    // Más agresivo en archivos enormes: 960p si > 300 MB.
    const maxWidth = file.size > 300 * 1024 * 1024 ? 960 : 1280;
    const target =
      file.size > 200 * 1024 * 1024
        ? Math.min(file.size * 0.35, 120 * 1024 * 1024)
        : Math.min(file.size * 0.55, VIDEO_SOFT_TARGET_BYTES);

    try {
      const compressed = await compressVideoFile(file, {
        maxBytes: target,
        maxWidth,
        onProgress: options?.onProgress,
      });
      return {
        file: compressed,
        compressed: compressed !== file && compressed.size < file.size,
      };
    } catch {
      // Si falla la compresión, subimos el original (sin límite de tamaño).
      return { file, compressed: false };
    }
  }

  return { file, compressed: false };
}
