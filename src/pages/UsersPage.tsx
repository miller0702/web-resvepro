import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Smartphone, UserPlus, VenetianMask } from 'lucide-react';
import { adminApi } from '../api/admin';
import { ResourceListPage } from '../components/list/ResourceListPage';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useClientList } from '../hooks/useClientList';
import { getRoleMeta, isAppReader, isPanelUser, isSuperAdmin } from '../lib/rbac';
import { getUser, saveAuth, saveImpersonatorSession } from '../lib/auth';

type UserRow = Record<string, unknown> & {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  roles?: string[];
};

type UserTab = 'panel' | 'app';

const tabs: { id: UserTab; label: string; description: string; icon: typeof Shield }[] = [
  {
    id: 'panel',
    label: 'Equipo del panel',
    description: 'Administradores con acceso al panel editorial y sus permisos.',
    icon: Shield,
  },
  {
    id: 'app',
    label: 'Lectores de la app',
    description: 'Personas que usan la app móvil para leer, escuchar y sincronizar.',
    icon: Smartphone,
  },
];

function RoleBadges({ roles = [] }: { roles?: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((code) => {
        const meta = getRoleMeta(code);
        return (
          <Badge key={code} variant={meta.context === 'app' ? 'app' : 'panel'}>
            {meta.shortLabel}
          </Badge>
        );
      })}
    </div>
  );
}

export function UsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'app' ? 'app' : 'panel';
  const [tab, setTab] = useState<UserTab>(initialTab);
  const [search, setSearch] = useState('');
  const currentUser = getUser();

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await adminApi.getUsers({ page: 1, limit: 200 });
      return res.data.data as UserRow[];
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: (userId: string) => adminApi.impersonateUser(userId),
    onSuccess: (res) => {
      saveImpersonatorSession();
      const { accessToken, refreshToken, user } = res.data.data;
      saveAuth({ accessToken, refreshToken }, user);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/');
    },
  });

  const tabItems = useMemo(() => {
    const all = data ?? [];
    return all.filter((u) => (tab === 'panel' ? isPanelUser(u.roles) : isAppReader(u.roles)));
  }, [data, tab]);

  const list = useClientList({
    items: tabItems as Record<string, unknown>[],
    search,
    searchKeys: ['email', 'firstName', 'lastName', 'username'],
  });

  const activeTab = tabs.find((t) => t.id === tab)!;
  const ActiveIcon = activeTab.icon;
  const canManage = isSuperAdmin(currentUser?.roles) || currentUser?.roles?.includes('ADMIN_GENERAL');

  const switchTab = (next: UserTab) => {
    setTab(next);
    setSearchParams(next === 'panel' ? {} : { tab: next });
  };

  const tabSwitcher = (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {tabs.map((item) => {
          const Icon = item.icon;
          const count = (data ?? []).filter((u) =>
            item.id === 'panel' ? isPanelUser(u.roles) : isAppReader(u.roles),
          ).length;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => switchTab(item.id)}
              className={`glass-card p-5 text-left transition ${
                active ? 'ring-2 ring-gold/40' : 'hover:shadow-card'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    active ? 'bg-gold/15 text-gold-dim dark:text-gold-light' : 'surface-muted text-theme-muted'
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-theme">{item.label}</p>
                    <span className="rounded-full surface-muted px-2.5 py-0.5 text-xs font-medium text-theme-secondary">
                      {count}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-theme-secondary">{item.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mb-4 flex items-center gap-2 text-sm text-theme-secondary">
        <ActiveIcon className="h-4 w-4" strokeWidth={1.75} />
        <span>{activeTab.description}</span>
      </div>
    </>
  );

  return (
    <ResourceListPage
      title="Usuarios"
      subtitle="Gestiona el equipo del panel y los lectores de la app móvil por separado."
      action={
        canManage ? (
          <Link to={`/users/new?context=${tab}`}>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" strokeWidth={1.75} />
              Nuevo usuario
            </Button>
          </Link>
        ) : undefined
      }
      toolbarExtra={tabSwitcher}
      keyField="id"
      items={list.items}
      isLoading={isLoading}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar por email o nombre…"
      meta={list.meta}
      page={list.page}
      onPageChange={list.setPage}
      emptyMessage="No hay usuarios en esta vista"
      columns={[
        { key: 'email', label: 'Email' },
        {
          key: 'name',
          label: 'Nombre',
          render: (row) => `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || '—',
        },
        {
          key: 'roles',
          label: tab === 'panel' ? 'Rol en el panel' : 'Tipo de cuenta',
          render: (row) => <RoleBadges roles={row.roles as string[]} />,
        },
        {
          key: 'isActive',
          label: 'Estado',
          render: (row) => (
            <Badge variant={row.isActive ? 'success' : 'muted'}>
              {row.isActive ? 'Activo' : 'Inactivo'}
            </Badge>
          ),
        },
        {
          key: 'actions',
          label: 'Acciones',
          render: (row) => (
            <div className="flex flex-wrap gap-2">
              {canManage && (
                <Link
                  to={`/users/${row.id}/edit`}
                  className="text-sm font-medium text-gold-dim hover:text-gold dark:text-gold-light"
                >
                  Editar
                </Link>
              )}
              {isSuperAdmin(currentUser?.roles) &&
                row.id !== currentUser?.id &&
                row.isActive !== false && (
                  <button
                    type="button"
                    disabled={impersonateMutation.isPending}
                    onClick={() => impersonateMutation.mutate(String(row.id))}
                    className="inline-flex items-center gap-1 text-sm font-medium text-theme-secondary hover:text-theme"
                  >
                    <VenetianMask className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Personificar
                  </button>
                )}
            </div>
          ),
        },
      ]}
    />
  );
}
