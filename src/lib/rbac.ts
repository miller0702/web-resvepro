export const ADMIN_ROLE_CODES = ['SUPER_ADMIN', 'ADMIN_GENERAL', 'ADMIN_MODULAR'] as const;
export const APP_READER_ROLE = 'LECTOR';

export type RoleContext = 'panel' | 'app';

export interface RoleMeta {
  label: string;
  shortLabel: string;
  description: string;
  context: RoleContext;
}

export const ROLE_META: Record<string, RoleMeta> = {
  SUPER_ADMIN: {
    label: 'Super Administrador',
    shortLabel: 'Super admin',
    description: 'Control total del panel y la plataforma.',
    context: 'panel',
  },
  ADMIN_GENERAL: {
    label: 'Administrador General',
    shortLabel: 'Admin general',
    description: 'Operación editorial y gestión de usuarios del panel.',
    context: 'panel',
  },
  ADMIN_MODULAR: {
    label: 'Administrador Modular',
    shortLabel: 'Admin modular',
    description: 'Acceso al panel con permisos asignados manualmente.',
    context: 'panel',
  },
  LECTOR: {
    label: 'Lector',
    shortLabel: 'Lector',
    description: 'Usuario final de la app móvil: lee, escucha y sincroniza su progreso.',
    context: 'app',
  },
};

export const PERMISSION_LABELS: Record<string, string> = {
  'users:read': 'Ver usuarios',
  'users:write': 'Gestionar usuarios',
  'users:impersonate': 'Personificar usuarios',
  'admin:audit': 'Ver auditoría',
  'roles:read': 'Ver roles',
  'roles:write': 'Gestionar roles',
  'books:read': 'Ver libros',
  'books:write': 'Editar libros',
  'categories:write': 'Gestionar categorías',
  'collections:write': 'Gestionar colecciones',
  'media:upload': 'Subir archivos',
  'streaming:write': 'Gestionar podcasts, videos y radio',
  'admin:stats': 'Ver estadísticas',
  'library:read': 'Acceso a biblioteca',
  'sync:write': 'Sincronizar progreso',
};

export const PERMISSION_GROUPS: { label: string; permissions: string[] }[] = [
  {
    label: 'Panel administrativo',
    permissions: ['admin:stats', 'admin:audit', 'users:read', 'users:write', 'users:impersonate', 'roles:read', 'roles:write'],
  },
  {
    label: 'Contenido editorial',
    permissions: ['books:read', 'books:write', 'categories:write', 'collections:write', 'media:upload', 'streaming:write'],
  },
  {
    label: 'App móvil',
    permissions: ['library:read', 'sync:write'],
  },
];

export const PANEL_PERMISSION_GROUPS = PERMISSION_GROUPS.filter(
  (g) => g.label !== 'App móvil',
);

export function isPanelUser(roles: string[] = []): boolean {
  return roles.some((r) => r !== APP_READER_ROLE);
}

export function isAppReader(roles: string[] = []): boolean {
  return roles.length > 0 && roles.every((r) => r === APP_READER_ROLE);
}

export function getRoleMeta(code: string): RoleMeta {
  return (
    ROLE_META[code] ?? {
      label: code,
      shortLabel: code,
      description: '',
      context: 'panel',
    }
  );
}

export function formatPermission(code: string): string {
  return PERMISSION_LABELS[code] ?? code;
}

export function getUserDisplayRole(roles: string[] = []): string {
  const panelRole = roles.find((r) => (ADMIN_ROLE_CODES as readonly string[]).includes(r));
  if (panelRole) return getRoleMeta(panelRole).shortLabel;
  if (roles.includes(APP_READER_ROLE)) return 'Lector de la app';
  return 'Sin rol';
}

export function isSuperAdmin(roles: string[] = []): boolean {
  return roles.includes('SUPER_ADMIN');
}
