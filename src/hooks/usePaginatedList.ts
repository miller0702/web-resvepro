import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PaginationMeta } from '../types/api';
import { useDebouncedValue } from './useDebouncedValue';

interface UsePaginatedListOptions<T> {
  queryKey: string;
  fetchFn: (params: {
    page: number;
    limit: number;
    search?: string;
    filters: Record<string, string | undefined>;
  }) => Promise<{ data: T[]; meta?: PaginationMeta }>;
  pageSize?: number;
  search?: string;
  filters?: Record<string, string | undefined>;
  enabled?: boolean;
}

export function usePaginatedList<T>({
  queryKey,
  fetchFn,
  pageSize = 20,
  search = '',
  filters = {},
  enabled = true,
}: UsePaginatedListOptions<T>) {
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterKey]);

  const query = useQuery({
    queryKey: [queryKey, page, pageSize, debouncedSearch, filters],
    enabled,
    queryFn: async () => {
      const res = await fetchFn({
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
        filters,
      });
      return res;
    },
  });

  const meta: PaginationMeta = query.data?.meta ?? {
    total: query.data?.data.length ?? 0,
    page,
    limit: pageSize,
    totalPages: 1,
  };

  return {
    items: query.data?.data ?? [],
    meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    page,
    setPage,
    refetch: query.refetch,
  };
}
