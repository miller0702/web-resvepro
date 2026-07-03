import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { ResourceListPage } from '../components/list/ResourceListPage';
import { Button } from '../components/ui/Button';
import { useClientList } from '../hooks/useClientList';
import { CATEGORY_KIND_FILTER } from '../hooks/useListFilters';

export function CategoriesPage() {
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await adminApi.getCategories()).data.data as Array<Record<string, unknown>>,
  });

  const list = useClientList({
    items: data ?? [],
    search,
    searchKeys: ['name', 'slug', 'kind'],
    filterFn: (row) => !kind || String(row.kind) === kind,
  });

  return (
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
          key: 'id',
          label: '',
          render: (row) => (
            <Link to={`/categories/${row.id}`} className="font-medium text-gold-dim hover:text-gold">
              Editar →
            </Link>
          ),
        },
      ]}
    />
  );
}
