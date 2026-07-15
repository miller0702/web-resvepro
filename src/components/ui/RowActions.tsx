import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

export type RowAction = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  /**
   * edit = ámbar, view = azul, success = verde, warning = ámbar, danger = rojo,
   * info = índigo, muted = neutro
   */
  tone?: 'default' | 'edit' | 'view' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  hidden?: boolean;
};

type RowActionsProps = {
  label?: string;
  actions: RowAction[];
};

function resolveTone(action: RowAction): NonNullable<RowAction['tone']> {
  if (action.tone && action.tone !== 'default') return action.tone;
  const key = action.key.toLowerCase();
  if (key.includes('edit') || key.includes('pencil')) return 'edit';
  if (key.includes('preview') || key.includes('view') || key === 'ver') return 'view';
  if (key.includes('delete') || key.includes('trash') || key.includes('remove')) return 'danger';
  if (key.includes('block') || key.includes('restrict') || key.includes('unpublish')) return 'warning';
  if (key.includes('publish') || key.includes('unlock') || key.includes('allow')) return 'success';
  if (key.includes('impersonat')) return 'info';
  return 'muted';
}

function toneClasses(tone: NonNullable<RowAction['tone']>) {
  switch (tone) {
    case 'edit':
      return 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300';
    case 'view':
      return 'bg-sky-500/15 text-sky-700 hover:bg-sky-500/25 dark:text-sky-300';
    case 'success':
      return 'bg-sage/15 text-sage hover:bg-sage/25';
    case 'warning':
      return 'bg-amber-500/15 text-amber-800 hover:bg-amber-500/25 dark:text-amber-200';
    case 'danger':
      return 'bg-ember/15 text-ember hover:bg-ember/25';
    case 'info':
      return 'bg-indigo-500/15 text-indigo-700 hover:bg-indigo-500/25 dark:text-indigo-300';
    case 'muted':
    default:
      return 'bg-[var(--color-bg-subtle)] text-theme-secondary hover:bg-[var(--color-border)]/40 hover:text-theme';
  }
}

function PortalTooltip({
  anchor,
  label,
}: {
  anchor: HTMLElement | null;
  label: string;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!anchor) {
      setPos(null);
      return;
    }
    const update = () => {
      const rect = anchor.getBoundingClientRect();
      setPos({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [anchor]);

  if (!anchor || !pos) return null;

  return createPortal(
    <span
      role="tooltip"
      className="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-[var(--color-ink,#1a1a1a)] px-2 py-1 text-[11px] font-medium text-white shadow-md dark:bg-zinc-800"
      style={{ top: pos.top, left: pos.left }}
    >
      {label}
    </span>,
    document.body,
  );
}

function ActionButton({ action, className }: { action: RowAction; className: string }) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const icon = action.icon ?? <span className="text-xs font-semibold">{action.label[0]}</span>;

  const tipHandlers = {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
  };

  return (
    <>
      {action.to ? (
        <Link
          to={action.to}
          aria-label={action.label}
          className={className}
          ref={setNode}
          {...tipHandlers}
        >
          {icon}
        </Link>
      ) : (
        <button
          type="button"
          aria-label={action.label}
          disabled={action.disabled}
          className={className}
          ref={setNode}
          onClick={() => action.onClick?.()}
          {...tipHandlers}
        >
          {icon}
        </button>
      )}
      {open ? <PortalTooltip anchor={node} label={action.label} /> : null}
    </>
  );
}

export function RowActions({ label = 'Acciones', actions }: RowActionsProps) {
  const visible = actions.filter((a) => !a.hidden);

  if (visible.length === 0) return <span className="text-theme-muted">—</span>;

  return (
    <div className="inline-flex items-center justify-end gap-1.5" aria-label={label}>
      {visible.map((action) => {
        const tone = resolveTone(action);
        const className = `inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent transition disabled:cursor-not-allowed disabled:opacity-40 ${toneClasses(tone)}`;
        return <ActionButton key={action.key} action={action} className={className} />;
      })}
    </div>
  );
}
