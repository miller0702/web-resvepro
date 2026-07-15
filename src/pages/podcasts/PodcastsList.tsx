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

export function PodcastsListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const { filter: categoryFilter } = useCategoryFilterOptions('PODCAST');

  const list = usePaginatedList<Record<string, unknown>>({
    queryKey: 'podcasts',
    search,
    filters: { categoryId },
    fetchFn: async ({ page, limit, search: q, filters }) => {
      const res = await adminApi.getPodcasts({ categoryId: filters.categoryId });
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
      adminApi.updatePodcast(id, { isPublished }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['podcasts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deletePodcast(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['podcasts'] }),
  });

  const busy = publishMutation.isPending || deleteMutation.isPending;

  return (
    <ResourceListPage
      title="Podcasts"
      subtitle="Series y episodios de audio"
      action={
        <Link to="/podcasts/new">
          <Button>+ Nuevo podcast</Button>
        </Link>
      }
      keyField="id"
      items={list.items}
      isLoading={list.isLoading}
      isFetching={list.isFetching}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar podcast…"
      filters={[categoryFilter]}
      filterValues={{ categoryId: categoryId ?? '' }}
      onFilterChange={(_key, value) => setCategoryId(value || undefined)}
      meta={list.meta}
      page={list.page}
      onPageChange={list.setPage}
      emptyMessage="No hay podcasts que coincidan"
      columns={[
        { key: 'title', label: 'Título' },
        {
          key: 'category',
          label: 'Categoría',
          render: (row) => String((row.category as { name?: string } | null)?.name ?? '—'),
        },
        { key: 'episodeCount', label: 'Episodios' },
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
                  editPath: `/podcasts/${id}`,
                  isPublished: published,
                  busy,
                  entityLabel: 'podcast',
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
