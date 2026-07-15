import type { IconType } from 'react-icons';
import {
  IoAlertCircleOutline,
  IoCameraOutline,
  IoChatbubbleOutline,
  IoCheckmarkCircle,
  IoChevronBack,
  IoChevronForward,
  IoCloudOfflineOutline,
  IoCloudUploadOutline,
  IoColorWandOutline,
  IoCopyOutline,
  IoCreateOutline,
  IoCropOutline,
  IoDocumentTextOutline,
  IoDownloadOutline,
  IoEllipsisHorizontal,
  IoEyeOffOutline,
  IoEyeOutline,
  IoFlagOutline,
  IoFolderOutline,
  IoHeart,
  IoHeartOutline,
  IoHomeOutline,
  IoImagesOutline,
  IoLibrary,
  IoLibraryOutline,
  IoListOutline,
  IoMapOutline,
  IoMusicalNote,
  IoMusicalNotes,
  IoMusicalNotesOutline,
  IoNewspaper,
  IoNewspaperOutline,
  IoPause,
  IoPeopleOutline,
  IoPerson,
  IoPersonOutline,
  IoPlay,
  IoSchoolOutline,
  IoSearch,
  IoSend,
  IoSettings,
  IoSettingsOutline,
  IoShareSocialOutline,
  IoTimeOutline,
  IoTrashOutline,
  IoVideocam,
  IoVideocamOutline,
} from 'react-icons/io5';
import { MdOutlineCreateNewFolder, MdOutlineRadio, MdBuild } from 'react-icons/md';

/**
 * Catálogo alineado con egw-mobile `AppIcon` (@expo/vector-icons Ionicons / Material).
 * En web usamos `react-icons` (mismos glifos Ionicons 5 + Material), no `@expo/vector-icons`
 * (ese paquete está pensado para React Native / Expo).
 */

export const APP_SECTION_LABELS: Record<string, string> = {
  feed: 'Inicio',
  library: 'Biblioteca',
  audio: 'Audio',
  videos: 'Videos',
  favorites: 'Favoritos',
  profile: 'Perfil',
};

export type AppIconOption = {
  value: string;
  label: string;
  Icon: IconType;
};

export const APP_ICON_GROUPS: { label: string; icons: AppIconOption[] }[] = [
  {
    label: 'Pestañas principales',
    icons: [
      { value: 'feed', label: 'Inicio / feed', Icon: IoNewspaperOutline },
      { value: 'feed-filled', label: 'Inicio / feed (activo)', Icon: IoNewspaper },
      { value: 'library', label: 'Biblioteca', Icon: IoLibraryOutline },
      { value: 'library-filled', label: 'Biblioteca (activo)', Icon: IoLibrary },
      { value: 'audio', label: 'Audio', Icon: IoMusicalNotesOutline },
      { value: 'audio-filled', label: 'Audio (activo)', Icon: IoMusicalNotes },
      { value: 'video', label: 'Video', Icon: IoVideocamOutline },
      { value: 'video-filled', label: 'Video (activo)', Icon: IoVideocam },
      { value: 'favorites', label: 'Favoritos', Icon: IoHeartOutline },
      { value: 'favorites-filled', label: 'Favoritos (activo)', Icon: IoHeart },
      { value: 'profile', label: 'Perfil', Icon: IoPersonOutline },
      { value: 'profile-filled', label: 'Perfil (activo)', Icon: IoPerson },
    ],
  },
  {
    label: 'Estados y media',
    icons: [
      { value: 'empty-library', label: 'Biblioteca vacía', Icon: IoLibraryOutline },
      { value: 'empty-video', label: 'Videos vacíos', Icon: IoVideocamOutline },
      { value: 'empty-favorites', label: 'Favoritos vacíos', Icon: IoHeartOutline },
      { value: 'radio', label: 'Radio', Icon: MdOutlineRadio },
      { value: 'music', label: 'Música', Icon: IoMusicalNote },
      { value: 'play', label: 'Reproducir', Icon: IoPlay },
      { value: 'pause', label: 'Pausa', Icon: IoPause },
      { value: 'search', label: 'Búsqueda', Icon: IoSearch },
      { value: 'home', label: 'Inicio', Icon: IoHomeOutline },
      { value: 'maintenance', label: 'Mantenimiento', Icon: MdBuild },
      { value: 'offline', label: 'Sin conexión', Icon: IoCloudOfflineOutline },
      { value: 'unavailable', label: 'No disponible', Icon: IoAlertCircleOutline },
      { value: 'not-found', label: 'No encontrado', Icon: IoMapOutline },
    ],
  },
  {
    label: 'Menú y acciones',
    icons: [
      { value: 'study', label: 'Centro de estudio', Icon: IoSchoolOutline },
      { value: 'download', label: 'Descargas', Icon: IoDownloadOutline },
      { value: 'settings', label: 'Ajustes', Icon: IoSettingsOutline },
      { value: 'settings-filled', label: 'Ajustes (activo)', Icon: IoSettings },
      { value: 'document', label: 'Documento / manual', Icon: IoDocumentTextOutline },
      { value: 'chat', label: 'Chat / requerimientos', Icon: IoChatbubbleOutline },
      { value: 'send', label: 'Enviar', Icon: IoSend },
      { value: 'compose', label: 'Redactar', Icon: IoCreateOutline },
      { value: 'share', label: 'Compartir', Icon: IoShareSocialOutline },
      { value: 'list', label: 'Lista', Icon: IoListOutline },
      { value: 'people', label: 'Personas', Icon: IoPeopleOutline },
      { value: 'folder', label: 'Carpeta', Icon: IoFolderOutline },
      { value: 'folder-add', label: 'Nueva carpeta', Icon: MdOutlineCreateNewFolder },
      { value: 'eye', label: 'Ver', Icon: IoEyeOutline },
      { value: 'eye-off', label: 'Ocultar', Icon: IoEyeOffOutline },
      { value: 'trash', label: 'Eliminar', Icon: IoTrashOutline },
      { value: 'flag', label: 'Reportar', Icon: IoFlagOutline },
      { value: 'copy', label: 'Copiar', Icon: IoCopyOutline },
      { value: 'sync', label: 'Sincronizar', Icon: IoCloudUploadOutline },
      { value: 'camera', label: 'Cámara', Icon: IoCameraOutline },
      { value: 'gallery', label: 'Galería', Icon: IoImagesOutline },
      { value: 'highlight', label: 'Resaltar', Icon: IoColorWandOutline },
      { value: 'time', label: 'Tiempo', Icon: IoTimeOutline },
      { value: 'check-done', label: 'Completado', Icon: IoCheckmarkCircle },
      { value: 'more', label: 'Más', Icon: IoEllipsisHorizontal },
      { value: 'back', label: 'Atrás', Icon: IoChevronBack },
      { value: 'forward', label: 'Adelante', Icon: IoChevronForward },
      { value: 'crop', label: 'Recortar', Icon: IoCropOutline },
    ],
  },
];

const ICON_BY_VALUE: Record<string, IconType> = Object.fromEntries(
  APP_ICON_GROUPS.flatMap((g) => g.icons.map((i) => [i.value, i.Icon])),
);

export function getIconPreview(name: string): IconType {
  return ICON_BY_VALUE[name] ?? IoLibraryOutline;
}

export function getIconLabel(name: string): string {
  for (const group of APP_ICON_GROUPS) {
    const found = group.icons.find((i) => i.value === name);
    if (found) return found.label;
  }
  return name;
}
