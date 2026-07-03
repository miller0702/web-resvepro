import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { ResourceListPage } from '../components/list/ResourceListPage';
import { Button } from '../components/ui/Button';
import { useClientList } from '../hooks/useClientList';

export function AuthorsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['authors'],
    queryFn: async () =>
      (await adminApi.getAuthors()).data.data as Array<{
        id: string;
        name: string;
        bio?: string;
        bookCount: number;
      }>,
  });

  const list = useClientList({
    items: (data ?? []) as Record<string, unknown>[],
    search,
    searchKeys: ['name', 'bio'],
  });

  return (
    <ResourceListPage
      title="Autores"
      subtitle="Gestiona autores de libros y podcasts"
      action={
        <Link to="/authors/new">
          <Button>+ Nuevo autor</Button>
        </Link>
      }
      keyField="id"
      items={list.items}
      isLoading={isLoading}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar autor…"
      meta={list.meta}
      page={list.page}
      onPageChange={list.setPage}
      emptyMessage="No hay autores que coincidan"
      columns={[
        { key: 'name', label: 'Nombre' },
        { key: 'bookCount', label: 'Libros' },
        {
          key: 'bio',
          label: 'Biografía',
          render: (row) => (
            <span className="line-clamp-2 text-theme-muted">
              {String(row.bio ?? '—')}
            </span>
          ),
        },
        {
          key: 'id',
          label: '',
          render: (row) => (
            <Link to={`/authors/${row.id}`} className="font-medium text-gold-dim hover:text-gold">
              Editar →
            </Link>
          ),
        },
      ]}
    />
  );
}
