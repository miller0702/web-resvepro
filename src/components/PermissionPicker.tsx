import { PERMISSION_GROUPS, formatPermission } from '../lib/rbac';

interface PermissionPickerProps {
  selected: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
}

export function PermissionPicker({ selected, onChange, disabled }: PermissionPickerProps) {
  const selectedSet = new Set(selected);

  const toggle = (code: string) => {
    if (disabled) return;
    if (selectedSet.has(code)) {
      onChange(selected.filter((p) => p !== code));
    } else {
      onChange([...selected, code]);
    }
  };

  const toggleGroup = (codes: string[]) => {
    if (disabled) return;
    const allSelected = codes.every((c) => selectedSet.has(c));
    if (allSelected) {
      onChange(selected.filter((p) => !codes.includes(p)));
    } else {
      onChange([...new Set([...selected, ...codes])]);
    }
  };

  return (
    <div className="space-y-5">
      {PERMISSION_GROUPS.filter((g) => g.label !== 'App móvil').map((group) => {
        const allInGroup = group.permissions.every((p) => selectedSet.has(p));
        const someInGroup = group.permissions.some((p) => selectedSet.has(p));

        return (
          <div
            key={group.label}
            className="rounded-xl border p-4"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-bg-subtle)',
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-theme">{group.label}</p>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.permissions)}
                  className="text-xs font-medium text-gold-dim hover:text-gold dark:text-gold-light"
                >
                  {allInGroup ? 'Quitar todos' : someInGroup ? 'Completar grupo' : 'Seleccionar todos'}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {group.permissions.map((code) => (
                <label
                  key={code}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition ${
                    selectedSet.has(code) ? 'bg-gold/10' : 'hover:bg-[var(--color-bg-subtle)]'
                  } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSet.has(code)}
                    onChange={() => toggle(code)}
                    disabled={disabled}
                    className="h-4 w-4 accent-gold"
                  />
                  <span className="text-sm text-theme-secondary">{formatPermission(code)}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
