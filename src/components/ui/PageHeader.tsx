import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** Ruta a la que vuelve el botón de atrás; `true` usa el historial del navegador. */
  backTo?: string | true;
}

function BackButton({ backTo }: Readonly<{ backTo: string | true }>) {
  const navigate = useNavigate();
  const className =
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-theme text-theme-secondary transition hover:bg-gold/10 hover:text-theme';

  if (backTo === true) {
    return (
      <button type="button" onClick={() => navigate(-1)} className={className} aria-label="Volver" title="Volver">
        <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
      </button>
    );
  }

  return (
    <Link to={backTo} className={className} aria-label="Volver" title="Volver">
      <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
    </Link>
  );
}

export function PageHeader({ title, subtitle, action, backTo }: Readonly<PageHeaderProps>) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-3">
        {backTo != null && <BackButton backTo={backTo} />}
        <div>
          <h1 className="font-display text-3xl tracking-tight text-theme">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-theme-secondary">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
