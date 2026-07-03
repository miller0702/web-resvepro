import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl tracking-tight text-theme">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-theme-secondary">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
