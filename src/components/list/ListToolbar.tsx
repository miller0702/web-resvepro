import { Search } from 'lucide-react';
import type { ListFilter } from './types';

interface ListToolbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ListFilter[];
  filterValues?: Record<string, string | undefined>;
  onFilterChange?: (key: string, value: string) => void;
  isFetching?: boolean;
  resultCount?: number;
}

export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar…',
  filters = [],
  filterValues = {},
  onFilterChange,
  isFetching,
  resultCount,
}: ListToolbarProps) {
  const showSearch = onSearchChange !== undefined;
  const showFilters = filters.length > 0 && onFilterChange;

  if (!showSearch && !showFilters) return null;

  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-row flex-wrap items-center gap-2">
        {showSearch ? (
          <div className="relative min-w-[12rem] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted"
              strokeWidth={1.75}
            />
            <input
              type="search"
              value={search ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="input-field w-full pl-10"
              aria-label="Buscar"
            />
          </div>
        ) : null}

        {showFilters
          ? filters.map((filter) => (
              <select
                key={filter.key}
                value={filterValues[filter.key] ?? ''}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                className="input-field w-auto min-w-[9.5rem] shrink-0 py-2 text-sm"
                aria-label={filter.label}
              >
                <option value="">{filter.allLabel ?? `Todas: ${filter.label}`}</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))
          : null}
      </div>

      {(resultCount !== undefined || isFetching) && (
        <p className="text-xs text-theme-muted">
          {isFetching ? 'Actualizando…' : `${resultCount ?? 0} resultado${resultCount === 1 ? '' : 's'}`}
        </p>
      )}
    </div>
  );
}
