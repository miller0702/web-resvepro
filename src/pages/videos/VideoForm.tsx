import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { mediaApi } from '../../api/media';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MediaUpload } from '../../components/MediaUpload';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { formatDuration } from '../../utils/format';

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
  const isNew = id === 'new';

  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    isPublished: false,
    videoUrl: '',
  });
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
    const url = form.videoUrl.trim();
    if (!isYouTubeUrl(url)) {
      setPreview(null);
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
  }, [form.videoUrl, form.title]);

  const save = async () => {
    const url = form.videoUrl.trim();
    const youtube = isYouTubeUrl(url);

    let mediaId: string | undefined;
    if (url && !youtube) {
      const ext = await mediaApi.registerExternal({
        url,
        filename: `${form.title || 'video'}.mp4`,
        mimeType: 'video/mp4',
        type: 'VIDEO',
      });
      mediaId = ext.data.data.id;
    }

    const payload = {
      title: form.title,
      description: form.description,
      categoryId: form.categoryId || undefined,
      isPublished: form.isPublished,
      ...(youtube ? { youtubeUrl: url } : {}),
      ...(mediaId ? { mediaId } : {}),
    };

    if (isNew) {
      const res = await adminApi.createVideo(payload);
      navigate(`/videos/${(res.data.data as { id: string }).id}`);
    } else {
      await adminApi.updateVideo(id!, payload);
      queryClient.invalidateQueries({ queryKey: ['video', id] });
    }
  };

  if (!isNew && videoQuery.isLoading) return <Loading />;

  const youtubeMode = isYouTubeUrl(form.videoUrl);

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title={isNew ? 'Nuevo video' : 'Editar video'}
        action={!isNew ? (
          <Badge variant={form.isPublished ? 'success' : 'muted'}>
            {form.isPublished ? 'Publicado' : 'Borrador'}
          </Badge>
        ) : undefined}
      />
      <div className="glass-card w-full space-y-4 p-8">
        <Input label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <select className="input-field" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
          <option value="">Categoría</option>
          {(categoriesQuery.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Input
          label="URL del video (YouTube o MP4 directo)"
          value={form.videoUrl}
          onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
          placeholder="https://www.youtube.com/watch?v=..."
        />
        {youtubeMode && preview ? (
          <div className="space-y-2 rounded-xl border border-ink/10 bg-parchment/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Vista previa YouTube</p>
            <img
              src={preview.thumbnailUrl}
              alt="Miniatura del video"
              className="aspect-video w-full rounded-lg object-cover"
            />
            <p className="text-sm text-ink/70">
              {previewLoading ? 'Obteniendo duración…' : preview.durationSec ? `Duración: ${formatDuration(preview.durationSec)}` : 'Duración: se detectará al guardar'}
            </p>
          </div>
        ) : null}
        {!isNew ? (
          <>
            <MediaUpload
              label="Miniatura personalizada (opcional)"
              accept="image/*"
              mediaType="IMAGE"
              onUploaded={async (asset) => {
                await adminApi.updateVideo(id!, { thumbnailId: asset.id });
                queryClient.invalidateQueries({ queryKey: ['video', id] });
              }}
            />
            {!youtubeMode ? (
              <MediaUpload
                label="Video inline (≤ 5 MB)"
                accept="video/*"
                mediaType="VIDEO"
                onUploaded={async (asset) => {
                  await adminApi.updateVideo(id!, { mediaId: asset.id });
                  queryClient.invalidateQueries({ queryKey: ['video', id] });
                }}
              />
            ) : null}
          </>
        ) : null}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
          Publicado
        </label>
        <div className="flex gap-2">
          <Button type="button" onClick={save}>Guardar</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/videos')}>Volver</Button>
          {!isNew ? (
            <Button type="button" variant="danger" onClick={async () => {
              if (confirm('¿Eliminar video?')) {
                await adminApi.deleteVideo(id!);
                navigate('/videos');
              }
            }}>Eliminar</Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
