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
import { CATEGORY_KIND_FILTER } from '../hooks/useListFilters';

const KIND_LABELS: Record<string, string> = {
  BOOK: 'Libros',
  PODCAST: 'Podcasts',
  VIDEO: 'Videos',
};

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<string | undefined>();
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () =>
      (await adminApi.getCategories()).data.data as Array<Record<string, unknown>>,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const list = useClientList({
    items: data ?? [],
    search,
    searchKeys: ['name', 'slug', 'kind'],
    filterFn: (row) => !kind || String(row.kind) === kind,
  });

  return (
    <>
      <ResourceListPage
        title="Categorías"
        subtitle="Organización temática del catálogo"
        action={
          <Link to="/categories/new">
            <Button>+ Nueva categoría</Button>
          </Link>
        }
        keyField="id"
        items={list.items}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar categoría…"
        filters={[CATEGORY_KIND_FILTER]}
        filterValues={{ kind: kind ?? '' }}
        onFilterChange={(_key, value) => setKind(value || undefined)}
        meta={list.meta}
        page={list.page}
        onPageChange={list.setPage}
        emptyMessage="No hay categorías que coincidan"
        columns={[
          { key: 'name', label: 'Nombre' },
          { key: 'kind', label: 'Tipo' },
          { key: 'slug', label: 'Slug' },
          { key: 'sortOrder', label: 'Orden' },
          {
            key: 'actions',
            label: 'Acciones',
            render: (row) => {
              const id = String(row.id);
              return (
                <RowActions
                  actions={basicResourceRowActions({
                    editPath: `/categories/${id}`,
                    entityLabel: 'categoría',
                    busy: deleteMutation.isPending,
                    onDelete: () => deleteMutation.mutate(id),
                    onPreview: () => setPreview(row),
                  })}
                />
              );
            },
          },
        ]}
      />

      <PreviewModal
        open={Boolean(preview)}
        title={preview ? String(preview.name) : 'Categoría'}
        onClose={() => setPreview(null)}
        editPath={preview ? `/categories/${String(preview.id)}` : undefined}
        entityLabel="categoría"
        busy={deleteMutation.isPending}
        onDelete={
          preview ? () => deleteMutation.mutate(String(preview.id)) : undefined
        }
      >
        <DetailGrid>
          <DetailField label="Nombre">
            {preview?.name ? String(preview.name) : null}
          </DetailField>
          <DetailField label="Tipo">
            {preview?.kind
              ? KIND_LABELS[String(preview.kind)] ?? String(preview.kind)
              : null}
          </DetailField>
          <DetailField label="Slug">
            {preview?.slug ? String(preview.slug) : null}
          </DetailField>
          <DetailField label="Orden">
            {preview?.sortOrder !== undefined && preview?.sortOrder !== null
              ? String(preview.sortOrder)
              : null}
          </DetailField>
        </DetailGrid>
      </PreviewModal>
    </>
  );
}
