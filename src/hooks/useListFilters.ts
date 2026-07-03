import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import type { ListFilter } from '../components/list/types';

export function useCategoryFilterOptions(kind: 'BOOK' | 'PODCAST' | 'VIDEO', label = 'Categoría') {
  const query = useQuery({
    queryKey: ['categories', kind],
    queryFn: async () => (await adminApi.getCategories(kind)).data.data,
  });

  const filter: ListFilter = {
    key: 'categoryId',
    label,
    allLabel: 'Todas las categorías',
    options: (query.data ?? []).map((c) => ({
      value: String(c.id),
      label: String(c.name),
    })),
  };

  return { filter, isLoading: query.isLoading, categories: query.data ?? [] };
}

export function useCollectionFilterOptions() {
  const query = useQuery({
    queryKey: ['collections'],
    queryFn: async () => (await adminApi.getCollections()).data.data,
  });

  const filter: ListFilter = {
    key: 'collectionId',
    label: 'Colección',
    allLabel: 'Todas las colecciones',
    options: (query.data ?? []).map((c) => ({
      value: String(c.id),
      label: String(c.name),
    })),
  };

  return { filter, isLoading: query.isLoading };
}

export const CATEGORY_KIND_FILTER: ListFilter = {
  key: 'kind',
  label: 'Tipo',
  allLabel: 'Todos los tipos',
  options: [
    { value: 'BOOK', label: 'Libros' },
    { value: 'PODCAST', label: 'Podcasts' },
    { value: 'VIDEO', label: 'Videos' },
  ],
};

export const PUBLISHED_FILTER: ListFilter = {
  key: 'published',
  label: 'Estado',
  allLabel: 'Todos los estados',
  options: [
    { value: 'published', label: 'Publicados' },
    { value: 'draft', label: 'Borradores' },
  ],
};
