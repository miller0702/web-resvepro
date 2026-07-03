import { Menu } from 'lucide-react';
import { getPageTitle } from '../../config/navigation';
import { getConfig } from '../../config/environments';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  pathname: string;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
}

export function Header({ pathname, onOpenMobileMenu, onLogout }: HeaderProps) {
  const { appName } = getConfig();
  const title = getPageTitle(pathname);

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur-md"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-bg-page) 92%, transparent)',
        borderColor: 'var(--color-border-subtle)',
      }}
    >
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-theme-secondary transition hover:bg-[var(--color-bg-subtle)] lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <div className="min-w-0">
            <p className="truncate text-xs uppercase tracking-[0.18em] text-theme-muted">{appName}</p>
            <h1 className="truncate font-display text-xl text-theme sm:text-2xl">{title}</h1>
          </div>
        </div>

        <UserMenu onLogout={onLogout} />
      </div>
    </header>
  );
}
