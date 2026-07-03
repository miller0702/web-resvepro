type BadgeVariant = 'success' | 'muted' | 'warning' | 'panel' | 'app';

const styles: Record<BadgeVariant, string> = {
  success: 'bg-sage/15 text-sage dark:bg-sage/20 dark:text-sage-light',
  muted: 'bg-ink/8 text-ink/60 dark:bg-white/10 dark:text-parchment/60',
  warning: 'bg-gold/15 text-gold-dim dark:text-gold-light',
  panel: 'bg-gold/15 text-gold-dim dark:text-gold-light',
  app: 'bg-sage/10 text-sage dark:bg-sage/20 dark:text-sage-light',
};

export function Badge({
  children,
  variant = 'muted',
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}
