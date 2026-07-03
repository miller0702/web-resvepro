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

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  kind: z.enum(['BOOK', 'PODCAST', 'VIDEO']),
  sortOrder: z.coerce.number().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

export function CategoryFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  return (
    <div className="w-full">
      <PageHeader title={isEdit ? 'Editar categoría' : 'Nueva categoría'} />
      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="glass-card w-full space-y-5 p-8">
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
          {isEdit ? (
            <Button type="button" variant="danger" onClick={() => {
              if (confirm('¿Eliminar categoría?')) deleteMutation.mutate();
            }}>Eliminar</Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
