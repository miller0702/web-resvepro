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

export function PodcastEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new';

  const [form, setForm] = useState({
    title: '',
    description: '',
    authorId: '',
    categoryId: '',
    isPublished: false,
  });
  const [episodeForm, setEpisodeForm] = useState({
    title: '',
    order: 1,
    description: '',
    isPublished: false,
  });
  const [audioUrl, setAudioUrl] = useState('');
  const [savingEpisode, setSavingEpisode] = useState(false);

  const podcastQuery = useQuery({
    queryKey: ['podcast', id],
    queryFn: async () => (await adminApi.getPodcast(id!)).data.data,
    enabled: !isNew && Boolean(id),
  });

  const authorsQuery = useQuery({
    queryKey: ['authors'],
    queryFn: async () => (await adminApi.getAuthors()).data.data as Array<{ id: string; name: string }>,
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'PODCAST'],
    queryFn: async () =>
      (await adminApi.getCategories('PODCAST')).data.data as Array<{ id: string; name: string }>,
  });

  useEffect(() => {
    if (podcastQuery.data) {
      const p = podcastQuery.data as Record<string, unknown>;
      setForm({
        title: String(p.title ?? ''),
        description: String(p.description ?? ''),
        authorId: (p.author as { id?: string } | null)?.id ?? '',
        categoryId: (p.category as { id?: string } | null)?.id ?? '',
        isPublished: Boolean(p.isPublished),
      });
      const eps = (p.episodes as unknown[]) ?? [];
      setEpisodeForm((f) => ({ ...f, order: eps.length + 1 }));
    }
  }, [podcastQuery.data]);

  const saveSeries = async () => {
    const payload = {
      ...form,
      authorId: form.authorId || undefined,
      categoryId: form.categoryId || undefined,
    };
    if (isNew) {
      const res = await adminApi.createPodcast(payload);
      const created = res.data.data as { id: string };
      navigate(`/podcasts/${created.id}`);
    } else {
      await adminApi.updatePodcast(id!, payload);
      queryClient.invalidateQueries({ queryKey: ['podcast', id] });
    }
  };

  const resetEpisodeForm = (nextOrder: number) => {
    setEpisodeForm({ title: '', order: nextOrder, description: '', isPublished: false });
    setAudioUrl('');
  };

  const createEpisode = async (audioId: string) => {
    if (!episodeForm.title.trim()) {
      alert('Indica un título para el episodio');
      return;
    }
    setSavingEpisode(true);
    try {
      await adminApi.addPodcastEpisode(id!, { ...episodeForm, audioId });
      const eps = (podcastQuery.data as { episodes?: unknown[] } | undefined)?.episodes ?? [];
      resetEpisodeForm(eps.length + 2);
      queryClient.invalidateQueries({ queryKey: ['podcast', id] });
    } finally {
      setSavingEpisode(false);
    }
  };

  const saveEpisodeFromUrl = async () => {
    const url = audioUrl.trim();
    if (!url) {
      alert('Indica la URL del archivo de audio (MP3, M4A, etc.)');
      return;
    }
    setSavingEpisode(true);
    try {
      const ext = await mediaApi.registerExternal({
        url,
        filename: `${episodeForm.title || 'episodio'}.mp3`,
        mimeType: 'audio/mpeg',
        type: 'AUDIO',
      });
      await createEpisode(ext.data.data.id);
    } catch {
      alert('No se pudo registrar la URL de audio. Verifica que sea pública y accesible.');
    } finally {
      setSavingEpisode(false);
    }
  };

  if (!isNew && podcastQuery.isLoading) return <Loading />;

  const episodes = (podcastQuery.data as { episodes?: Array<Record<string, unknown>> } | undefined)?.episodes ?? [];

  return (
    <div className="w-full space-y-8">
      <PageHeader
        title={isNew ? 'Nuevo podcast' : 'Editar podcast'}
        action={!isNew ? (
          <Badge variant={form.isPublished ? 'success' : 'muted'}>
            {form.isPublished ? 'Publicado' : 'Borrador'}
          </Badge>
        ) : undefined}
      />

      {isNew ? (
        <div
          className="rounded-xl border px-5 py-4 text-sm text-theme-secondary"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}
        >
          <p className="font-medium text-theme">Cómo subir episodios</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Completa el título y pulsa <strong>Guardar serie</strong>.</li>
            <li>En la misma página aparecerá la sección <strong>Subir episodio</strong> con archivo o URL.</li>
          </ol>
        </div>
      ) : null}

      <div className="glass-card w-full space-y-4 p-8">
        <h2 className="font-display text-xl text-theme">Serie</h2>
        <Input label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea
          className="input-field"
          rows={3}
          placeholder="Descripción"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <select className="input-field" value={form.authorId} onChange={(e) => setForm({ ...form, authorId: e.target.value })}>
            <option value="">Autor</option>
            {(authorsQuery.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select className="input-field" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">Categoría</option>
            {(categoriesQuery.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
          Publicado
        </label>
        {!isNew ? (
          <MediaUpload
            label="Portada"
            accept="image/*"
            mediaType="IMAGE"
            onUploaded={async (asset) => {
              await adminApi.updatePodcast(id!, { coverId: asset.id });
              queryClient.invalidateQueries({ queryKey: ['podcast', id] });
            }}
          />
        ) : null}
        <div className="flex gap-2">
          <Button type="button" onClick={saveSeries}>Guardar serie</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/podcasts')}>Volver</Button>
          {!isNew ? (
            <Button type="button" variant="danger" onClick={async () => {
              if (confirm('¿Eliminar podcast?')) {
                await adminApi.deletePodcast(id!);
                navigate('/podcasts');
              }
            }}>Eliminar</Button>
          ) : null}
        </div>
      </div>

      {!isNew ? (
        <div className="glass-card w-full space-y-5 p-8">
          <div>
            <h2 className="font-display text-xl text-theme">Subir episodio</h2>
            <p className="mt-1 text-sm text-theme-muted">
              Los podcasts requieren un archivo de audio por episodio. Archivos mayores a 5 MB deben usar URL externa (S3, CDN, etc.).
            </p>
          </div>

          <Input
            label="Título del episodio"
            value={episodeForm.title}
            onChange={(e) => setEpisodeForm({ ...episodeForm, title: e.target.value })}
          />
          <Input
            label="Orden"
            type="number"
            value={String(episodeForm.order)}
            onChange={(e) => setEpisodeForm({ ...episodeForm, order: Number(e.target.value) })}
          />
          <textarea
            className="input-field"
            rows={2}
            placeholder="Descripción del episodio (opcional)"
            value={episodeForm.description}
            onChange={(e) => setEpisodeForm({ ...episodeForm, description: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={episodeForm.isPublished}
              onChange={(e) => setEpisodeForm({ ...episodeForm, isPublished: e.target.checked })}
            />
            Publicar episodio
          </label>

          <div className="space-y-3 rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-sm font-medium text-theme">Opción A — Subir archivo (≤ 5 MB)</p>
            <MediaUpload
              label="Archivo de audio"
              accept="audio/*,.mp3,.m4a,.wav"
              mediaType="AUDIO"
              onUploaded={async (asset) => {
                await createEpisode(asset.id);
              }}
            />
          </div>

          <div className="space-y-3 rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-sm font-medium text-theme">Opción B — URL externa (recomendado para MP3 grandes)</p>
            <Input
              label="URL del audio"
              placeholder="https://cdn.ejemplo.com/podcast/episodio-01.mp3"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
            />
            <Button type="button" disabled={savingEpisode} onClick={saveEpisodeFromUrl}>
              {savingEpisode ? 'Guardando…' : 'Guardar episodio con URL'}
            </Button>
          </div>

          <div>
            <h3 className="mb-2 font-medium text-theme">Episodios publicados ({episodes.length})</h3>
            {episodes.length === 0 ? (
              <p className="text-sm text-theme-muted">Aún no hay episodios. Usa las opciones de arriba para añadir el primero.</p>
            ) : (
              <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {episodes.map((ep) => (
                  <li key={String(ep.id)} className="flex justify-between py-2">
                    <span>{String(ep.order)}. {String(ep.title)}</span>
                    <Button type="button" size="sm" variant="danger" onClick={async () => {
                      await adminApi.deletePodcastEpisode(String(ep.id));
                      queryClient.invalidateQueries({ queryKey: ['podcast', id] });
                    }}>Eliminar</Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
