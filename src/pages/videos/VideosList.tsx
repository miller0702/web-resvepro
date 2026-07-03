import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { ResourceListPage } from '../../components/list/ResourceListPage';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { useCategoryFilterOptions } from '../../hooks/useListFilters';

export function VideosListPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const { filter: categoryFilter } = useCategoryFilterOptions('VIDEO');

  const list = usePaginatedList<Record<string, unknown>>({
    queryKey: 'videos',
    search,
    filters: { categoryId },
    fetchFn: async ({ page, limit, search: q, filters }) => {
      const res = await adminApi.getVideos({ categoryId: filters.categoryId });
      let items = res.data.data as Record<string, unknown>[];
      if (q) {
        const term = q.toLowerCase();
        items = items.filter((row) =>
          String(row.title ?? '').toLowerCase().includes(term) ||
          String(row.slug ?? '').toLowerCase().includes(term),
        );
      }
      const total = items.length;
      const start = (page - 1) * limit;
      return {
        data: items.slice(start, start + limit),
        meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
      };
    },
  });

  return (
    <ResourceListPage
      title="Videos"
      subtitle="Contenido audiovisual"
      action={<Link to="/videos/new"><Button>+ Nuevo video</Button></Link>}
      keyField="id"
      items={list.items}
      isLoading={list.isLoading}
      isFetching={list.isFetching}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar video…"
      filters={[categoryFilter]}
      filterValues={{ categoryId: categoryId ?? '' }}
      onFilterChange={(_key, value) => setCategoryId(value || undefined)}
      meta={list.meta}
      page={list.page}
      onPageChange={list.setPage}
      emptyMessage="No hay videos que coincidan"
      columns={[
        { key: 'title', label: 'Título' },
        {
          key: 'category',
          label: 'Categoría',
          render: (row) => String((row.category as { name?: string } | null)?.name ?? '—'),
        },
        { key: 'viewCount', label: 'Vistas' },
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
            <Link to={`/videos/${row.id}`} className="font-medium text-gold-dim hover:text-gold">Editar →</Link>
          ),
        },
      ]}
    />
  );
}
