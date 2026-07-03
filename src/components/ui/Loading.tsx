export function Loading({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      <p className="text-sm text-theme-secondary">{label}</p>
    </div>
  );
}
