export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export type ToastItem = {
  id: string;
  tone: ToastTone;
  title?: string;
  message: string;
  durationMs: number;
};

type Listener = (items: ToastItem[]) => void;

const DEFAULT_DURATION: Record<ToastTone, number> = {
  success: 3500,
  info: 4000,
  warning: 5000,
  error: 6000,
};

let items: ToastItem[] = [];
let listener: Listener | null = null;
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function publish() {
  listener?.([...items]);
}

function removeToast(id: string) {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  items = items.filter((t) => t.id !== id);
  publish();
}

function pushToast(tone: ToastTone, message: string, title?: string, durationMs?: number) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const toast: ToastItem = {
    id,
    tone,
    title,
    message,
    durationMs: durationMs ?? DEFAULT_DURATION[tone],
  };
  items = [...items, toast].slice(-5);
  publish();
  if (toast.durationMs > 0) {
    timers.set(
      id,
      setTimeout(() => removeToast(id), toast.durationMs),
    );
  }
  return id;
}

export function setToastListener(next: Listener | null) {
  listener = next;
  publish();
}

export function dismissToast(id: string) {
  removeToast(id);
}

export function clearToasts() {
  for (const id of timers.keys()) {
    clearTimeout(timers.get(id));
  }
  timers.clear();
  items = [];
  publish();
}

/** API imperativa (usable fuera de React, p. ej. interceptores). */
export const toast = {
  success: (message: string, title = 'Listo') => pushToast('success', message, title),
  error: (message: string, title = 'Error') => pushToast('error', message, title),
  warning: (message: string, title = 'Atención') => pushToast('warning', message, title),
  info: (message: string, title = 'Información') => pushToast('info', message, title),
  dismiss: dismissToast,
  clear: clearToasts,
};
