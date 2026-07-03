import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { ResourceListPage } from '../components/list/ResourceListPage';
import { Button } from '../components/ui/Button';
import { useClientList } from '../hooks/useClientList';

export function CollectionsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => (await adminApi.getCollections()).data.data as Array<Record<string, unknown>>,
  });

  const list = useClientList({
    items: data ?? [],
    search,
    searchKeys: ['name', 'slug', 'description'],
  });

  return (
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
          key: 'id',
          label: '',
          render: (row) => (
            <Link to={`/collections/${row.id}`} className="font-medium text-gold-dim hover:text-gold">
              Editar →
            </Link>
          ),
        },
      ]}
    />
  );
}
