import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { toast as toastApi } from '../lib/toast';
import { AppToastHost } from '../components/ui/AppToastHost';

type ToastApi = typeof toastApi;

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => toastApi, []);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <AppToastHost />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}

/** Atajo tipado para mensajes frecuentes de formularios. */
export function useToastActions() {
  const toast = useToast();
  return {
    toast,
    saved: useCallback((entity = 'Cambios') => toast.success(`${entity} guardados correctamente.`), [toast]),
    deleted: useCallback((entity = 'Elemento') => toast.success(`${entity} eliminado.`), [toast]),
    failed: useCallback(
      (message = 'No se pudo completar la acción. Intenta de nuevo.') => toast.error(message),
      [toast],
    ),
  };
}
