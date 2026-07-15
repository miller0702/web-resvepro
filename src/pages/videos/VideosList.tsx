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
import { useCategoryFilterOptions } from '../../hooks/useListFilters';

export function VideosListPage() {
  const queryClient = useQueryClient();
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
        items = items.filter(
          (row) =>
            String(row.title ?? '')
              .toLowerCase()
              .includes(term) ||
            String(row.slug ?? '')
              .toLowerCase()
              .includes(term),
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

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      adminApi.updateVideo(id, { isPublished }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['videos'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteVideo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['videos'] }),
  });

  const busy = publishMutation.isPending || deleteMutation.isPending;

  return (
    <ResourceListPage
      title="Videos"
      subtitle="Contenido audiovisual"
      action={
        <Link to="/videos/new">
          <Button>+ Nuevo video</Button>
        </Link>
      }
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
                  editPath: `/videos/${id}`,
                  isPublished: published,
                  busy,
                  entityLabel: 'video',
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
