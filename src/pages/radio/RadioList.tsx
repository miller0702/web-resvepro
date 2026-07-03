import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { ResourceListPage } from '../../components/list/ResourceListPage';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useClientList } from '../../hooks/useClientList';
import { PUBLISHED_FILTER } from '../../hooks/useListFilters';

export function RadioListPage() {
  const [search, setSearch] = useState('');
  const [published, setPublished] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['radio'],
    queryFn: async () => (await adminApi.getRadioStations()).data.data as Array<Record<string, unknown>>,
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

  return (
    <ResourceListPage
      title="Radio"
      subtitle="Emisoras en vivo"
      action={<Link to="/radio/new"><Button>+ Nueva emisora</Button></Link>}
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
              {row.isPublished ? 'Publicado' : 'Borrador'}
            </Badge>
          ),
        },
        {
          key: 'id',
          label: '',
          render: (row) => (
            <Link to={`/radio/${row.id}`} className="font-medium text-gold-dim hover:text-gold">Editar →</Link>
          ),
        },
      ]}
    />
  );
}
