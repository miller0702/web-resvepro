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
  bio: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function AuthorFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  return (
    <div className="w-full">
      <PageHeader title={isEdit ? 'Editar autor' : 'Nuevo autor'} subtitle="Autores de libros y podcasts" />
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
          {isEdit ? (
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                if (confirm('¿Eliminar este autor permanentemente?')) deleteMutation.mutate();
              }}
            >
              Eliminar
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
