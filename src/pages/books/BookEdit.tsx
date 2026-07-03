import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { PageHeader } from '../../components/ui/PageHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { MediaUpload } from '../../components/MediaUpload';
import { ChapterEditor, chapterContentPreview } from '../../components/books/ChapterEditor';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';

const schema = z.object({
  title: z.string().min(1, 'Título requerido'),
  summary: z.string().optional(),
  authorId: z.string().optional(),
  categoryId: z.string().optional(),
  isPublished: z.boolean().optional(),
  isAudiobook: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

type Chapter = {
  id: string;
  title: string;
  order: number;
  content: string;
};

export function BookEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const bookQuery = useQuery({
    queryKey: ['book', id],
    queryFn: async () => {
      const res = await adminApi.getBook(id!);
      return res.data.data as Record<string, unknown> & { chapters?: Chapter[] };
    },
    enabled: Boolean(id),
  });

  const authorsQuery = useQuery({
    queryKey: ['authors'],
    queryFn: async () => (await adminApi.getAuthors()).data.data as Array<{ id: string; name: string }>,
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'BOOK'],
    queryFn: async () =>
      (await adminApi.getCategories('BOOK')).data.data as Array<{ id: string; name: string }>,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (bookQuery.data) {
      const b = bookQuery.data;
      reset({
        title: String(b.title ?? ''),
        summary: String(b.summary ?? ''),
        authorId: (b.author as { id?: string } | null)?.id ?? '',
        categoryId: (b.category as { id?: string } | null)?.id ?? '',
        isPublished: Boolean(b.isPublished),
        isAudiobook: Boolean(b.isAudiobook),
      });
    }
  }, [bookQuery.data, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      adminApi.updateBook(id!, {
        ...data,
        authorId: data.authorId || null,
        categoryId: data.categoryId || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteBook(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      navigate('/books');
    },
  });

  const [, setCoverId] = useState<string | null>(null);
  const [contentId, setContentId] = useState<string | null>(null);
  const [audioId, setAudioId] = useState<string | null>(null);
  const [coverName, setCoverName] = useState<string | null>(null);
  const [contentName, setContentName] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);

  useEffect(() => {
    if (bookQuery.data) {
      setCoverId((bookQuery.data.coverId as string) ?? null);
      setContentId((bookQuery.data.contentId as string) ?? null);
      setAudioId((bookQuery.data.audioId as string) ?? null);
      setCoverName(bookQuery.data.coverUrl ? 'Portada cargada' : null);
      setContentName(bookQuery.data.contentUrl ? String(bookQuery.data.contentMimeType ?? 'Documento') : null);
      setAudioName(bookQuery.data.audioUrl ? String(bookQuery.data.audioMimeType ?? 'Audio') : null);
    }
  }, [bookQuery.data]);

  const attachMedia = async (field: 'cover' | 'content' | 'audio', assetId: string) => {
    const payload =
      field === 'cover'
        ? { coverId: assetId }
        : field === 'content'
          ? { contentId: assetId }
          : { audioId: assetId };
    await adminApi.updateBook(id!, payload);
    queryClient.invalidateQueries({ queryKey: ['book', id] });
  };

  const [chapterForm, setChapterForm] = useState({ title: '', order: 1, content: '' });
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  const saveChapter = async () => {
    const title = chapterForm.title.trim();
    const hasBody = chapterForm.content.replace(/<[^>]+>/g, '').trim().length > 0;
    if (!title || !hasBody) return;
    if (editingChapter) {
      await adminApi.updateChapter(editingChapter.id, chapterForm);
    } else {
      await adminApi.addChapter(id!, chapterForm);
    }
    setChapterForm({ title: '', order: (bookQuery.data?.chapters?.length ?? 0) + 1, content: '' });
    setEditingChapter(null);
    queryClient.invalidateQueries({ queryKey: ['book', id] });
  };

  if (bookQuery.isLoading) return <Loading />;

  const chapters = bookQuery.data?.chapters ?? [];

  return (
    <div className="w-full space-y-8">
      <PageHeader
        title="Editar libro"
        subtitle={String(bookQuery.data?.title ?? '')}
        action={
          <Badge variant={bookQuery.data?.isPublished ? 'success' : 'muted'}>
            {bookQuery.data?.isPublished ? 'Publicado' : 'Borrador'}
          </Badge>
        }
      />

      <form
        onSubmit={handleSubmit(async (data) => {
          await updateMutation.mutateAsync(data);
        })}
        className="glass-card w-full space-y-5 p-8"
      >
        <h2 className="font-display text-xl text-theme">Metadatos</h2>
        <Input label="Título" error={errors.title?.message} {...register('title')} />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-theme-secondary">Resumen</label>
          <textarea {...register('summary')} className="input-field" rows={4} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-theme-secondary">Autor</label>
            <select {...register('authorId')} className="input-field">
              <option value="">Sin autor</option>
              {(authorsQuery.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-theme-secondary">Categoría</label>
            <select {...register('categoryId')} className="input-field">
              <option value="">Sin categoría</option>
              {(categoriesQuery.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 surface-muted" style={{ borderColor: 'var(--color-border)' }}>
          <input type="checkbox" {...register('isPublished')} className="h-4 w-4 accent-gold" />
          <span className="text-sm text-theme-secondary">Publicado</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 surface-muted" style={{ borderColor: 'var(--color-border)' }}>
          <input type="checkbox" {...register('isAudiobook')} className="h-4 w-4 accent-gold" />
          <span className="text-sm text-theme-secondary">Es audiolibro (aparece en Audio y se puede reproducir)</span>
        </label>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting}>Guardar metadatos</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/books')}>Volver</Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              if (confirm('¿Eliminar este libro permanentemente?')) deleteMutation.mutate();
            }}
          >
            Eliminar
          </Button>
        </div>
      </form>

      <div
        className="rounded-xl border px-5 py-4 text-sm text-theme-secondary"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}
      >
        <p className="font-medium text-theme">¿Cómo funciona el contenido del libro?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            El <strong>lector de la app</strong> muestra los <strong>capítulos HTML</strong> de la sección inferior, no el PDF directamente.
          </li>
          <li>
            El PDF/EPUB adjunto aquí es solo un archivo de referencia o descarga; <strong>no se extraen capítulos automáticamente</strong> (eso está planificado como ingesta futura).
          </li>
          <li>
            Para publicar: añade capítulos manualmente o importa textos ya estructurados en HTML.
          </li>
        </ul>
      </div>

      <div className="glass-card w-full space-y-5 p-8">
        <h2 className="font-display text-xl text-theme">Archivos</h2>
        <MediaUpload
          label="Portada (imagen)"
          accept="image/*"
          mediaType="IMAGE"
          currentFilename={coverName}
          onUploaded={async (asset) => {
            setCoverId(asset.id);
            setCoverName(asset.filename);
            await attachMedia('cover', asset.id);
          }}
        />
        <MediaUpload
          label="Contenido (PDF, EPUB ≤ 5 MB)"
          accept=".pdf,.epub,application/pdf,application/epub+zip"
          currentFilename={contentName}
          onUploaded={async (asset) => {
            setContentId(asset.id);
            setContentName(asset.filename);
            await attachMedia('content', asset.id);
          }}
        />
        {contentId ? (
          <p className="text-xs text-theme-muted">ID contenido: {contentId}</p>
        ) : null}
        <MediaUpload
          label="Audio del audiolibro (MP3, M4A ≤ 5 MB inline; archivos grandes vía URL externa)"
          accept="audio/*,.mp3,.m4a,.wav"
          mediaType="AUDIO"
          currentFilename={audioName}
          onUploaded={async (asset) => {
            setAudioId(asset.id);
            setAudioName(asset.filename);
            await attachMedia('audio', asset.id);
            if (!bookQuery.data?.isAudiobook) {
              await adminApi.updateBook(id!, { isAudiobook: true });
              queryClient.invalidateQueries({ queryKey: ['book', id] });
            }
          }}
        />
        {audioId ? (
          <p className="text-xs text-theme-muted">ID audio: {audioId}</p>
        ) : null}
      </div>

      <div className="glass-card w-full space-y-5 p-8">
        <h2 className="font-display text-xl text-theme">Capítulos ({chapters.length})</h2>
        <div className="space-y-3 rounded-xl border p-4 surface-muted" style={{ borderColor: 'var(--color-border)' }}>
          <Input
            label="Título del capítulo"
            value={chapterForm.title}
            onChange={(e) => setChapterForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Input
            label="Orden"
            type="number"
            value={String(chapterForm.order)}
            onChange={(e) => setChapterForm((f) => ({ ...f, order: Number(e.target.value) || 1 }))}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-theme-secondary">Contenido</label>
            <ChapterEditor
              value={chapterForm.content}
              onChange={(content) => setChapterForm((f) => ({ ...f, content }))}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={saveChapter}>
              {editingChapter ? 'Actualizar capítulo' : 'Añadir capítulo'}
            </Button>
            {editingChapter ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => {
                setEditingChapter(null);
                setChapterForm({ title: '', order: chapters.length + 1, content: '' });
              }}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </div>
        <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {chapters.map((ch) => (
            <li key={ch.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="font-medium text-theme">{ch.order}. {ch.title}</p>
                <p className="text-xs text-theme-muted truncate max-w-md">
                  {chapterContentPreview(ch.content)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingChapter(ch);
                    setChapterForm({ title: ch.title, order: ch.order, content: ch.content });
                  }}
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={async () => {
                    if (confirm('¿Eliminar capítulo?')) {
                      await adminApi.deleteChapter(ch.id);
                      queryClient.invalidateQueries({ queryKey: ['book', id] });
                    }
                  }}
                >
                  Eliminar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}