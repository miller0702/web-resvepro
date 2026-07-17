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
  kind: z.enum(['BOOK', 'PODCAST', 'VIDEO']),
  sortOrder: z.coerce.number().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

const KIND_LABELS: Record<FormData['kind'], string> = {
  BOOK: 'Libros',
  PODCAST: 'Podcasts',
  VIDEO: 'Videos',
};

export function CategoryFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isView, editHref } = useResourceMode();

  const categoryQuery = useQuery({
    queryKey: ['category', id],
    queryFn: async () => (await adminApi.getCategory(id!)).data.data as Record<string, unknown>,
    enabled: isEdit,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { kind: 'BOOK', sortOrder: 0 },
  });

  useEffect(() => {
    if (categoryQuery.data) {
      reset({
        name: String(categoryQuery.data.name),
        kind: categoryQuery.data.kind as FormData['kind'],
        sortOrder: Number(categoryQuery.data.sortOrder ?? 0),
      });
    }
  }, [categoryQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      isEdit ? adminApi.updateCategory(id!, data) : adminApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      navigate('/categories');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteCategory(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      navigate('/categories');
    },
  });

  if (isEdit && categoryQuery.isLoading) return <Loading />;

  const category = categoryQuery.data;
  const categoryName = String(category?.name ?? 'Categoría');
  const kind = category?.kind as FormData['kind'] | undefined;

  const headerActions = isEdit ? (
    <ResourceModeHeaderAction
      isView={isView}
      editHref={editHref}
      entityLabel="categoría"
      busy={deleteMutation.isPending}
      onDelete={() => deleteMutation.mutate()}
    />
  ) : undefined;

  if (isEdit && isView) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title={categoryName} subtitle="Vista de detalle" action={headerActions} backTo="/categories" />

        <DetailSection>
          <DetailGrid>
            <DetailField label="Nombre">{category?.name ? String(category.name) : null}</DetailField>
            <DetailField label="Tipo de contenido">
              {kind ? KIND_LABELS[kind] : null}
            </DetailField>
            <DetailField label="Orden">
              {category?.sortOrder !== undefined && category?.sortOrder !== null
                ? String(category.sortOrder)
                : null}
            </DetailField>
          </DetailGrid>
        </DetailSection>

        <Button type="button" variant="ghost" onClick={() => navigate('/categories')}>
          Volver al listado
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PageHeader
        title={isEdit ? 'Editar categoría' : 'Nueva categoría'}
        action={headerActions}
        backTo="/categories"
      />
      <form
        onSubmit={handleSubmit((d) => saveMutation.mutate(d))}
        className="glass-card w-full space-y-5 p-8"
      >
        <Input label="Nombre" error={errors.name?.message} {...register('name')} />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-theme-secondary">Tipo de contenido</label>
          <select {...register('kind')} className="input-field">
            <option value="BOOK">Libros</option>
            <option value="PODCAST">Podcasts</option>
            <option value="VIDEO">Videos</option>
          </select>
        </div>
        <Input label="Orden" type="number" error={errors.sortOrder?.message} {...register('sortOrder')} />
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>Guardar</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/categories')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
