import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type LoadingContextValue = {
  isLoading: boolean;
  message: string | null;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  withLoading: <T>(promise: Promise<T>, message?: string) => Promise<T>;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const messageStack = useRef<string[]>([]);

  const showLoading = useCallback((nextMessage = 'Cargando…') => {
    messageStack.current.push(nextMessage);
    setMessage(nextMessage);
    setCount((c) => c + 1);
  }, []);

  const hideLoading = useCallback(() => {
    messageStack.current.pop();
    setMessage(messageStack.current[messageStack.current.length - 1] ?? null);
    setCount((c) => Math.max(0, c - 1));
  }, []);

  const withLoading = useCallback(
    async <T,>(promise: Promise<T>, nextMessage?: string) => {
      showLoading(nextMessage);
      try {
        return await promise;
      } finally {
        hideLoading();
      }
    },
    [showLoading, hideLoading],
  );

  const value = useMemo<LoadingContextValue>(
    () => ({
      isLoading: count > 0,
      message,
      showLoading,
      hideLoading,
      withLoading,
    }),
    [count, message, showLoading, hideLoading, withLoading],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {count > 0 ? (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center bg-ink/40 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex min-w-[220px] flex-col items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-8 py-6 shadow-xl">
            <span className="h-9 w-9 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
            <p className="text-sm font-medium text-theme">{message ?? 'Cargando…'}</p>
          </div>
        </div>
      ) : null}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading debe usarse dentro de LoadingProvider');
  return ctx;
}
