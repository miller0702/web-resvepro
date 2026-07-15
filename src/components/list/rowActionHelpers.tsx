import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import type { RowAction } from '../ui/RowActions';
import { confirmDialog } from '../../lib/dialog';
import { resourceEditPath, resourceViewPath } from '../../hooks/useResourceMode';

const ICON = 'h-4 w-4';

type PublishableActionsOpts = {
  editPath: string;
  isPublished: boolean;
  busy?: boolean;
  onTogglePublish: () => void;
  onDelete: () => void;
  entityLabel?: string;
};

export function publishableRowActions(opts: PublishableActionsOpts): RowAction[] {
  const {
    editPath,
    isPublished,
    busy,
    onTogglePublish,
    onDelete,
    entityLabel = 'contenido',
  } = opts;

  return [
    {
      key: 'edit',
      label: 'Editar',
      icon: <Pencil className={ICON} strokeWidth={1.75} />,
      tone: 'edit',
      to: resourceEditPath(editPath),
    },
    {
      key: 'preview',
      label: 'Ver / previsualizar',
      icon: <Eye className={ICON} strokeWidth={1.75} />,
      tone: 'view',
      to: resourceViewPath(editPath),
    },
    {
      key: 'publish',
      label: isPublished ? 'Quitar de la app' : 'Publicar en la app',
      icon: isPublished ? (
        <EyeOff className={ICON} strokeWidth={1.75} />
      ) : (
        <Eye className={ICON} strokeWidth={1.75} />
      ),
      tone: isPublished ? 'warning' : 'success',
      disabled: busy,
      onClick: () => {
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
      },
    },
    {
      key: 'delete',
      label: 'Eliminar',
      icon: <Trash2 className={ICON} strokeWidth={1.75} />,
      tone: 'danger',
      disabled: busy,
      onClick: () => {
        void confirmDialog({
          title: 'Eliminar',
          message: `¿Eliminar este ${entityLabel} de forma permanente? Esta acción no se puede deshacer.`,
          confirmLabel: 'Eliminar',
          tone: 'danger',
        }).then((ok) => {
          if (ok) onDelete();
        });
      },
    },
  ];
}

export function basicResourceRowActions(opts: {
  editPath: string;
  busy?: boolean;
  onDelete: () => void;
  entityLabel?: string;
  /**
   * Si se pasa, «Ver detalle» abre una acción (p. ej. modal) en lugar de navegar a `?mode=view`.
   * Ideal para recursos con pocos campos (autores, categorías, colecciones…).
   */
  onPreview?: () => void;
}): RowAction[] {
  const { editPath, busy, onDelete, entityLabel = 'registro', onPreview } = opts;
  return [
    {
      key: 'edit',
      label: 'Editar',
      icon: <Pencil className={ICON} strokeWidth={1.75} />,
      tone: 'edit',
      to: resourceEditPath(editPath),
    },
    {
      key: 'preview',
      label: 'Ver detalle',
      icon: <Eye className={ICON} strokeWidth={1.75} />,
      tone: 'view',
      ...(onPreview
        ? { onClick: onPreview }
        : { to: resourceViewPath(editPath) }),
    },
    {
      key: 'delete',
      label: 'Eliminar',
      icon: <Trash2 className={ICON} strokeWidth={1.75} />,
      tone: 'danger',
      disabled: busy,
      onClick: () => {
        void confirmDialog({
          title: 'Eliminar',
          message: `¿Eliminar este ${entityLabel} de forma permanente? Esta acción no se puede deshacer.`,
          confirmLabel: 'Eliminar',
          tone: 'danger',
        }).then((ok) => {
          if (ok) onDelete();
        });
      },
    },
  ];
}
