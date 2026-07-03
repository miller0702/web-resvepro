import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Download,
  FileText,
  GraduationCap,
  Heart,
  Home,
  Library,
  MessageSquare,
  Music,
  Newspaper,
  PlayCircle,
  Radio,
  Search,
  Settings,
  User,
  Video,
  Wrench,
  WifiOff,
  AlertCircle,
} from 'lucide-react';

export const APP_SECTION_LABELS: Record<string, string> = {
  feed: 'Inicio',
  library: 'Biblioteca',
  audio: 'Audio',
  videos: 'Videos',
  favorites: 'Favoritos',
  profile: 'Perfil',
};

export const APP_ICON_GROUPS = [
  {
    label: 'Pestañas principales',
    icons: [
      { value: 'feed', label: 'Inicio / feed (contorno)' },
      { value: 'feed-filled', label: 'Inicio / feed (activo)' },
      { value: 'library', label: 'Biblioteca (contorno)' },
      { value: 'library-filled', label: 'Biblioteca (activo)' },
      { value: 'audio', label: 'Audio (contorno)' },
      { value: 'audio-filled', label: 'Audio (activo)' },
      { value: 'video', label: 'Video (contorno)' },
      { value: 'video-filled', label: 'Video (activo)' },
      { value: 'favorites', label: 'Favoritos (contorno)' },
      { value: 'favorites-filled', label: 'Favoritos (activo)' },
      { value: 'profile', label: 'Perfil (contorno)' },
      { value: 'profile-filled', label: 'Perfil (activo)' },
    ],
  },
  {
    label: 'Estados vacíos y sistema',
    icons: [
      { value: 'empty-library', label: 'Biblioteca vacía' },
      { value: 'empty-video', label: 'Videos vacíos' },
      { value: 'empty-favorites', label: 'Favoritos vacíos' },
      { value: 'radio', label: 'Radio' },
      { value: 'music', label: 'Música' },
      { value: 'search', label: 'Búsqueda' },
      { value: 'home', label: 'Inicio' },
      { value: 'maintenance', label: 'Mantenimiento' },
      { value: 'offline', label: 'Sin conexión' },
      { value: 'unavailable', label: 'No disponible' },
    ],
  },
  {
    label: 'Menú lateral',
    icons: [
      { value: 'study', label: 'Centro de estudio' },
      { value: 'download', label: 'Descargas' },
      { value: 'settings', label: 'Ajustes' },
      { value: 'document', label: 'Documento / manual' },
      { value: 'chat', label: 'Chat / requerimientos' },
    ],
  },
] as const;

export const APP_ICON_PREVIEW: Record<string, LucideIcon> = {
  feed: Newspaper,
  'feed-filled': Newspaper,
  library: Library,
  'library-filled': Library,
  audio: Music,
  'audio-filled': Music,
  video: PlayCircle,
  'video-filled': PlayCircle,
  favorites: Heart,
  'favorites-filled': Heart,
  profile: User,
  'profile-filled': User,
  search: Search,
  radio: Radio,
  music: Music,
  'empty-library': BookOpen,
  'empty-video': Video,
  'empty-favorites': Heart,
  home: Home,
  maintenance: Wrench,
  offline: WifiOff,
  unavailable: AlertCircle,
  study: GraduationCap,
  download: Download,
  settings: Settings,
  document: FileText,
  chat: MessageSquare,
};

export function getIconPreview(name: string): LucideIcon {
  return APP_ICON_PREVIEW[name] ?? Library;
}
