import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { BrandLogo } from '../../components/BrandLogo';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getConfig } from '../../config/environments';
import { publicApi } from '../../api/public';

export function AccountDeletionPage() {
  const { appName } = getConfig();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      await publicApi.requestAccountDeletion({ email: email.trim(), message: message.trim() || undefined });
    },
    onSuccess: () => setSubmitted(true),
  });

  return (
    <div className="min-h-screen bg-theme-page">
      <header className="border-b px-4 py-5 sm:px-8" style={{ borderColor: 'var(--color-border)' }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo variant="icon" className="h-10 w-10" />
            <div>
              <p className="font-display text-lg text-theme">{appName}</p>
              <p className="text-sm text-theme-muted">Eliminación de cuenta y datos</p>
            </div>
          </div>
          <Link
            to="/login"
            className="text-sm text-theme-secondary transition hover:text-gold-dim dark:hover:text-gold-light"
          >
            Panel admin
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-12">
        <article className="glass-card space-y-6 p-6 sm:p-10">
          <section className="space-y-3 text-theme-secondary">
            <h1 className="font-display text-2xl text-theme">Solicitar eliminación de cuenta</h1>
            <p>
              Puedes pedir que eliminemos tu cuenta de {appName} y los datos personales asociados.
              También puedes eliminarla directamente desde la app móvil en{' '}
              <strong>Ajustes → Eliminar cuenta</strong> si tienes sesión iniciada.
            </p>
            <p className="text-sm text-theme-muted">
              Tras la eliminación se borran marcadores, progreso, publicaciones y datos de perfil.
              Algunos registros agregados o anonimizados pueden conservarse por obligaciones legales.
            </p>
          </section>

          {submitted ? (
            <div className="rounded-xl bg-sage/10 p-4 text-sm text-theme-secondary dark:bg-sage/15">
              Recibimos tu solicitud. Si existe una cuenta con ese correo, la procesaremos en un plazo
              máximo de 30 días.
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
            >
              <Input
                label="Correo de la cuenta"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-theme-secondary">
                  Mensaje (opcional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder="Motivo o datos adicionales para identificar tu cuenta"
                />
              </div>
              <Button type="submit" disabled={mutation.isPending || !email.trim()}>
                {mutation.isPending ? 'Enviando...' : 'Enviar solicitud'}
              </Button>
            </form>
          )}
        </article>
      </main>
    </div>
  );
}
