import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { ResourceListPage } from '../../components/list/ResourceListPage';
import { publishableRowActions } from '../../components/list/rowActionHelpers';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { RowActions } from '../../components/ui/RowActions';
import { useClientList } from '../../hooks/useClientList';
import { PUBLISHED_FILTER } from '../../hooks/useListFilters';

export function RadioListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [published, setPublished] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['radio'],
    queryFn: async () =>
      (await adminApi.getRadioStations()).data.data as Array<Record<string, unknown>>,
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      adminApi.updateRadio(id, { isPublished }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['radio'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteRadio(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['radio'] }),
  });

  const list = useClientList({
    items: data ?? [],
    search,
    searchKeys: ['name', 'slug', 'streamUrl', 'description'],
    filterFn: (row) => {
      if (!published) return true;
      const isPub = Boolean(row.isPublished);
      return published === 'published' ? isPub : !isPub;
    },
  });

  const busy = publishMutation.isPending || deleteMutation.isPending;

  return (
    <ResourceListPage
      title="Radio"
      subtitle="Emisoras en vivo"
      action={
        <Link to="/radio/new">
          <Button>+ Nueva emisora</Button>
        </Link>
      }
      keyField="id"
      items={list.items}
      isLoading={isLoading}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar emisora…"
      filters={[PUBLISHED_FILTER]}
      filterValues={{ published: published ?? '' }}
      onFilterChange={(_key, value) => setPublished(value || undefined)}
      meta={list.meta}
      page={list.page}
      onPageChange={list.setPage}
      emptyMessage="No hay emisoras que coincidan"
      columns={[
        { key: 'name', label: 'Nombre' },
        {
          key: 'streamUrl',
          label: 'Stream URL',
          render: (row) => (
            <span className="max-w-xs truncate block">{String(row.streamUrl ?? '')}</span>
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
            const isPublished = Boolean(row.isPublished);
            return (
              <RowActions
                actions={publishableRowActions({
                  editPath: `/radio/${id}`,
                  isPublished,
                  busy,
                  entityLabel: 'emisora',
                  onTogglePublish: () =>
                    publishMutation.mutate({ id, isPublished: !isPublished }),
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
