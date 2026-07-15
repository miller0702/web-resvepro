import { useMemo, type ReactNode } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { confirmDialog } from '../lib/dialog';

/** Añade `mode=view` a una ruta (con o sin query existente). */
export function resourceViewPath(basePath: string): string {
  const [path, query = ''] = basePath.split('?');
  const params = new URLSearchParams(query);
  params.set('mode', 'view');
  return `${path}?${params.toString()}`;
}

/** Quita `mode=view` de una ruta. */
export function resourceEditPath(basePath: string): string {
  const [path, query = ''] = basePath.split('?');
  const params = new URLSearchParams(query);
  params.delete('mode');
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function useResourceMode() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isView = searchParams.get('mode') === 'view';

  const editHref = useMemo(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('mode');
    const qs = next.toString();
    return `${location.pathname}${qs ? `?${qs}` : ''}`;
  }, [location.pathname, searchParams]);

  return { isView, editHref };
}

type ResourceModeHeaderActionProps = {
  isView: boolean;
  editHref: string;
  /** Badge u otro contenido a la derecha. */
  extra?: ReactNode;
  /** Solo en modo vista: publicar / quitar de la app. */
  isPublished?: boolean;
  onTogglePublish?: () => void;
  /** Solo en modo vista: eliminar. */
  onDelete?: () => void;
  entityLabel?: string;
  busy?: boolean;
};

/**
 * Acciones de cabecera en modo vista: Editar, Publicar/Quitar de la app, Eliminar.
 * En modo edición solo muestra `extra` (p. ej. badge).
 */
export function ResourceModeHeaderAction({
  isView,
  editHref,
  extra,
  isPublished,
  onTogglePublish,
  onDelete,
  entityLabel = 'contenido',
  busy,
}: ResourceModeHeaderActionProps) {
  if (!isView && !extra) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {extra}
      {isView ? (
        <>
          <Link to={editHref}>
            <Button type="button" size="sm">
              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
              Editar
            </Button>
          </Link>
          {onTogglePublish ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              className={
                isPublished
                  ? '!bg-amber-500/15 !text-amber-800 hover:!bg-amber-500/25 dark:!text-amber-200'
                  : '!bg-sage/15 !text-sage hover:!bg-sage/25'
              }
              onClick={() => {
                void confirmDialog({
                  title: isPublished ? 'Quitar de la app' : 'Publicar en la app',
                  message: isPublished
                    ? `¿Quitar este ${entityLabel} de la app? Pasará a borrador.`
                    : `¿Publicar este ${entityLabel} en la app?`,
                  confirmLabel: isPublished ? 'Quitar' : 'Publicar',
                  tone: isPublished ? 'warning' : 'default',
                }).then((ok) => {
                  if (ok) onTogglePublish();
                });
              }}
            >
              {isPublished ? (
                <EyeOff className="h-3.5 w-3.5" strokeWidth={2} />
              ) : (
                <Eye className="h-3.5 w-3.5" strokeWidth={2} />
              )}
              {isPublished ? 'Quitar de la app' : 'Publicar en la app'}
            </Button>
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
                  if (ok) onDelete();
                });
              }}
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              Eliminar
            </Button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
