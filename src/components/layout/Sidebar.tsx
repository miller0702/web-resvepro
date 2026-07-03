import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { getActiveNavGroupId, navGroups } from '../../config/navigation';
import { getConfig } from '../../config/environments';
import { BrandLogo } from '../BrandLogo';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  onLogout: () => void;
}

const STORAGE_KEY = 'egw-admin-nav-expanded';

function readExpandedGroups(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
  onLogout,
}: SidebarProps) {
  const { appName, appTagline } = getConfig();
  const location = useLocation();
  const isCompact = collapsed && !mobileOpen;
  const activeGroupId = getActiveNavGroupId(location.pathname);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const saved = readExpandedGroups();
    const defaults: Record<string, boolean> = {};
    for (const group of navGroups) {
      if (group.collapsible) {
        defaults[group.id] = saved[group.id] ?? (group.id === 'editorial' || group.id === 'multimedia');
      }
    }
    return defaults;
  });

  useEffect(() => {
    if (!activeGroupId) return;
    setExpanded((prev) => {
      const group = navGroups.find((g) => g.id === activeGroupId);
      if (!group?.collapsible || prev[activeGroupId]) return prev;
      return { ...prev, [activeGroupId]: true };
    });
  }, [activeGroupId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expanded));
  }, [expanded]);

  const toggleGroup = (groupId: string) => {
    setExpanded((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const visibleGroups = useMemo(() => navGroups, []);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col bg-ink text-parchment transition-all duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCompact ? 'w-[4.5rem]' : 'w-72'}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent" />

        <div className="relative border-b border-white/10">
          <div className={`flex items-center ${isCompact ? 'flex-col gap-2 p-3' : 'gap-2 p-4'}`}>
            {isCompact ? (
              <>
                <BrandLogo variant="icon" className="h-9 w-9 shrink-0" />
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  title="Expandir menú"
                  aria-label="Expandir menú"
                  className="hidden h-9 w-9 items-center justify-center rounded-lg text-parchment/60 transition hover:bg-white/5 hover:text-parchment lg:inline-flex"
                >
                  <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </>
            ) : (
              <>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <BrandLogo variant="icon" className="h-10 w-10 shrink-0 lg:h-11 lg:w-11" />
                  <div className="min-w-0">
                    <p className="font-display text-lg tracking-wide">{appName}</p>
                    <p className="mt-0.5 text-[10px] uppercase leading-tight tracking-[0.15em] text-parchment/40">
                      {appTagline}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  title="Contraer menú"
                  aria-label="Contraer menú"
                  className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-parchment/60 transition hover:bg-white/5 hover:text-parchment lg:inline-flex"
                >
                  <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </>
            )}
          </div>
          {!isCompact && (
            <p className="px-4 pb-3 text-xs uppercase tracking-[0.2em] text-parchment/30">Panel editorial</p>
          )}
        </div>

        <nav className={`relative flex-1 overflow-y-auto ${isCompact ? 'p-2' : 'p-4'} space-y-4`}>
          {visibleGroups.map((group) => {
            const isCollapsible = group.collapsible && !isCompact;
            const isOpen = !isCollapsible || expanded[group.id] !== false;

            return (
              <div key={group.id}>
                {isCollapsible ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left transition hover:bg-white/5"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-parchment/40">
                      {group.label}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-parchment/40 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                      strokeWidth={2}
                    />
                  </button>
                ) : !isCompact ? (
                  <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-parchment/30">
                    {group.label}
                  </p>
                ) : null}

                {(isCompact || isOpen) && (
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          title={isCompact ? item.label : undefined}
                          onClick={onCloseMobile}
                          className={({ isActive }) =>
                            `flex items-center rounded-xl text-sm font-medium transition ${
                              isCompact ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-2.5'
                            } ${
                              isActive
                                ? 'bg-gold/20 text-gold-light shadow-[inset_0_0_0_1px_rgba(201,162,39,0.25)]'
                                : 'text-parchment/70 hover:bg-white/5 hover:text-parchment'
                            }`
                          }
                        >
                          <Icon className="h-[18px] w-[18px] shrink-0 opacity-80" strokeWidth={1.75} />
                          {!isCompact && <span className="truncate">{item.label}</span>}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className={`relative border-t border-white/10 ${isCompact ? 'p-2' : 'p-4'}`}>
          <button
            type="button"
            onClick={onLogout}
            title="Cerrar sesión"
            className={`flex w-full items-center justify-center gap-2 rounded-xl text-sm text-parchment/60 transition hover:bg-ember/20 hover:text-ember ${
              isCompact ? 'h-10' : 'px-4 py-2.5'
            }`}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            {!isCompact && 'Cerrar sesión'}
          </button>
        </div>
      </aside>
    </>
  );
}
