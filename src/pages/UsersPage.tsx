import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ban,
  Eye,
  MessageSquareOff,
  MessageSquare,
  Pencil,
  Shield,
  Smartphone,
  Trash2,
  UserCheck,
  UserPlus,
  VenetianMask,
} from 'lucide-react';
import { adminApi } from '../api/admin';
import { ResourceListPage } from '../components/list/ResourceListPage';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { RowActions } from '../components/ui/RowActions';
import { useClientList } from '../hooks/useClientList';
import { resourceEditPath, resourceViewPath } from '../hooks/useResourceMode';
import { getRoleMeta, isSuperAdmin } from '../lib/rbac';
import { confirmDialog } from '../lib/dialog';
import { getUser, saveAuth, saveImpersonatorSession } from '../lib/auth';

type UserRow = Record<string, unknown> & {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  canPost?: boolean;
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

function confirmAction(message: string, title = 'Confirmar acción', tone: 'danger' | 'warning' = 'danger') {
  return confirmDialog({ title, message, confirmLabel: 'Confirmar', tone });
}

export function UsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'app' ? 'app' : 'panel';
  const [tab, setTab] = useState<UserTab>(initialTab);
  const [search, setSearch] = useState('');
  const currentUser = getUser();

  const { data: panelUsers, isLoading: panelLoading } = useQuery({
    queryKey: ['users', 'panel'],
    queryFn: async () => {
      const res = await adminApi.getUsers({ page: 1, limit: 100, context: 'panel' });
      return res.data.data as UserRow[];
    },
  });

  const { data: appUsers, isLoading: appLoading } = useQuery({
    queryKey: ['users', 'app'],
    queryFn: async () => {
      const res = await adminApi.getUsers({ page: 1, limit: 100, context: 'app' });
      return res.data.data as UserRow[];
    },
  });

  const data = tab === 'panel' ? panelUsers : appUsers;
  const isLoading = tab === 'panel' ? panelLoading : appLoading;

  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const impersonateMutation = useMutation({
    mutationFn: (userId: string) => adminApi.impersonateUser(userId),
    onSuccess: (res) => {
      saveImpersonatorSession();
      const { accessToken, refreshToken, user } = res.data.data;
      saveAuth({ accessToken, refreshToken }, user);
      invalidateUsers();
      navigate('/');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { isActive?: boolean; canPost?: boolean } }) =>
      adminApi.updateUser(id, data),
    onSuccess: () => invalidateUsers(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUserAccount(id),
    onSuccess: () => invalidateUsers(),
  });

  const tabItems = useMemo(() => data ?? [], [data]);

  const list = useClientList({
    items: tabItems as Record<string, unknown>[],
    search,
    searchKeys: ['email', 'firstName', 'lastName', 'username'],
  });

  const activeTab = tabs.find((t) => t.id === tab)!;
  const ActiveIcon = activeTab.icon;
  const canManage = isSuperAdmin(currentUser?.roles) || currentUser?.roles?.includes('ADMIN_GENERAL');
  const pending =
    updateMutation.isPending || deleteMutation.isPending || impersonateMutation.isPending;

  const switchTab = (next: UserTab) => {
    setTab(next);
    setSearchParams(next === 'panel' ? {} : { tab: next });
  };

  const tabSwitcher = (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {tabs.map((item) => {
          const Icon = item.icon;
          const count =
            item.id === 'panel' ? (panelUsers?.length ?? 0) : (appUsers?.length ?? 0);
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
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-theme-secondary">
        <ActiveIcon className="h-4 w-4" strokeWidth={1.75} />
        <span>{activeTab.description}</span>
        {tab === 'panel' ? (
          <button
            type="button"
            onClick={() => switchTab('app')}
            className="font-medium text-gold-dim hover:text-gold dark:text-gold-light"
          >
            Ver lectores de la app →
          </button>
        ) : null}
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
      emptyMessage={
        tab === 'app'
          ? 'No hay lectores registrados en la app. Créalos aquí o con el registro móvil.'
          : 'No hay usuarios del panel en esta vista'
      }
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
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={row.isActive ? 'success' : 'muted'}>
                {row.isActive ? 'Activo' : 'Bloqueado'}
              </Badge>
              {tab === 'app' && row.canPost === false ? (
                <Badge variant="warning">Sin publicar</Badge>
              ) : null}
            </div>
          ),
        },
        {
          key: 'actions',
          label: 'Acciones',
          render: (row) => {
            const id = String(row.id);
            const isSelf = id === currentUser?.id;
            const editPath = `/users/${id}/edit?context=${tab}`;
            const isApp = tab === 'app';

            return (
              <RowActions
                actions={[
                  {
                    key: 'edit',
                    label: 'Editar',
                    icon: <Pencil className="h-4 w-4" strokeWidth={1.75} />,
                    tone: 'edit',
                    to: resourceEditPath(editPath),
                    hidden: !canManage,
                  },
                  {
                    key: 'preview',
                    label: 'Ver detalle',
                    icon: <Eye className="h-4 w-4" strokeWidth={1.75} />,
                    tone: 'view',
                    to: resourceViewPath(editPath),
                  },
                  {
                    key: 'impersonate',
                    label: 'Personificar',
                    icon: <VenetianMask className="h-4 w-4" strokeWidth={1.75} />,
                    tone: 'info',
                    hidden:
                      tab === 'app' ||
                      !isSuperAdmin(currentUser?.roles) ||
                      isSelf ||
                      row.isActive === false,
                    disabled: pending,
                    onClick: () => impersonateMutation.mutate(id),
                  },
                  {
                    key: 'block',
                    label: row.isActive ? 'Bloquear cuenta' : 'Desbloquear cuenta',
                    icon: row.isActive ? (
                      <Ban className="h-4 w-4" strokeWidth={1.75} />
                    ) : (
                      <UserCheck className="h-4 w-4" strokeWidth={1.75} />
                    ),
                    tone: row.isActive ? 'warning' : 'success',
                    hidden: !canManage || isSelf,
                    disabled: pending,
                    onClick: () => {
                      const next = !row.isActive;
                      void confirmAction(
                        next
                          ? '¿Desbloquear esta cuenta para que pueda iniciar sesión?'
                          : '¿Bloquear esta cuenta? No podrá iniciar sesión.',
                        next ? 'Desbloquear cuenta' : 'Bloquear cuenta',
                        next ? 'warning' : 'danger',
                      ).then((ok) => {
                        if (ok) updateMutation.mutate({ id, data: { isActive: next } });
                      });
                    },
                  },
                  {
                    key: 'restrict',
                    label: row.canPost === false ? 'Permitir publicar' : 'Restringir publicaciones',
                    icon:
                      row.canPost === false ? (
                        <MessageSquare className="h-4 w-4" strokeWidth={1.75} />
                      ) : (
                        <MessageSquareOff className="h-4 w-4" strokeWidth={1.75} />
                      ),
                    tone: row.canPost === false ? 'success' : 'warning',
                    hidden: !canManage || !isApp || isSelf,
                    disabled: pending,
                    onClick: () => {
                      const next = row.canPost === false;
                      void confirmAction(
                        next
                          ? '¿Permitir de nuevo que publique en la comunidad?'
                          : '¿Restringir publicaciones en la comunidad? Seguirá pudiendo leer.',
                        next ? 'Permitir publicar' : 'Restringir publicaciones',
                        next ? 'warning' : 'danger',
                      ).then((ok) => {
                        if (ok) updateMutation.mutate({ id, data: { canPost: next } });
                      });
                    },
                  },
                  {
                    key: 'delete',
                    label: 'Eliminar cuenta',
                    icon: <Trash2 className="h-4 w-4" strokeWidth={1.75} />,
                    tone: 'danger',
                    hidden: !canManage || !isApp || isSelf,
                    disabled: pending,
                    onClick: () => {
                      void confirmAction(
                        '¿Eliminar y anonimizar esta cuenta de forma permanente? No se puede deshacer.',
                        'Eliminar cuenta',
                        'danger',
                      ).then((ok) => {
                        if (ok) deleteMutation.mutate(id);
                      });
                    },
                  },
                ]}
              />
            );
          },
        },
      ]}
    />
  );
}
