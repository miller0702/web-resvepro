import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { ResourceListPage } from '../components/list/ResourceListPage';
import { basicResourceRowActions } from '../components/list/rowActionHelpers';
import { Button } from '../components/ui/Button';
import { DetailField, DetailGrid } from '../components/ui/DetailView';
import { PreviewModal } from '../components/ui/PreviewModal';
import { RowActions } from '../components/ui/RowActions';
import { useClientList } from '../hooks/useClientList';

type AuthorRow = {
  id: string;
  name: string;
  bio?: string;
  bookCount: number;
};

export function AuthorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<AuthorRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['authors'],
    queryFn: async () =>
      (await adminApi.getAuthors()).data.data as AuthorRow[],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteAuthor(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['authors'] }),
  });

  const list = useClientList({
    items: (data ?? []) as Record<string, unknown>[],
    search,
    searchKeys: ['name', 'bio'],
  });

  return (
    <>
      <ResourceListPage
        title="Autores"
        subtitle="Gestiona autores de libros y podcasts"
        action={
          <Link to="/authors/new">
            <Button>+ Nuevo autor</Button>
          </Link>
        }
        keyField="id"
        items={list.items}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar autor…"
        meta={list.meta}
        page={list.page}
        onPageChange={list.setPage}
        emptyMessage="No hay autores que coincidan"
        columns={[
          { key: 'name', label: 'Nombre' },
          { key: 'bookCount', label: 'Libros' },
          {
            key: 'bio',
            label: 'Biografía',
            render: (row) => (
              <span className="line-clamp-2 text-theme-muted">{String(row.bio ?? '—')}</span>
            ),
          },
          {
            key: 'actions',
            label: 'Acciones',
            render: (row) => {
              const id = String(row.id);
              return (
                <RowActions
                  actions={basicResourceRowActions({
                    editPath: `/authors/${id}`,
                    entityLabel: 'autor',
                    busy: deleteMutation.isPending,
                    onDelete: () => deleteMutation.mutate(id),
                    onPreview: () =>
                      setPreview({
                        id,
                        name: String(row.name ?? ''),
                        bio: row.bio ? String(row.bio) : undefined,
                        bookCount: Number(row.bookCount ?? 0),
                      }),
                  })}
                />
              );
            },
          },
        ]}
      />

      <PreviewModal
        open={Boolean(preview)}
        title={preview?.name ?? 'Autor'}
        onClose={() => setPreview(null)}
        editPath={preview ? `/authors/${preview.id}` : undefined}
        entityLabel="autor"
        busy={deleteMutation.isPending}
        onDelete={preview ? () => deleteMutation.mutate(preview.id) : undefined}
      >
        <DetailGrid>
          <DetailField label="Nombre">{preview?.name}</DetailField>
          <DetailField label="Libros asociados">
            {preview ? String(preview.bookCount) : null}
          </DetailField>
          <DetailField label="Biografía" span={2}>
            {preview?.bio ? (
              <p className="whitespace-pre-wrap text-theme-secondary">{preview.bio}</p>
            ) : null}
          </DetailField>
        </DetailGrid>
      </PreviewModal>
    </>
  );
}
