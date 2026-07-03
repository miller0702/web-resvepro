import { Check, Minus } from 'lucide-react';
import { formatPermission, PERMISSION_GROUPS } from '../lib/rbac';

interface PermissionMatrixProps {
  granted: string[];
  compact?: boolean;
}

export function PermissionMatrix({ granted, compact = false }: PermissionMatrixProps) {
  const grantedSet = new Set(granted);

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {PERMISSION_GROUPS.map((group) => {
        const items = group.permissions.filter((p) => grantedSet.has(p) || !compact);
        if (compact && items.length === 0) return null;

        return (
          <div key={group.label}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-theme-muted">
              {group.label}
            </p>
            <ul className="space-y-1.5">
              {group.permissions.map((code) => {
                const has = grantedSet.has(code);
                if (compact && !has) return null;
                return (
                  <li key={code} className="flex items-center gap-2 text-sm">
                    {has ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-sage" strokeWidth={2.5} />
                    ) : (
                      <Minus className="h-3.5 w-3.5 shrink-0 text-theme-muted" strokeWidth={2} />
                    )}
                    <span className={has ? 'text-theme-secondary' : 'text-theme-muted'}>
                      {formatPermission(code)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

interface PermissionBadgesProps {
  permissions: string[];
  max?: number;
}

export function PermissionBadges({ permissions, max = 6 }: PermissionBadgesProps) {
  const visible = permissions.slice(0, max);
  const rest = permissions.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((code) => (
        <span
          key={code}
          className="inline-flex rounded-lg px-2 py-0.5 text-xs text-theme-secondary surface-muted"
        >
          {formatPermission(code)}
        </span>
      ))}
      {rest > 0 && (
        <span className="inline-flex rounded-lg bg-gold/10 px-2 py-0.5 text-xs text-gold-dim dark:text-gold-light">
          +{rest} más
        </span>
      )}
    </div>
  );
}
