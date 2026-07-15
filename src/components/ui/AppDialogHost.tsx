import { useEffect, useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import {
  resolveDialog,
  setDialogListener,
  type DialogRequest,
  type DialogTone,
} from '../../lib/dialog';
import { Button } from './Button';

function toneStyles(tone: DialogTone = 'default') {
  if (tone === 'danger') {
    return {
      iconWrap: 'bg-ember/15 text-ember',
      Icon: AlertTriangle,
    };
  }
  if (tone === 'warning') {
    return {
      iconWrap: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
      Icon: AlertTriangle,
    };
  }
  return {
    iconWrap: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
    Icon: Info,
  };
}

export function AppDialogHost() {
  const [request, setRequest] = useState<DialogRequest | null>(null);

  useEffect(() => {
    setDialogListener(setRequest);
    return () => setDialogListener(null);
  }, []);

  useEffect(() => {
    if (!request) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') resolveDialog(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [request]);

  if (!request) return null;

  const tone = request.tone ?? (request.mode === 'confirm' ? 'danger' : 'default');
  const { iconWrap, Icon } = toneStyles(tone);
  const title =
    request.title ?? (request.mode === 'confirm' ? 'Confirmar acción' : 'Aviso');

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        onClick={() => resolveDialog(false)}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        aria-describedby="app-dialog-message"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-xl"
      >
        <div className="flex gap-4 p-6">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconWrap}`}>
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="app-dialog-title" className="font-display text-xl text-theme">
              {title}
            </h2>
            <p id="app-dialog-message" className="mt-2 text-sm leading-relaxed text-theme-secondary">
              {request.message}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-6 py-4">
          {request.mode === 'confirm' ? (
            <>
              <Button type="button" variant="ghost" onClick={() => resolveDialog(false)}>
                {request.cancelLabel ?? 'Cancelar'}
              </Button>
              <Button
                type="button"
                variant={tone === 'danger' ? 'danger' : 'primary'}
                onClick={() => resolveDialog(true)}
              >
                {request.confirmLabel ?? 'Confirmar'}
              </Button>
            </>
          ) : (
            <Button type="button" variant="primary" onClick={() => resolveDialog(true)}>
              {request.confirmLabel ?? 'Entendido'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
