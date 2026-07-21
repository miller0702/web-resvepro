import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { mediaApi } from '../../api/media';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MediaUpload } from '../../components/MediaUpload';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { formatDuration } from '../../utils/format';
import { ResourceModeHeaderAction, useResourceMode } from '../../hooks/useResourceMode';
import { DetailField, DetailFlags, DetailGrid, DetailSection } from '../../components/ui/DetailView';
import { VideoPreviewPlayer } from '../../components/videos/VideoPreviewPlayer';
import { useToast } from '../../providers/ToastProvider';
import { useLoading } from '../../providers/LoadingProvider';
import {
  extractMediaIdFromContentPath,
  isAbsoluteHttpUrl,
  parseYouTubeVideoId,
} from '../../utils/mediaUrl';

function isYouTubeUrl(input: string) {
  return parseYouTubeVideoId(input) !== null;
}

export function VideoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { withLoading } = useLoading();
  const isNew = id === 'new';
  const { isView, editHref } = useResourceMode();

  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    isPublished: false,
    videoUrl: '',
  });
  const [localMediaId, setLocalMediaId] = useState<string | null>(null);
  const [localMediaName, setLocalMediaName] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    thumbnailUrl: string;
    durationSec?: number | null;
    title?: string | null;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const videoQuery = useQuery({
    queryKey: ['video', id],
    queryFn: async () => (await adminApi.getVideo(id!)).data.data as Record<string, unknown>,
    enabled: !isNew && Boolean(id),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'VIDEO'],
    queryFn: async () =>
      (await adminApi.getCategories('VIDEO')).data.data as Array<{ id: string; name: string }>,
  });

  useEffect(() => {
    if (videoQuery.data) {
      const v = videoQuery.data;
      const youtubeId = String(v.youtubeVideoId ?? '');
      const resolvedUrl = String(v.videoUrl ?? '');
      const mediaIdFromApi = String(v.mediaId ?? '') || null;
      const mediaFromPath = extractMediaIdFromContentPath(resolvedUrl);
      const linkedMediaId = mediaIdFromApi || mediaFromPath;

      let videoUrl = '';
      if (v.sourceType === 'YOUTUBE' && youtubeId) {
        videoUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
      } else if (isAbsoluteHttpUrl(resolvedUrl) && !extractMediaIdFromContentPath(resolvedUrl)) {
        // Solo URLs externas reales (CDN / MP4 directo), no rutas /media/.../content
        videoUrl = resolvedUrl;
      }

      setForm({
        title: String(v.title ?? ''),
        description: String(v.description ?? ''),
        categoryId: (v.category as { id?: string } | null)?.id ?? String(v.categoryId ?? ''),
        isPublished: Boolean(v.isPublished),
        videoUrl,
      });

      if (linkedMediaId) {
        setLocalMediaId(linkedMediaId);
        const media = v.media as { id?: string; filename?: string } | null;
        setLocalMediaName(media?.filename ?? 'video subido');
      } else {
        setLocalMediaId(null);
        setLocalMediaName(null);
      }

      const thumb = String(v.thumbnailUrl ?? '');
      if (thumb) {
        setPreview({
          thumbnailUrl: thumb,
          durationSec: Number(v.durationSec ?? 0) || null,
        });
      }
    }
  }, [videoQuery.data]);

  useEffect(() => {
    if (isView) return;
    const url = form.videoUrl.trim();
    if (!isYouTubeUrl(url)) {
      if (!localMediaId) setPreview(null);
      return;
    }

    const videoId = parseYouTubeVideoId(url)!;
    setPreview((prev) => ({
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      durationSec: prev?.durationSec,
      title: prev?.title,
    }));

    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await adminApi.previewYouTube(url);
        const data = res.data.data as {
          thumbnailUrl: string;
          durationSec?: number | null;
          title?: string | null;
        };
        setPreview({
          thumbnailUrl: data.thumbnailUrl,
          durationSec: data.durationSec,
          title: data.title,
        });
        if (data.title && !form.title.trim()) {
          setForm((f) => ({ ...f, title: data.title! }));
        }
      } catch {
        /* preview opcional */
      } finally {
        setPreviewLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.videoUrl, form.title, isView, localMediaId]);

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteVideo(id!),
    onSuccess: () => {
      toast.success('Video eliminado.');
      navigate('/videos');
    },
    onError: () => toast.error('No se pudo eliminar el video.'),
  });

  const save = async () => {
    const url = form.videoUrl.trim();
    const youtube = isYouTubeUrl(url);
    const mediaIdFromPath = extractMediaIdFromContentPath(url);
    const externalUrl = Boolean(url && !youtube && isAbsoluteHttpUrl(url) && !mediaIdFromPath);

    if (!form.title.trim()) {
      toast.warning('Indica un título para el video.');
      return;
    }

    if (!youtube && !externalUrl && !localMediaId && !mediaIdFromPath) {
      if (url && !isAbsoluteHttpUrl(url)) {
        toast.warning('La URL debe empezar por https:// (YouTube o MP4 externo), o sube un archivo.');
        return;
      }
      toast.warning('Añade una URL (YouTube/MP4) o sube un archivo de video.');
      return;
    }

    try {
      await withLoading(
        (async () => {
          // Preferir media ya subido; no re-registrar GCS/CDN si ya hay mediaId.
          let mediaId: string | undefined =
            localMediaId ?? mediaIdFromPath ?? undefined;

          if (externalUrl && !mediaId) {
            const ext = await mediaApi.registerExternal({
              url,
              filename: `${form.title || 'video'}.mp4`,
              mimeType: 'video/mp4',
              type: 'VIDEO',
            });
            mediaId = ext.data.data.id as string;
          }

          const payload = {
            title: form.title,
            description: form.description,
            categoryId: form.categoryId || undefined,
            isPublished: form.isPublished,
            ...(youtube ? { youtubeUrl: url } : {}),
            ...(mediaId && !youtube ? { mediaId } : {}),
          };

          if (isNew) {
            const res = await adminApi.createVideo(payload);
            toast.success('Video creado correctamente.');
            navigate(`/videos/${(res.data.data as { id: string }).id}`);
          } else {
            await adminApi.updateVideo(id!, payload);
            toast.success('Video guardado.');
            queryClient.invalidateQueries({ queryKey: ['video', id] });
          }
        })(),
        'Guardando video…',
      );
    } catch {
      toast.error('No se pudo guardar el video. Revisa los datos e intenta de nuevo.');
    }
  };

  if (!isNew && videoQuery.isLoading) return <Loading />;

  const youtubeMode = isYouTubeUrl(form.videoUrl);
  const isPublished = form.isPublished;
  const videoTitle = form.title || 'Video';
  const categoryName =
    (categoriesQuery.data ?? []).find((c) => c.id === form.categoryId)?.name ??
    (videoQuery.data?.category as { name?: string } | null)?.name;

  const headerActions = !isNew ? (
    <ResourceModeHeaderAction
      isView={isView}
      editHref={editHref}
      extra={
        <Badge variant={isPublished ? 'success' : 'muted'}>
          {isPublished ? 'Publicado' : 'Borrador'}
        </Badge>
      }
      isPublished={isPublished}
      entityLabel="video"
      busy={deleteMutation.isPending}
      onTogglePublish={() => {
        void adminApi
          .updateVideo(id!, { isPublished: !isPublished })
          .then(() => {
            setForm((f) => ({ ...f, isPublished: !isPublished }));
            queryClient.invalidateQueries({ queryKey: ['video', id] });
            toast.success(isPublished ? 'Video quitado de la app.' : 'Video publicado.');
          })
          .catch(() => toast.error('No se pudo cambiar el estado de publicación.'));
      }}
      onDelete={() => deleteMutation.mutate()}
    />
  ) : undefined;

  if (!isNew && isView) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title={videoTitle} subtitle="Vista de detalle" action={headerActions} backTo="/videos" />

        <VideoPreviewPlayer
          source={{
            videoUrl: form.videoUrl || String(videoQuery.data?.videoUrl ?? ''),
            youtubeVideoId: String(videoQuery.data?.youtubeVideoId ?? '') || null,
            mediaId: localMediaId,
          }}
          title={videoTitle}
          description={form.description}
          categoryName={categoryName}
          durationSec={preview?.durationSec ?? (Number(videoQuery.data?.durationSec ?? 0) || null)}
          viewCount={Number(videoQuery.data?.viewCount ?? 0) || null}
        />

        <DetailSection>
          <DetailFlags>
            <Badge variant={isPublished ? 'success' : 'muted'}>
              {isPublished ? 'En la app' : 'Borrador'}
            </Badge>
          </DetailFlags>
          <DetailGrid>
            <DetailField label="Categoría">{categoryName}</DetailField>
            <DetailField label="Duración">
              {preview?.durationSec ? formatDuration(preview.durationSec) : null}
            </DetailField>
            <DetailField label="Archivo / URL" span={2}>
              {localMediaName ? (
                <span>Archivo subido: {localMediaName}</span>
              ) : form.videoUrl ? (
                <a
                  href={form.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-gold-dim underline-offset-2 hover:underline dark:text-gold-light"
                >
                  {form.videoUrl}
                </a>
              ) : null}
            </DetailField>
          </DetailGrid>
        </DetailSection>

        <Button type="button" variant="ghost" onClick={() => navigate('/videos')}>
          Volver al listado
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title={isNew ? 'Nuevo video' : 'Editar video'}
        subtitle={!isNew ? videoTitle : undefined}
        action={headerActions}
        backTo="/videos"
      />

      <VideoPreviewPlayer
        source={{
          videoUrl: form.videoUrl,
          mediaId: localMediaId,
        }}
        title={form.title}
        description={form.description}
        categoryName={categoryName}
        durationSec={preview?.durationSec ?? null}
      />

      <div className="glass-card w-full space-y-4 p-8">
        <Input
          label="Título"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className="input-field"
          rows={3}
          placeholder="Descripción"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <select
          className="input-field"
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
        >
          <option value="">Categoría</option>
          {(categoriesQuery.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="space-y-3 rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-sm font-medium text-theme">Opción A — URL (recomendado para videos largos)</p>
          <p className="text-xs text-theme-muted">
            YouTube o un enlace MP4 directo (CDN, almacenamiento externo). Ideal para archivos grandes.
          </p>
          <Input
            label="URL del video"
            value={form.videoUrl}
            onChange={(e) => {
              setForm({ ...form, videoUrl: e.target.value });
              if (e.target.value.trim()) {
                setLocalMediaId(null);
                setLocalMediaName(null);
              }
            }}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          {youtubeMode && previewLoading ? (
            <p className="text-sm text-theme-secondary">Obteniendo datos de YouTube…</p>
          ) : null}
          {youtubeMode && preview?.durationSec ? (
            <p className="text-sm text-theme-secondary">
              Duración detectada: {formatDuration(preview.durationSec)}
            </p>
          ) : null}
        </div>

        {!youtubeMode ? (
          <div className="space-y-3 rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-sm font-medium text-theme">Opción B — Subir archivo</p>
            <p className="text-xs text-theme-muted">
              Sin límite de tamaño: el archivo va a Cloud Storage. Se optimiza automáticamente para
              bajar costes. También puedes usar YouTube o una URL MP4 (opción A).{' '}
              <Link
                to="/storage"
                className="text-gold-dim underline-offset-2 hover:underline dark:text-gold-light"
              >
                Guía de facturación
              </Link>
              .
            </p>
            <MediaUpload
              label="Archivo de video"
              accept="video/*"
              mediaType="VIDEO"
              compressLargeVideo
              currentFilename={localMediaName}
              onUploaded={(asset) => {
                setLocalMediaId(asset.id);
                setLocalMediaName(asset.filename);
                // Si es GCS/EXTERNAL, conservar la URL pública para la vista previa.
                setForm((f) => ({
                  ...f,
                  videoUrl: isAbsoluteHttpUrl(asset.url) ? asset.url : '',
                }));
                if (!isNew) {
                  void adminApi.updateVideo(id!, { mediaId: asset.id }).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['video', id] });
                  });
                }
              }}
            />
          </div>
        ) : null}

        {!isNew ? (
          <MediaUpload
            label="Miniatura personalizada (opcional)"
            accept="image/*"
            mediaType="IMAGE"
            compressLargeVideo={false}
            onUploaded={async (asset) => {
              try {
                await adminApi.updateVideo(id!, { thumbnailId: asset.id });
                queryClient.invalidateQueries({ queryKey: ['video', id] });
                toast.success('Miniatura actualizada.');
              } catch {
                toast.error('No se pudo actualizar la miniatura.');
              }
            }}
          />
        ) : null}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
          />
          Publicado
        </label>
        <div className="flex gap-2">
          <Button type="button" onClick={() => void save()}>
            Guardar
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/videos')}>
            Volver
          </Button>
        </div>
      </div>
    </div>
  );
}
