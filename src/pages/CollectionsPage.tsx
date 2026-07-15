import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { ResourceListPage } from '../components/list/ResourceListPage';
import { basicResourceRowActions } from '../components/list/rowActionHelpers';
import { Button } from '../components/ui/Button';
import { DetailField, DetailGrid } from '../components/ui/DetailView';
import { Loading } from '../components/ui/Loading';
import { PreviewModal } from '../components/ui/PreviewModal';
import { RowActions } from '../components/ui/RowActions';
import { useClientList } from '../hooks/useClientList';

type CollectionDetail = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  books: Array<{ sortOrder: number; book: { id: string; title: string } }>;
};

export function CollectionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: async () =>
      (await adminApi.getCollections()).data.data as Array<Record<string, unknown>>,
  });

  const previewQuery = useQuery({
    queryKey: ['collection', previewId],
    queryFn: async () =>
      (await adminApi.getCollection(previewId!)).data.data as CollectionDetail,
    enabled: Boolean(previewId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setPreviewId(null);
    },
  });

  const list = useClientList({
    items: data ?? [],
    search,
    searchKeys: ['name', 'slug', 'description'],
  });

  const preview = previewQuery.data;

  return (
    <>
      <ResourceListPage
        title="Colecciones"
        subtitle="Agrupaciones editoriales de libros"
        action={
          <Link to="/collections/new">
            <Button>+ Nueva colección</Button>
          </Link>
        }
        keyField="id"
        items={list.items}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar colección…"
        meta={list.meta}
        page={list.page}
        onPageChange={list.setPage}
        emptyMessage="No hay colecciones que coincidan"
        columns={[
          { key: 'name', label: 'Nombre' },
          { key: 'bookCount', label: 'Libros' },
          { key: 'slug', label: 'Slug' },
          {
            key: 'actions',
            label: 'Acciones',
            render: (row) => {
              const id = String(row.id);
              return (
                <RowActions
                  actions={basicResourceRowActions({
                    editPath: `/collections/${id}`,
                    entityLabel: 'colección',
                    busy: deleteMutation.isPending,
                    onDelete: () => deleteMutation.mutate(id),
                    onPreview: () => setPreviewId(id),
                  })}
                />
              );
            },
          },
        ]}
      />

      <PreviewModal
        open={Boolean(previewId)}
        title={preview?.name ?? 'Colección'}
        onClose={() => setPreviewId(null)}
        editPath={previewId ? `/collections/${previewId}` : undefined}
        entityLabel="colección"
        busy={deleteMutation.isPending}
        onDelete={previewId ? () => deleteMutation.mutate(previewId) : undefined}
      >
        {previewQuery.isLoading || !preview ? (
          <Loading />
        ) : (
          <div className="space-y-5">
            <DetailGrid>
              <DetailField label="Nombre">{preview.name}</DetailField>
              <DetailField label="Slug">{preview.slug}</DetailField>
              <DetailField label="Descripción" span={2}>
                {preview.description ? (
                  <p className="whitespace-pre-wrap text-theme-secondary">
                    {preview.description}
                  </p>
                ) : null}
              </DetailField>
            </DetailGrid>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-theme-muted">
                Libros ({preview.books?.length ?? 0})
              </p>
              {(preview.books?.length ?? 0) === 0 ? (
                <p className="text-sm text-theme-muted">Sin libros en la colección.</p>
              ) : (
                <ul className="max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-[var(--color-border)] p-3">
                  {preview.books.map(({ book }) => (
                    <li key={book.id} className="text-sm text-theme">
                      {book.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </PreviewModal>
    </>
  );
}
