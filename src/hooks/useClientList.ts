import { useEffect, useMemo, useState } from 'react';
import type { PaginationMeta } from '../types/api';
import { useDebouncedValue } from './useDebouncedValue';

type SearchKey<T> = keyof T | ((row: T) => string);

interface UseClientListOptions<T> {
  items: T[];
  search?: string;
  searchKeys: SearchKey<T>[];
  pageSize?: number;
  filterFn?: (row: T) => boolean;
}

function matchesSearch<T extends Record<string, unknown>>(
  row: T,
  search: string,
  keys: SearchKey<T>[],
): boolean {
  const q = search.toLowerCase().trim();
  if (!q) return true;
  return keys.some((key) => {
    const value = typeof key === 'function' ? key(row) : String(row[key] ?? '');
    return value.toLowerCase().includes(q);
  });
}

export function useClientList<T extends Record<string, unknown>>({
  items,
  search = '',
  searchKeys,
  pageSize = 20,
  filterFn,
}: UseClientListOptions<T>) {
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterFn]);

  const filtered = useMemo(() => {
    return items.filter((row) => {
      if (filterFn && !filterFn(row)) return false;
      return matchesSearch(row, debouncedSearch, searchKeys);
    });
  }, [items, debouncedSearch, searchKeys, filterFn]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const meta: PaginationMeta = {
    total: filtered.length,
    page: safePage,
    limit: pageSize,
    totalPages,
  };

  return {
    items: paged,
    meta,
    totalFiltered: filtered.length,
    page: safePage,
    setPage,
  };
}
