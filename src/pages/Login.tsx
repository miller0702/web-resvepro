import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { authApi } from '../api/auth';
import { saveAuth } from '../lib/auth';
import { getConfig } from '../config/environments';
import { useTheme } from '../providers/ThemeProvider';
import { BrandLogo } from '../components/BrandLogo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function LoginPage() {
  const [login, setLogin] = useState('superadmin@resvepro.local');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { appName, appTagline } = getConfig();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(login, password);
      const { accessToken, refreshToken, user } = res.data.data;
      saveAuth({ accessToken, refreshToken }, user);
      navigate('/');
    } catch {
      setError('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen bg-theme-page">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl border text-theme-secondary transition hover:bg-[var(--color-bg-subtle)]"
        style={{ borderColor: 'var(--color-border)' }}
        aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="relative hidden flex-1 flex-col justify-between bg-ink p-12 text-parchment lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-sage/10" />
        <div className="relative flex flex-col items-start">
          <BrandLogo variant="full" className="h-40 w-auto max-w-sm" />
          <p className="mt-8 max-w-sm text-parchment/60">
            Administra libros, colecciones y lectores de {appName} desde un solo lugar.
          </p>
        </div>
        <p className="relative text-xs uppercase tracking-widest text-parchment/30">{appTagline}</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="glass-card w-full max-w-md space-y-6 p-10">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <BrandLogo variant="icon" className="mb-4 h-16 w-16 lg:hidden" />
            <h1 className="font-display text-3xl text-theme">{appName}</h1>
            <p className="mt-1 text-sm text-theme-secondary">{appTagline}</p>
            <p className="mt-3 text-sm text-theme-muted">Ingresa a tu cuenta de administración</p>
          </div>
          {error && (
            <div className="rounded-xl bg-ember/10 px-4 py-3 text-center text-sm text-ember">{error}</div>
          )}
          <Input
            label="Correo o usuario"
            type="text"
            placeholder="superadmin@resvepro.local o superadmin"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoComplete="username"
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </Button>
        </form>
      </div>
    </div>
  );
}
