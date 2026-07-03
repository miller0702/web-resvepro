import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  LogOut,
  Moon,
  ScrollText,
  Sun,
  UserCog,
  UserRound,
  VenetianMask,
} from 'lucide-react';
import { useTheme } from '../../providers/ThemeProvider';
import {
  getUser,
  getUserInitials,
  isImpersonating,
  restoreImpersonatorSession,
} from '../../lib/auth';
import { getUserDisplayRole, isSuperAdmin } from '../../lib/rbac';
import { adminApi } from '../../api/admin';

interface UserMenuProps {
  onLogout: () => void;
}

export function UserMenu({ onLogout }: UserMenuProps) {
  const { theme, toggleTheme } = useTheme();
  const user = getUser();
  const [open, setOpen] = useState(false);
  const [stopping, setStopping] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const impersonating = isImpersonating();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const stopImpersonation = async () => {
    setStopping(true);
    try {
      const res = await adminApi.stopImpersonation();
      const { accessToken, refreshToken, user: nextUser } = res.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(nextUser));
      localStorage.removeItem('impersonatorSession');
      window.location.href = '/';
    } catch {
      if (restoreImpersonatorSession()) {
        window.location.href = '/';
      }
    } finally {
      setStopping(false);
      setOpen(false);
    }
  };

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Usuario';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border px-2 py-1.5 transition hover:bg-[var(--color-bg-subtle)] sm:px-3 sm:py-2"
        style={{ borderColor: 'var(--color-border)' }}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            impersonating
              ? 'bg-ember/15 text-ember'
              : 'bg-gold/15 text-gold-dim dark:text-gold-light'
          }`}
        >
          {getUserInitials(user)}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-[160px] truncate text-sm font-medium text-theme">
            {displayName}
          </span>
          <span className="block max-w-[160px] truncate text-xs text-theme-muted">
            {impersonating ? 'Personificando' : getUserDisplayRole(user?.roles)}
          </span>
        </span>
        <ChevronDown
          className={`hidden h-4 w-4 text-theme-muted transition sm:block ${open ? 'rotate-180' : ''}`}
          strokeWidth={1.75}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border shadow-lg"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-bg-elevated)',
          }}
        >
          <div className="border-b px-4 py-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
            <p className="truncate text-sm font-medium text-theme">{displayName}</p>
            <p className="truncate text-xs text-theme-muted">{user?.email}</p>
            {impersonating && (
              <p className="mt-1 text-xs font-medium text-ember">Sesión de personificación activa</p>
            )}
          </div>

          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                toggleTheme();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-theme-secondary transition hover:bg-[var(--color-bg-subtle)]"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.75} />
              )}
              {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            </button>

            <Link
              to="/users"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-theme-secondary transition hover:bg-[var(--color-bg-subtle)]"
            >
              <UserRound className="h-4 w-4" strokeWidth={1.75} />
              Usuarios
            </Link>

            {isSuperAdmin(user?.roles) && (
              <Link
                to="/audit"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-theme-secondary transition hover:bg-[var(--color-bg-subtle)]"
              >
                <ScrollText className="h-4 w-4" strokeWidth={1.75} />
                Auditoría
              </Link>
            )}

            {impersonating ? (
              <button
                type="button"
                role="menuitem"
                disabled={stopping}
                onClick={stopImpersonation}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ember transition hover:bg-ember/10 disabled:opacity-60"
              >
                <UserCog className="h-4 w-4" strokeWidth={1.75} />
                {stopping ? 'Restaurando…' : 'Terminar personificación'}
              </button>
            ) : (
              isSuperAdmin(user?.roles) && (
                <Link
                  to="/users?tab=app"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-theme-secondary transition hover:bg-[var(--color-bg-subtle)]"
                >
                  <VenetianMask className="h-4 w-4" strokeWidth={1.75} />
                  Personificar lector
                </Link>
              )
            )}

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ember transition hover:bg-ember/10"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
