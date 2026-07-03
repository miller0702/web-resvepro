import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { logout, isImpersonating, getUser } from '../../lib/auth';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';

const SIDEBAR_KEY = 'admin:sidebar-collapsed';

export function AppShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) === 'true',
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-theme-page">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={handleLogout}
      />

      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-in-out ${
          collapsed ? 'lg:ml-[4.5rem]' : 'lg:ml-72'
        }`}
      >
        <Header pathname={pathname} onOpenMobileMenu={() => setMobileOpen(true)} onLogout={handleLogout} />

        {isImpersonating() && (
          <div className="border-b bg-ember/10 px-4 py-2 text-center text-sm text-ember sm:px-6 lg:px-8">
            Personificando a <strong>{getUser()?.email}</strong>. Las acciones quedan registradas en auditoría.
          </div>
        )}

        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
