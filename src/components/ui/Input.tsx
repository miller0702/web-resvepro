import { InputHTMLAttributes, forwardRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  /** Solo aplica cuando `type="password"`. Por defecto `true`. */
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      icon: Icon,
      showPasswordToggle = true,
      className = '',
      type,
      ...props
    },
    ref,
  ) => {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const isPassword = type === 'password';
    const canTogglePassword = isPassword && showPasswordToggle;
    const inputType = canTogglePassword && passwordVisible ? 'text' : type;

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-theme-secondary">{label}</label>
        )}
        <div className="relative">
          {Icon ? (
            <Icon
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted"
              strokeWidth={1.75}
              aria-hidden
            />
          ) : null}
          <input
            ref={ref}
            type={inputType}
            className={`input-field ${Icon ? 'pl-10' : ''} ${canTogglePassword ? 'pr-10' : ''} ${className}`}
            {...props}
          />
          {canTogglePassword ? (
            <button
              type="button"
              onClick={() => setPasswordVisible((visible) => !visible)}
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-theme-muted transition hover:bg-[var(--color-bg-subtle)] hover:text-theme-secondary"
              aria-label={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {passwordVisible ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          ) : null}
        </div>
        {error && <p className="text-sm text-ember">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
