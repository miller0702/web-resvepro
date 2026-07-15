import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { ResourceListPage } from '../../components/list/ResourceListPage';
import { publishableRowActions } from '../../components/list/rowActionHelpers';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { RowActions } from '../../components/ui/RowActions';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { useCategoryFilterOptions, useCollectionFilterOptions } from '../../hooks/useListFilters';

export function BooksListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [collectionId, setCollectionId] = useState<string | undefined>();
  const { filter: categoryFilter } = useCategoryFilterOptions('BOOK');
  const { filter: collectionFilter } = useCollectionFilterOptions();

  const list = usePaginatedList<Record<string, unknown>>({
    queryKey: 'admin-books',
    search,
    filters: { categoryId, collectionId },
    fetchFn: async ({ page, limit, search: q, filters }) => {
      const res = await adminApi.getBooks({
        page,
        limit,
        search: q,
        categoryId: filters.categoryId,
        collectionId: filters.collectionId,
      });
      return { data: res.data.data, meta: res.data.meta };
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      adminApi.updateBook(id, { isPublished }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-books'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBook(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-books'] }),
  });

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'categoryId') setCategoryId(value || undefined);
    if (key === 'collectionId') setCollectionId(value || undefined);
  };

  const busy = publishMutation.isPending || deleteMutation.isPending;

  return (
    <ResourceListPage
      title="Libros"
      subtitle="Catálogo editorial. Quitar de la app = pasar a borrador (los lectores dejan de verlo)."
      action={
        <Link to="/books/new">
          <Button>+ Nuevo libro</Button>
        </Link>
      }
      keyField="id"
      items={list.items}
      isLoading={list.isLoading}
      isFetching={list.isFetching}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar por título o resumen…"
      filters={[categoryFilter, collectionFilter]}
      filterValues={{ categoryId: categoryId ?? '', collectionId: collectionId ?? '' }}
      onFilterChange={handleFilterChange}
      meta={list.meta}
      page={list.page}
      onPageChange={list.setPage}
      emptyMessage="No hay libros que coincidan con los filtros"
      columns={[
        { key: 'title', label: 'Título' },
        {
          key: 'category',
          label: 'Categoría',
          render: (row) => String((row.category as { name?: string } | null)?.name ?? '—'),
        },
        { key: 'slug', label: 'Slug' },
        {
          key: 'isAudiobook',
          label: 'Audio',
          render: (row) =>
            row.isAudiobook ? (
              <Badge variant="success">Audiolibro</Badge>
            ) : (
              <span className="text-theme-muted">—</span>
            ),
        },
        {
          key: 'isPublished',
          label: 'Estado',
          render: (row) => (
            <Badge variant={row.isPublished ? 'success' : 'muted'}>
              {row.isPublished ? 'En la app' : 'Fuera de la app'}
            </Badge>
          ),
        },
        {
          key: 'actions',
          label: 'Acciones',
          render: (row) => {
            const id = String(row.id);
            const published = Boolean(row.isPublished);
            return (
              <RowActions
                actions={publishableRowActions({
                  editPath: `/books/${id}`,
                  isPublished: published,
                  busy,
                  entityLabel: 'libro',
                  onTogglePublish: () =>
                    publishMutation.mutate({ id, isPublished: !published }),
                  onDelete: () => deleteMutation.mutate(id),
                })}
              />
            );
          },
        },
      ]}
    />
  );
}
