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
import { Loading } from '../../components/ui/Loading';

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CollectionFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [bookToAdd, setBookToAdd] = useState('');

  const collectionQuery = useQuery({
    queryKey: ['collection', id],
    queryFn: async () => (await adminApi.getCollection(id!)).data.data as {
      id: string;
      name: string;
      description?: string;
      books: Array<{ sortOrder: number; book: { id: string; title: string } }>;
    },
    enabled: isEdit,
  });

  const booksQuery = useQuery({
    queryKey: ['admin-books-picker'],
    queryFn: async () => (await adminApi.getBooks()).data.data as Array<{ id: string; title: string }>,
    enabled: isEdit,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (collectionQuery.data) {
      reset({
        name: collectionQuery.data.name,
        description: collectionQuery.data.description ?? '',
      });
    }
  }, [collectionQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      isEdit ? adminApi.updateCollection(id!, data) : adminApi.createCollection(data),
    onSuccess: async (res) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      if (!isEdit) {
        const created = res.data.data as { id: string };
        navigate(`/collections/${created.id}`);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteCollection(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      navigate('/collections');
    },
  });

  if (isEdit && collectionQuery.isLoading) return <Loading />;

  return (
    <div className="w-full space-y-8">
      <PageHeader title={isEdit ? 'Editar colección' : 'Nueva colección'} />
      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="glass-card space-y-5 p-8">
        <Input label="Nombre" error={errors.name?.message} {...register('name')} />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-theme-secondary">Descripción</label>
          <textarea {...register('description')} className="input-field" rows={3} />
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>Guardar</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/collections')}>Cancelar</Button>
          {isEdit ? (
            <Button type="button" variant="danger" onClick={() => {
              if (confirm('¿Eliminar colección?')) deleteMutation.mutate();
            }}>Eliminar</Button>
          ) : null}
        </div>
      </form>

      {isEdit && collectionQuery.data ? (
        <div className="glass-card w-full space-y-4 p-8">
          <h2 className="font-display text-xl">Libros en la colección</h2>
          <div className="flex gap-2">
            <select
              value={bookToAdd}
              onChange={(e) => setBookToAdd(e.target.value)}
              className="input-field flex-1"
            >
              <option value="">Seleccionar libro…</option>
              {(booksQuery.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              disabled={!bookToAdd}
              onClick={async () => {
                await adminApi.addBookToCollection(id!, { bookId: bookToAdd });
                setBookToAdd('');
                queryClient.invalidateQueries({ queryKey: ['collection', id] });
              }}
            >
              Añadir
            </Button>
          </div>
          <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {(collectionQuery.data.books ?? []).map(({ book }) => (
              <li key={book.id} className="flex items-center justify-between py-2">
                <span>{book.title}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={async () => {
                    await adminApi.removeBookFromCollection(id!, book.id);
                    queryClient.invalidateQueries({ queryKey: ['collection', id] });
                  }}
                >
                  Quitar
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
