import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import {
  dismissToast,
  setToastListener,
  type ToastItem,
  type ToastTone,
} from '../../lib/toast';

function toneStyles(tone: ToastTone) {
  switch (tone) {
    case 'success':
      return {
        wrap: 'border-sage/30 bg-sage/10 text-theme',
        icon: 'text-sage',
        Icon: CheckCircle2,
      };
    case 'error':
      return {
        wrap: 'border-ember/30 bg-ember/10 text-theme',
        icon: 'text-ember',
        Icon: XCircle,
      };
    case 'warning':
      return {
        wrap: 'border-amber-500/30 bg-amber-500/10 text-theme',
        icon: 'text-amber-700 dark:text-amber-300',
        Icon: AlertTriangle,
      };
    default:
      return {
        wrap: 'border-sky-500/30 bg-sky-500/10 text-theme',
        icon: 'text-sky-700 dark:text-sky-300',
        Icon: Info,
      };
  }
}

export function AppToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    setToastListener(setItems);
    return () => setToastListener(null);
  }, []);

  if (!items.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex flex-col items-end gap-2 p-4 sm:p-6"
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((item) => {
        const { wrap, icon, Icon } = toneStyles(item.tone);
        return (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-sm ${wrap}`}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${icon}`} strokeWidth={1.75} />
            <div className="min-w-0 flex-1">
              {item.title ? (
                <p className="text-sm font-semibold text-theme">{item.title}</p>
              ) : null}
              <p className={`text-sm leading-relaxed text-theme-secondary ${item.title ? 'mt-0.5' : ''}`}>
                {item.message}
              </p>
            </div>
            <button
              type="button"
              aria-label="Cerrar aviso"
              className="shrink-0 rounded-lg p-1 text-theme-muted transition hover:bg-black/5 hover:text-theme dark:hover:bg-white/10"
              onClick={() => dismissToast(item.id)}
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
