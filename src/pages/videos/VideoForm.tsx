import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { useToast } from '../../providers/ToastProvider';
import { useLoading } from '../../providers/LoadingProvider';

function parseYouTubeVideoId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id && id.length === 11 ? id : null;
    }
    if (url.hostname.includes('youtube.com')) {
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v');
        return id && id.length === 11 ? id : null;
      }
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'embed' || parts[0] === 'shorts') {
        return parts[1] && parts[1].length === 11 ? parts[1] : null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

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
      const legacyUrl = String(v.videoUrl ?? '');
      const url =
        v.sourceType === 'YOUTUBE' && youtubeId
          ? `https://www.youtube.com/watch?v=${youtubeId}`
          : legacyUrl;
      setForm({
        title: String(v.title ?? ''),
        description: String(v.description ?? ''),
        categoryId: (v.category as { id?: string } | null)?.id ?? String(v.categoryId ?? ''),
        isPublished: Boolean(v.isPublished),
        videoUrl: url,
      });
      const media = v.media as { id?: string; filename?: string } | null;
      if (media?.id) {
        setLocalMediaId(media.id);
        setLocalMediaName(media.filename ?? 'video');
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

    if (!form.title.trim()) {
      toast.warning('Indica un título para el video.');
      return;
    }

    if (!youtube && !url && !localMediaId) {
      toast.warning('Añade una URL (YouTube/MP4) o sube un archivo de video.');
      return;
    }

    try {
      await withLoading(
        (async () => {
          let mediaId: string | undefined = localMediaId ?? undefined;
          if (url && !youtube) {
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
        <PageHeader title={videoTitle} subtitle="Vista de detalle" action={headerActions} />

        <DetailSection>
          <div className="flex flex-col gap-6 sm:flex-row">
            {preview?.thumbnailUrl ? (
              <img
                src={preview.thumbnailUrl}
                alt=""
                className="aspect-video w-full max-w-sm shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-[var(--color-border)] sm:w-72"
              />
            ) : null}
            <div className="min-w-0 flex-1 space-y-5">
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
                <DetailField label="Descripción" span={2}>
                  {form.description ? (
                    <p className="whitespace-pre-wrap text-theme-secondary">{form.description}</p>
                  ) : null}
                </DetailField>
                <DetailField label="URL del video" span={2}>
                  {form.videoUrl ? (
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
            </div>
          </div>
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
          {youtubeMode && preview ? (
            <div className="space-y-2 rounded-xl border border-ink/10 bg-parchment/40 p-4 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">
                Vista previa YouTube
              </p>
              <img
                src={preview.thumbnailUrl}
                alt="Miniatura del video"
                className="aspect-video w-full rounded-lg object-cover"
              />
              <p className="text-sm text-theme-secondary">
                {previewLoading
                  ? 'Obteniendo duración…'
                  : preview.durationSec
                    ? `Duración: ${formatDuration(preview.durationSec)}`
                    : 'Duración: se detectará al guardar'}
              </p>
            </div>
          ) : null}
        </div>

        {!youtubeMode ? (
          <div className="space-y-3 rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-sm font-medium text-theme">Opción B — Subir archivo</p>
            <p className="text-xs text-theme-muted">
              Hasta 5 MB se suben directo. Si el video pesa más, el panel lo comprime automáticamente
              antes de enviarlo. Si tras comprimir sigue siendo muy grande, usa la opción A.
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
                setForm((f) => ({ ...f, videoUrl: '' }));
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
