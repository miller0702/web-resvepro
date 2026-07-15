import type { ReactNode } from 'react';

export function DetailSection({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass-card w-full space-y-5 p-6 sm:p-8 ${className}`}>
      {title ? <h2 className="font-display text-xl text-theme">{title}</h2> : null}
      {children}
    </section>
  );
}

export function DetailGrid({ children }: { children: ReactNode }) {
  return <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">{children}</dl>;
}

export function DetailField({
  label,
  children,
  empty = '—',
  span = 1,
}: {
  label: string;
  children?: ReactNode;
  empty?: string;
  /** span=2 ocupa el ancho completo en la grilla */
  span?: 1 | 2;
}) {
  const content =
    children === null || children === undefined || children === '' ? (
      <span className="text-theme-muted">{empty}</span>
    ) : (
      children
    );

  return (
    <div className={span === 2 ? 'sm:col-span-2' : undefined}>
      <dt className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-theme-muted">
        {label}
      </dt>
      <dd className="text-[15px] leading-relaxed text-theme">{content}</dd>
    </div>
  );
}

export function DetailFlags({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

export function DetailAsset({
  label,
  name,
  href,
}: {
  label: string;
  name?: string | null;
  href?: string | null;
}) {
  return (
    <DetailField label={label}>
      {name || href ? (
        href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-gold-dim underline-offset-2 hover:underline dark:text-gold-light"
          >
            {name ?? 'Abrir archivo'}
          </a>
        ) : (
          <span>{name}</span>
        )
      ) : null}
    </DetailField>
  );
}
