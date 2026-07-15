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
import { alertDialog, confirmDialog } from '../../lib/dialog';
import { ResourceModeHeaderAction, useResourceMode } from '../../hooks/useResourceMode';
import {
  DetailAsset,
  DetailField,
  DetailFlags,
  DetailGrid,
  DetailSection,
} from '../../components/ui/DetailView';

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
  const { isView, editHref } = useResourceMode();
  const [viewingChapterId, setViewingChapterId] = useState<string | null>(null);

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
    try {
      if (editingChapter) {
        await adminApi.updateChapter(editingChapter.id, chapterForm);
      } else {
        await adminApi.addChapter(id!, chapterForm);
      }
      setChapterForm({ title: '', order: (bookQuery.data?.chapters?.length ?? 0) + 2, content: '' });
      setEditingChapter(null);
      await queryClient.invalidateQueries({ queryKey: ['book', id] });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const text = Array.isArray(message) ? message.join(', ') : message;
      await alertDialog({
        title: 'No se pudo guardar',
        message: text || 'No se pudo guardar el capítulo. Revisa el orden o el contenido.',
        tone: 'warning',
      });
    }
  };

  if (bookQuery.isLoading) return <Loading />;

  const book = bookQuery.data;
  const chapters = book?.chapters ?? [];
  const isPublished = Boolean(book?.isPublished);
  const authorName = (book?.author as { name?: string } | null)?.name;
  const categoryName = (book?.category as { name?: string } | null)?.name;
  const coverUrl = book?.coverUrl ? String(book.coverUrl) : null;
  const contentUrl = book?.contentUrl ? String(book.contentUrl) : null;
  const audioUrl = book?.audioUrl ? String(book.audioUrl) : null;

  const headerActions = (
    <ResourceModeHeaderAction
      isView={isView}
      editHref={editHref}
      extra={
        <Badge variant={isPublished ? 'success' : 'muted'}>
          {isPublished ? 'Publicado' : 'Borrador'}
        </Badge>
      }
      isPublished={isPublished}
      entityLabel="libro"
      busy={deleteMutation.isPending || updateMutation.isPending}
      onTogglePublish={() => {
        void adminApi.updateBook(id!, { isPublished: !isPublished }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['book', id] });
          queryClient.invalidateQueries({ queryKey: ['admin-books'] });
        });
      }}
      onDelete={() => deleteMutation.mutate()}
    />
  );

  if (isView) {
    return (
      <div className="w-full space-y-6">
        <PageHeader
          title={String(book?.title ?? 'Libro')}
          subtitle="Vista de detalle"
          action={headerActions}
        />

        <DetailSection>
          <div className="flex flex-col gap-6 sm:flex-row">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt=""
                className="h-44 w-32 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-[var(--color-border)]"
              />
            ) : (
              <div
                className="flex h-44 w-32 shrink-0 items-center justify-center rounded-xl text-xs text-theme-muted surface-muted"
                style={{ border: '1px solid var(--color-border)' }}
              >
                Sin portada
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-5">
              <DetailFlags>
                <Badge variant={isPublished ? 'success' : 'muted'}>
                  {isPublished ? 'En la app' : 'Borrador'}
                </Badge>
                {book?.isAudiobook ? <Badge variant="panel">Audiolibro</Badge> : null}
              </DetailFlags>
              <DetailGrid>
                <DetailField label="Autor">{authorName}</DetailField>
                <DetailField label="Categoría">{categoryName}</DetailField>
                <DetailField label="Resumen" span={2}>
                  {book?.summary ? (
                    <p className="whitespace-pre-wrap text-theme-secondary">{String(book.summary)}</p>
                  ) : null}
                </DetailField>
              </DetailGrid>
            </div>
          </div>
        </DetailSection>

        <DetailSection title="Archivos">
          <DetailGrid>
            <DetailAsset label="Portada" name={coverName} href={coverUrl} />
            <DetailAsset label="Documento (PDF/EPUB)" name={contentName} href={contentUrl} />
            <DetailAsset label="Audio" name={audioName} href={audioUrl} />
          </DetailGrid>
        </DetailSection>

        <DetailSection title={`Capítulos (${chapters.length})`}>
          {chapters.length === 0 ? (
            <p className="text-sm text-theme-muted">No hay capítulos todavía.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {chapters.map((ch) => {
                const open = viewingChapterId === ch.id;
                return (
                  <li key={ch.id} className="py-4">
                    <button
                      type="button"
                      onClick={() => setViewingChapterId(open ? null : ch.id)}
                      className="flex w-full items-start justify-between gap-4 text-left"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-theme">
                          {ch.order}. {ch.title}
                        </p>
                        {!open ? (
                          <p className="mt-0.5 truncate text-sm text-theme-muted">
                            {chapterContentPreview(ch.content, 120)}
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-sm font-medium text-gold-dim dark:text-gold-light">
                        {open ? 'Ocultar' : 'Leer'}
                      </span>
                    </button>
                    {open ? (
                      <div className="mt-3">
                        <ChapterEditor value={ch.content} onChange={() => undefined} readOnly />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </DetailSection>

        <Button type="button" variant="ghost" onClick={() => navigate('/books')}>
          Volver al listado
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <PageHeader
        title="Editar libro"
        subtitle={String(book?.title ?? '')}
        action={
          <Badge variant={isPublished ? 'success' : 'muted'}>
            {isPublished ? 'Publicado' : 'Borrador'}
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
            if (!book?.isAudiobook) {
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
                <p className="max-w-md truncate text-xs text-theme-muted">
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
                  onClick={() => {
                    void confirmDialog({
                      title: 'Eliminar capítulo',
                      message: `¿Eliminar el capítulo «${ch.title}»? Esta acción no se puede deshacer.`,
                      confirmLabel: 'Eliminar',
                      tone: 'danger',
                    }).then(async (ok) => {
                      if (!ok) return;
                      await adminApi.deleteChapter(ch.id);
                      queryClient.invalidateQueries({ queryKey: ['book', id] });
                    });
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