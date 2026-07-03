import type { ReactNode } from 'react';
import type { PaginationMeta } from '../../types/api';

export interface ListFilter {
  key: string;
  label: string;
  allLabel?: string;
  options: { value: string; label: string }[];
}

export interface TableColumn<T extends Record<string, unknown>> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => ReactNode;
}

export interface ResourceListPageProps<T extends Record<string, unknown>> {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  columns: TableColumn<T>[];
  keyField: keyof T;
  items: T[];
  isLoading?: boolean;
  isFetching?: boolean;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ListFilter[];
  filterValues?: Record<string, string | undefined>;
  onFilterChange?: (key: string, value: string) => void;
  meta?: PaginationMeta;
  page?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
  toolbarExtra?: ReactNode;
}
