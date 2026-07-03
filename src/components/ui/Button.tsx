import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-gold to-gold-light text-ink font-semibold shadow-glow hover:brightness-105',
  secondary: 'bg-ink text-parchment hover:bg-ink-soft dark:bg-ink-soft dark:hover:bg-ink-muted',
  ghost: 'bg-transparent text-theme hover:bg-[var(--color-bg-subtle)]',
  danger: 'bg-ember/10 text-ember hover:bg-ember/20 dark:bg-ember/15',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
