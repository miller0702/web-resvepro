import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '../../types/api';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.totalPages <= 1) return null;

  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-theme-secondary">
        Mostrando {from}–{to} de {meta.total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-theme text-theme-secondary transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[7rem] px-3 text-center text-sm text-theme-secondary">
          Página {meta.page} de {meta.totalPages}
        </span>
        <button
          type="button"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-theme text-theme-secondary transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
