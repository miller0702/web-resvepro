import { DataTable } from '../DataTable';
import { PageHeader } from '../ui/PageHeader';
import { Loading } from '../ui/Loading';
import { ListToolbar } from './ListToolbar';
import { Pagination } from './Pagination';
import type { ResourceListPageProps } from './types';

export function ResourceListPage<T extends Record<string, unknown>>({
  title,
  subtitle,
  action,
  columns,
  keyField,
  items,
  isLoading,
  isFetching,
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  filterValues,
  onFilterChange,
  meta,
  page,
  onPageChange,
  emptyMessage = 'Sin registros',
  toolbarExtra,
}: ResourceListPageProps<T>) {
  const showPagination = meta && onPageChange && page !== undefined && meta.totalPages > 1;

  return (
    <div className="w-full">
      <PageHeader title={title} subtitle={subtitle} action={action} />

      {toolbarExtra}

      <ListToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={onFilterChange}
        isFetching={isFetching}
        resultCount={meta?.total ?? items.length}
      />

      {isLoading ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="glass-card w-full px-5 py-16 text-center text-theme-muted">{emptyMessage}</div>
      ) : (
        <>
          <DataTable keyField={keyField} data={items} columns={columns} />
          {showPagination ? (
            <Pagination meta={meta} onPageChange={onPageChange} />
          ) : null}
        </>
      )}
    </div>
  );
}
