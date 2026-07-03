import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { PageHeader } from '../../components/ui/PageHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const schema = z.object({
  title: z.string().min(1, 'Título requerido'),
  summary: z.string().optional(),
  authorId: z.string().optional(),
  categoryId: z.string().optional(),
  isPublished: z.boolean().optional(),
  isAudiobook: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export function BookFormPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isPublished: false, isAudiobook: false },
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

  const onSubmit = async (data: FormData) => {
    const res = await adminApi.createBook({
      ...data,
      authorId: data.authorId || undefined,
      categoryId: data.categoryId || undefined,
    });
    const book = res.data.data as { id: string };
    navigate(`/books/${book.id}`);
  };

  return (
    <div className="w-full">
      <PageHeader title="Nuevo libro" subtitle="Añade una obra al catálogo" />
      <form onSubmit={handleSubmit(onSubmit)} className="glass-card w-full space-y-5 p-8">
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
          <span className="text-sm text-theme-secondary">Publicar inmediatamente</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 surface-muted" style={{ borderColor: 'var(--color-border)' }}>
          <input type="checkbox" {...register('isAudiobook')} className="h-4 w-4 accent-gold" />
          <span className="text-sm text-theme-secondary">Es audiolibro (aparece en Audio y se puede reproducir)</span>
        </label>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Crear y continuar'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/books')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
