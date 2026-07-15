import type { IconType } from 'react-icons';
import { getIconLabel, getIconPreview, APP_ICON_GROUPS } from '../../lib/app-icons';

type IconPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function IconPicker({ label, value, onChange }: IconPickerProps) {
  const Selected = getIconPreview(value);
  const selectedLabel = getIconLabel(value);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-theme-secondary">{label}</label>
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-2.5 py-1.5 text-xs text-theme-secondary">
          <Selected className="h-4 w-4 text-gold-dim dark:text-gold-light" />
          <span className="font-medium text-theme">{selectedLabel}</span>
          <span className="font-mono text-theme-muted">{value}</span>
        </div>
      </div>

      <div className="max-h-72 space-y-4 overflow-y-auto rounded-xl border border-[var(--color-border)] p-3">
        {APP_ICON_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-theme-muted">
              {group.label}
            </p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
              {group.icons.map((icon) => {
                const Icon = icon.Icon as IconType;
                const active = value === icon.value;
                return (
                  <button
                    key={icon.value}
                    type="button"
                    title={icon.label}
                    aria-label={icon.label}
                    aria-pressed={active}
                    onClick={() => onChange(icon.value)}
                    className={`group relative flex flex-col items-center gap-1 rounded-xl border px-1.5 py-2 transition ${
                      active
                        ? 'border-gold/50 bg-gold/15 text-gold-dim ring-1 ring-gold/30 dark:text-gold-light'
                        : 'border-transparent bg-[var(--color-bg-subtle)] text-theme-secondary hover:border-[var(--color-border)] hover:text-theme'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="w-full truncate text-center text-[10px] leading-tight">
                      {icon.value}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
