import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Flag,
  FolderOpen,
  LayoutDashboard,
  MessageSquarePlus,
  Mic2,
  Radio,
  ScrollText,
  Settings,
  Shield,
  Smartphone,
  Tags,
  UserPen,
  Video,
  Users,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
  /** Grupos colapsables en el sidebar (Editorial, Multimedia, etc.) */
  collapsible?: boolean;
}

export const navGroups: NavGroup[] = [
  {
    id: 'general',
    label: 'General',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    id: 'editorial',
    label: 'Editorial',
    collapsible: true,
    items: [
      { to: '/books', label: 'Libros', icon: BookOpen },
      { to: '/authors', label: 'Autores', icon: UserPen },
      { to: '/categories', label: 'Categorías', icon: Tags },
      { to: '/collections', label: 'Colecciones', icon: FolderOpen },
    ],
  },
  {
    id: 'multimedia',
    label: 'Multimedia',
    collapsible: true,
    items: [
      { to: '/podcasts', label: 'Podcasts', icon: Mic2 },
      { to: '/videos', label: 'Videos', icon: Video },
      { to: '/radio', label: 'Radio', icon: Radio },
    ],
  },
  {
    id: 'acceso',
    label: 'Acceso',
    collapsible: true,
    items: [
      { to: '/users', label: 'Usuarios', icon: Users },
      { to: '/roles', label: 'Roles y permisos', icon: Shield },
      { to: '/audit', label: 'Auditoría', icon: ScrollText },
      { to: '/moderation', label: 'Moderación', icon: Flag },
    ],
  },
  {
    id: 'plataforma',
    label: 'Plataforma',
    collapsible: true,
    items: [
      { to: '/app', label: 'App móvil', icon: Smartphone },
      { to: '/help', label: 'Manual del panel', icon: BookOpen },
      { to: '/requirements', label: 'Requerimientos', icon: MessageSquarePlus },
      { to: '/settings', label: 'Configuración', icon: Settings },
    ],
  },
];

export const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/books': 'Libros',
  '/books/new': 'Nuevo libro',
  '/authors': 'Autores',
  '/authors/new': 'Nuevo autor',
  '/categories': 'Categorías',
  '/categories/new': 'Nueva categoría',
  '/collections': 'Colecciones',
  '/collections/new': 'Nueva colección',
  '/podcasts': 'Podcasts',
  '/podcasts/new': 'Nuevo podcast',
  '/videos': 'Videos',
  '/videos/new': 'Nuevo video',
  '/radio': 'Radio',
  '/radio/new': 'Nueva emisora',
  '/users': 'Usuarios',
  '/users/new': 'Nuevo usuario',
  '/audit': 'Auditoría',
  '/roles': 'Roles y permisos',
  '/roles/new': 'Nuevo rol',
  '/moderation': 'Moderación',
  '/requirements': 'Requerimientos',
  '/settings': 'Configuración',
  '/help': 'Manual del panel',
  '/app': 'App móvil',
};

export function getPageTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname];
  if (pathname.startsWith('/users/') && pathname.endsWith('/edit')) return 'Editar usuario';
  if (pathname.startsWith('/users/new')) return 'Nuevo usuario';
  if (pathname.startsWith('/roles/') && pathname.endsWith('/edit')) return 'Editar rol';
  if (pathname.startsWith('/app/manual/')) return 'Editar sección del manual';
  if (pathname.startsWith('/app/tutorial/')) return 'Editar paso del tutorial';
  if (pathname.startsWith('/app/') && pathname !== '/app') return 'Editar pestaña';
  if (pathname.startsWith('/authors/')) return 'Editar autor';
  if (pathname.startsWith('/books/')) return 'Editar libro';
  if (pathname.startsWith('/categories/')) return 'Editar categoría';
  if (pathname.startsWith('/collections/')) return 'Editar colección';
  if (pathname.startsWith('/podcasts/')) return 'Editar podcast';
  if (pathname.startsWith('/videos/')) return 'Editar video';
  if (pathname.startsWith('/radio/')) return 'Editar emisora';
  return 'Panel administrativo';
}

/** Resuelve qué grupo contiene la ruta actual (para expandir el sidebar). */
export function getActiveNavGroupId(pathname: string): string | null {
  let best: { groupId: string; length: number } | null = null;

  for (const group of navGroups) {
    for (const item of group.items) {
      const matches = item.end
        ? pathname === item.to
        : pathname === item.to || pathname.startsWith(`${item.to}/`);
      if (matches && (!best || item.to.length > best.length)) {
        best = { groupId: group.id, length: item.to.length };
      }
    }
  }

  return best?.groupId ?? null;
}
