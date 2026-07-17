import { useEffect, useRef, type ReactNode } from 'react';
import { Play } from 'lucide-react';
import { useAuthenticatedMediaBlobUrl } from '../../hooks/useAuthenticatedMediaBlobUrl';
import { formatDuration } from '../../utils/format';
import {
  extractMediaIdFromContentPath,
  isAbsoluteHttpUrl,
  parseYouTubeVideoId,
  resolveApiMediaUrl,
} from '../../utils/mediaUrl';

export type VideoPreviewSource = {
  /** URL de YouTube o MP4 externo, o ruta relativa /api/v1/media/.../content */
  videoUrl?: string | null;
  youtubeVideoId?: string | null;
  mediaId?: string | null;
};

type VideoPreviewPlayerProps = {
  source: VideoPreviewSource;
  title?: string;
  description?: string | null;
  categoryName?: string | null;
  durationSec?: number | null;
  viewCount?: number | null;
  /** Muestra título/descripción debajo, similar a la pantalla de detalle de la app. */
  showAppLayout?: boolean;
  className?: string;
};

function resolveDirectPlayUrl(source: VideoPreviewSource): {
  youtubeId: string | null;
  externalUrl: string | null;
  mediaId: string | null;
} {
  const fromField = source.youtubeVideoId?.trim() || null;
  const fromUrl = source.videoUrl ? parseYouTubeVideoId(source.videoUrl) : null;
  const youtubeId = fromField || fromUrl;

  if (youtubeId) {
    return { youtubeId, externalUrl: null, mediaId: null };
  }

  // Preferir URL absoluta (GCS/CDN/MP4) antes que mediaId → /content (solo INLINE).
  if (source.videoUrl && isAbsoluteHttpUrl(source.videoUrl)) {
    return { youtubeId: null, externalUrl: source.videoUrl.trim(), mediaId: null };
  }

  const resolved = resolveApiMediaUrl(source.videoUrl);
  if (resolved && isAbsoluteHttpUrl(resolved) && !extractMediaIdFromContentPath(resolved)) {
    return { youtubeId: null, externalUrl: resolved, mediaId: null };
  }

  const mediaId =
    source.mediaId ||
    (source.videoUrl ? extractMediaIdFromContentPath(source.videoUrl) : null);

  if (mediaId) {
    return { youtubeId: null, externalUrl: null, mediaId };
  }

  return { youtubeId: null, externalUrl: null, mediaId: null };
}

function YouTubeEmbed({ videoId }: { videoId: string }) {
  // Sin autoplay: el usuario inicia con sonido y controles nativos (seek incluidos).
  const src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?playsinline=1&rel=0&modestbranding=1&controls=1&fs=1`;
  return (
    <iframe
      title="Vista previa YouTube"
      src={src}
      className="absolute inset-0 h-full w-full border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}

/**
 * Fuerza duración real en blobs de MediaRecorder (WebM con duration Infinity),
 * lo que habilita el seek en la barra de progreso.
 */
function fixMediaRecorderDuration(video: HTMLVideoElement) {
  if (!Number.isFinite(video.duration) || video.duration === Infinity) {
    const onTimeUpdate = () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.currentTime = 0;
    };
    video.addEventListener('timeupdate', onTimeUpdate);
    // Salta lejos para que el navegador calcule la duración real del blob.
    video.currentTime = 1e101;
  }
}

function DirectVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const onLoaded = () => {
      video.muted = false;
      video.volume = 1;
      fixMediaRecorderDuration(video);
    };

    video.addEventListener('loadedmetadata', onLoaded);
    // Por si metadata ya estaba lista.
    if (video.readyState >= 1) onLoaded();

    return () => video.removeEventListener('loadedmetadata', onLoaded);
  }, [src]);

  return (
    <video
      ref={ref}
      key={src}
      src={src}
      controls
      playsInline
      preload="auto"
      controlsList="nodownload"
      className="absolute inset-0 h-full w-full bg-black object-contain"
    >
      Tu navegador no puede reproducir este video.
    </video>
  );
}

function PlayerShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-sm ring-1 ring-[var(--color-border)]">
      {children}
    </div>
  );
}

function EmptyPlayer({ message }: { message: string }) {
  return (
    <PlayerShell>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-ink/80 to-ink text-white/80">
        <Play className="h-12 w-12 opacity-80" strokeWidth={1.5} />
        <p className="max-w-xs px-4 text-center text-sm">{message}</p>
      </div>
    </PlayerShell>
  );
}

/**
 * Previsualización alineada con la app móvil: reproductor 16:9 + ficha opcional.
 */
export function VideoPreviewPlayer({
  source,
  title,
  description,
  categoryName,
  durationSec,
  viewCount,
  showAppLayout = true,
  className = '',
}: VideoPreviewPlayerProps) {
  const { youtubeId, externalUrl, mediaId } = resolveDirectPlayUrl(source);
  const auth = useAuthenticatedMediaBlobUrl(mediaId);

  const statsLine = [
    typeof viewCount === 'number' ? `${viewCount} vistas` : null,
    durationSec ? formatDuration(durationSec) : null,
    categoryName ?? null,
  ]
    .filter(Boolean)
    .join(' · ');

  let player: ReactNode;
  if (youtubeId) {
    player = (
      <PlayerShell>
        <YouTubeEmbed videoId={youtubeId} />
      </PlayerShell>
    );
  } else if (externalUrl) {
    player = (
      <PlayerShell>
        <DirectVideo src={externalUrl} />
      </PlayerShell>
    );
  } else if (mediaId) {
    if (auth.loading) {
      player = <EmptyPlayer message="Cargando video…" />;
    } else if (auth.error || !auth.playUrl) {
      player = <EmptyPlayer message={auth.error ?? 'Video no disponible'} />;
    } else {
      player = (
        <PlayerShell>
          <DirectVideo src={auth.playUrl} />
        </PlayerShell>
      );
    }
  } else {
    player = (
      <EmptyPlayer message="Añade una URL de YouTube/MP4 o sube un archivo para previsualizar." />
    );
  }

  if (!showAppLayout) {
    return <div className={className}>{player}</div>;
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] ${className}`}
    >
      <div className="border-b border-[var(--color-border)] bg-sage/10 px-4 py-2.5 dark:bg-sage/15">
        <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">
          Vista previa como en la app
        </p>
        <p className="mt-0.5 text-xs text-theme-secondary">
          Reproduce con sonido y usa la barra para adelantar o atrasar. Formato 16:9 como en el móvil.
        </p>
      </div>
      <div className="bg-black">{player}</div>
      <div className="space-y-2 p-5">
        <h3 className="font-display text-xl text-theme">{title?.trim() || 'Sin título'}</h3>
        {statsLine ? <p className="text-sm text-theme-secondary">{statsLine}</p> : null}
        {description?.trim() ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-theme-secondary">
            {description}
          </p>
        ) : (
          <p className="text-sm italic text-theme-muted">Sin descripción</p>
        )}
      </div>
    </div>
  );
}
