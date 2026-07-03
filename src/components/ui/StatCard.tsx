interface StatCardProps {
  label: string;
  value: number | string | undefined;
  icon: string;
  accent?: 'gold' | 'sage' | 'ember' | 'ink';
}

const accents = {
  gold: 'from-gold/20 to-gold/5 text-gold-dim dark:text-gold-light',
  sage: 'from-sage/20 to-sage/5 text-sage',
  ember: 'from-ember/20 to-ember/5 text-ember',
  ink: 'from-ink/10 to-ink/5 text-ink dark:from-white/10 dark:to-white/5 dark:text-parchment',
};

export function StatCard({ label, value, icon, accent = 'gold' }: StatCardProps) {
  return (
    <div className="glass-card group relative overflow-hidden p-6 transition hover:-translate-y-0.5 hover:shadow-glow">
      <div
        className={`absolute -right-4 -top-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br text-3xl opacity-80 ${accents[accent]}`}
      >
        {icon}
      </div>
      <p className="text-sm font-medium text-theme-secondary">{label}</p>
      <p className="mt-2 font-display text-4xl text-theme">{value ?? '—'}</p>
    </div>
  );
}
