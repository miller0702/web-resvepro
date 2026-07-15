import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { PageHeader } from '../../components/ui/PageHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { ResourceModeHeaderAction, useResourceMode } from '../../hooks/useResourceMode';
import { DetailField, DetailGrid, DetailSection } from '../../components/ui/DetailView';

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  bio: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function AuthorFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isView, editHref } = useResourceMode();

  const authorQuery = useQuery({
    queryKey: ['author', id],
    queryFn: async () => (await adminApi.getAuthor(id!)).data.data as Record<string, unknown>,
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (authorQuery.data) {
      reset({
        name: String(authorQuery.data.name ?? ''),
        bio: String(authorQuery.data.bio ?? ''),
      });
    }
  }, [authorQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      isEdit ? adminApi.updateAuthor(id!, data) : adminApi.createAuthor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      navigate('/authors');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteAuthor(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      navigate('/authors');
    },
  });

  if (isEdit && authorQuery.isLoading) return <Loading />;

  const author = authorQuery.data;
  const authorName = String(author?.name ?? 'Autor');

  const headerActions = isEdit ? (
    <ResourceModeHeaderAction
      isView={isView}
      editHref={editHref}
      entityLabel="autor"
      busy={deleteMutation.isPending}
      onDelete={() => deleteMutation.mutate()}
    />
  ) : undefined;

  if (isEdit && isView) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title={authorName} subtitle="Vista de detalle" action={headerActions} />

        <DetailSection>
          <DetailGrid>
            <DetailField label="Nombre">{author?.name ? String(author.name) : null}</DetailField>
            <DetailField label="Biografía" span={2}>
              {author?.bio ? (
                <p className="whitespace-pre-wrap text-theme-secondary">{String(author.bio)}</p>
              ) : null}
            </DetailField>
          </DetailGrid>
        </DetailSection>

        <Button type="button" variant="ghost" onClick={() => navigate('/authors')}>
          Volver al listado
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PageHeader
        title={isEdit ? 'Editar autor' : 'Nuevo autor'}
        subtitle="Autores de libros y podcasts"
        action={headerActions}
      />
      <form
        onSubmit={handleSubmit((d) => saveMutation.mutate(d))}
        className="glass-card w-full space-y-5 p-8"
      >
        <Input label="Nombre" error={errors.name?.message} {...register('name')} />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-theme-secondary">Biografía</label>
          <textarea {...register('bio')} className="input-field w-full" rows={5} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isEdit ? 'Guardar cambios' : 'Crear autor'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/authors')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
