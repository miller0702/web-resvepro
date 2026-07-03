import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Crown, Pencil, Plus, Puzzle, Shield, Smartphone, Trash2, UserCog, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { adminApi } from '../api/admin';
import { PermissionMatrix, PermissionBadges } from '../components/PermissionMatrix';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';
import { APP_READER_ROLE, getRoleMeta } from '../lib/rbac';

interface RoleRow {
  id: string;
  code: string;
  name: string;
  description?: string;
  userCount?: number;
  permissions?: string[];
  isSystem?: boolean;
  isImmutable?: boolean;
}

const ROLE_ICONS: Record<string, LucideIcon> = {
  SUPER_ADMIN: Crown,
  ADMIN_GENERAL: UserCog,
  ADMIN_MODULAR: Puzzle,
  LECTOR: Smartphone,
};

function RoleCard({
  role,
  onDelete,
  deleting,
}: {
  role: RoleRow;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const meta = getRoleMeta(role.code);
  const Icon = ROLE_ICONS[role.code] ?? Shield;
  const permissions = role.permissions ?? [];
  const canEdit = !role.isImmutable;
  const canDelete = canEdit && (role.userCount ?? 0) === 0;

  return (
    <article className="glass-card overflow-hidden">
      <div className="border-b p-6" style={{ borderColor: 'var(--color-border-subtle)' }}>
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              meta.context === 'app' ? 'bg-sage/10 text-sage' : 'bg-gold/12 text-gold-dim'
            }`}
          >
            <Icon className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl text-theme">{role.name}</h3>
              <Badge variant={meta.context === 'app' ? 'app' : 'panel'}>
                {meta.context === 'app' ? 'App móvil' : 'Panel'}
              </Badge>
              {role.isSystem && (
                <Badge variant="muted">Sistema</Badge>
              )}
            </div>
            <p className="mt-1 font-mono text-xs text-theme-muted">{role.code}</p>
            <p className="mt-2 text-sm leading-relaxed text-theme-secondary">
              {role.description || meta.description}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="flex items-center gap-1.5 rounded-xl surface-muted px-3 py-2 text-sm text-theme-secondary">
              <Users className="h-4 w-4" strokeWidth={1.75} />
              {role.userCount ?? 0}
            </div>
            {canEdit && (
              <Link
                to={`/roles/${role.id}/edit`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-dim hover:text-gold dark:text-gold-light"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                Editar
              </Link>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(role.id)}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 text-sm text-ember/70 hover:text-ember disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                Eliminar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-theme-muted">
          Funcionalidades permitidas
        </p>
        {meta.context === 'app' ? (
          <div className="space-y-3">
            <p className="text-sm text-theme-secondary">
              Este rol no accede al panel. Solo puede usar la app móvil para consumir contenido
              y guardar su progreso personal.
            </p>
            <PermissionBadges permissions={permissions} max={8} />
          </div>
        ) : (
          <PermissionMatrix granted={permissions} />
        )}
      </div>
    </article>
  );
}

function RoleSection({
  title,
  subtitle,
  icon: Icon,
  roles,
  onDelete,
  deletingId,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  roles: RoleRow[];
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  if (roles.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl surface-muted text-theme-secondary">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="font-display text-2xl text-theme">{title}</h2>
          <p className="mt-0.5 text-sm text-theme-secondary">{subtitle}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {roles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            onDelete={onDelete}
            deleting={deletingId === role.id}
          />
        ))}
      </div>
    </section>
  );
}

export function RolesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await adminApi.getRoles();
      return res.data.data as RoleRow[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteRole(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });

  const handleDelete = (id: string) => {
    if (window.confirm('¿Eliminar este rol? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate(id);
    }
  };

  const { panelRoles, appRoles } = useMemo(() => {
    const all = data ?? [];
    return {
      panelRoles: all.filter((r) => r.code !== APP_READER_ROLE),
      appRoles: all.filter((r) => r.code === APP_READER_ROLE),
    };
  }, [data]);

  const deletingId = deleteMutation.isPending ? (deleteMutation.variables ?? null) : null;

  return (
    <div>
      <PageHeader
        title="Roles y permisos"
        subtitle="Crea roles personalizados para el panel y define qué funcionalidades puede usar cada uno."
        action={
          <Link to="/roles/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" strokeWidth={2} />
              Nuevo rol
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <Loading />
      ) : (
        <div className="space-y-10">
          <RoleSection
            title="Roles del panel"
            subtitle="Administradores y roles personalizados con acceso al panel editorial."
            icon={Shield}
            roles={panelRoles}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
          <RoleSection
            title="Rol de la app móvil"
            subtitle="Los lectores se registran en la app con este rol. No entran al panel."
            icon={Smartphone}
            roles={appRoles}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        </div>
      )}
    </div>
  );
}
