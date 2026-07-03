import { Link } from 'react-router-dom';
import { getConfig } from '../../config/environments';

export function Footer() {
  const { appName, appTagline } = getConfig();
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-auto border-t px-4 py-4 sm:px-6 lg:px-8"
      style={{
        borderColor: 'var(--color-border-subtle)',
        backgroundColor: 'color-mix(in srgb, var(--color-bg-page) 88%, var(--color-bg-subtle))',
      }}
    >
      <div className="mx-auto flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-base text-theme">{appName}</p>
          <p className="mt-0.5 text-sm text-theme-muted">
            © {year} · {appTagline}
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link to="/settings" className="text-theme-secondary transition hover:text-gold-dim dark:hover:text-gold-light">
            Configuración
          </Link>
          <Link to="/moderation" className="text-theme-secondary transition hover:text-gold-dim dark:hover:text-gold-light">
            Moderación
          </Link>
          <Link to="/requirements" className="text-theme-secondary transition hover:text-gold-dim dark:hover:text-gold-light">
            Requerimientos
          </Link>
          <Link to="/settings" className="text-theme-secondary transition hover:text-gold-dim dark:hover:text-gold-light">
            Términos y políticas
          </Link>
        </nav>
      </div>
    </footer>
  );
}
