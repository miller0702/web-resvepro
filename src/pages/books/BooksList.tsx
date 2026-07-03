import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { ResourceListPage } from '../../components/list/ResourceListPage';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { useCategoryFilterOptions, useCollectionFilterOptions } from '../../hooks/useListFilters';

export function BooksListPage() {
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

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'categoryId') setCategoryId(value || undefined);
    if (key === 'collectionId') setCollectionId(value || undefined);
  };

  return (
    <ResourceListPage
      title="Libros"
      subtitle="Catálogo editorial de la plataforma"
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
              {row.isPublished ? 'Publicado' : 'Borrador'}
            </Badge>
          ),
        },
        {
          key: 'id',
          label: '',
          render: (row) => (
            <Link to={`/books/${row.id}`} className="font-medium text-gold-dim hover:text-gold">
              Editar →
            </Link>
          ),
        },
      ]}
    />
  );
}
