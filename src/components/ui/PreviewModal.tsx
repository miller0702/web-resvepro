import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, X } from 'lucide-react';
import { Button } from './Button';
import { confirmDialog } from '../../lib/dialog';

type PreviewModalProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  editPath?: string;
  entityLabel?: string;
  busy?: boolean;
  onDelete?: () => void;
};

/** Modal de previsualización para recursos simples (pocos campos). */
export function PreviewModal({
  open,
  title,
  subtitle = 'Vista de detalle',
  onClose,
  children,
  editPath,
  entityLabel = 'registro',
  busy,
  onDelete,
}: PreviewModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      onClick={onClose}
    >
      <div
        className="glass-card max-h-[85vh] w-full max-w-lg overflow-y-auto p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="preview-modal-title" className="font-display text-2xl tracking-tight text-theme">
              {title}
            </h2>
            {subtitle ? <p className="mt-1 text-sm text-theme-secondary">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-theme-muted transition hover:bg-[var(--color-bg-subtle)] hover:text-theme"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="space-y-5">{children}</div>

        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-5">
          {editPath ? (
            <Link to={editPath} onClick={onClose}>
              <Button type="button" size="sm">
                <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                Editar
              </Button>
            </Link>
          ) : null}
          {onDelete ? (
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={busy}
              onClick={() => {
                void confirmDialog({
                  title: 'Eliminar',
                  message: `¿Eliminar este ${entityLabel} de forma permanente? Esta acción no se puede deshacer.`,
                  confirmLabel: 'Eliminar',
                  tone: 'danger',
                }).then((ok) => {
                  if (!ok) return;
                  onDelete();
                  onClose();
                });
              }}
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              Eliminar
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="ghost" onClick={onClose} className="ml-auto">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
