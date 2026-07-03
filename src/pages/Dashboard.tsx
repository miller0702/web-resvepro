import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Loading } from '../components/ui/Loading';

interface AdminStats {
  users?: number;
  activeUsers?: number;
  newUsersLast30Days?: number;
  books?: number;
  publishedBooks?: number;
  draftBooks?: number;
  downloads?: number;
  categories?: number;
  collections?: number;
  videos?: number;
  podcastSeries?: number;
  podcastEpisodes?: number;
  radioStations?: number;
  favorites?: number;
  bookmarks?: number;
  pendingRequirements?: number;
  pendingModerationReports?: number;
  panelUsers?: number;
  appUsers?: number;
  auditLogsLast7Days?: number;
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await adminApi.getStats();
      return res.data.data as AdminStats;
    },
  });

  const sections = [
    {
      title: 'Comunidad y acceso',
      stats: [
        { label: 'Usuarios totales', value: data?.users, icon: '◇', accent: 'ink' as const },
        { label: 'Usuarios activos', value: data?.activeUsers, icon: '✓', accent: 'sage' as const },
        { label: 'Nuevos (30 días)', value: data?.newUsersLast30Days, icon: '+', accent: 'gold' as const },
        { label: 'Equipo panel', value: data?.panelUsers, icon: '◆', accent: 'ink' as const },
        { label: 'Lectores app', value: data?.appUsers, icon: '◎', accent: 'gold' as const },
      ],
    },
    {
      title: 'Biblioteca editorial',
      stats: [
        { label: 'Libros', value: data?.books, icon: '▤', accent: 'gold' as const },
        { label: 'Publicados', value: data?.publishedBooks, icon: '✦', accent: 'sage' as const },
        { label: 'Borradores', value: data?.draftBooks, icon: '…', accent: 'ember' as const },
        { label: 'Categorías', value: data?.categories, icon: '◎', accent: 'gold' as const },
        { label: 'Colecciones', value: data?.collections, icon: '▣', accent: 'ink' as const },
        { label: 'Descargas', value: data?.downloads, icon: '↓', accent: 'ember' as const },
      ],
    },
    {
      title: 'Multimedia y engagement',
      stats: [
        { label: 'Videos', value: data?.videos, icon: '▶', accent: 'ember' as const },
        { label: 'Series podcast', value: data?.podcastSeries, icon: '♫', accent: 'sage' as const },
        { label: 'Episodios', value: data?.podcastEpisodes, icon: '•', accent: 'sage' as const },
        { label: 'Emisoras radio', value: data?.radioStations, icon: '◉', accent: 'gold' as const },
        { label: 'Favoritos', value: data?.favorites, icon: '♥', accent: 'ember' as const },
        { label: 'Marcadores', value: data?.bookmarks, icon: '⚑', accent: 'ink' as const },
      ],
    },
    {
      title: 'Operación y moderación',
      stats: [
        {
          label: 'Requerimientos pendientes',
          value: data?.pendingRequirements,
          icon: '!',
          accent: 'ember' as const,
        },
        {
          label: 'Reportes pendientes',
          value: data?.pendingModerationReports,
          icon: '⚠',
          accent: 'ember' as const,
        },
        {
          label: 'Eventos auditoría (7 días)',
          value: data?.auditLogsLast7Days,
          icon: '≡',
          accent: 'ink' as const,
        },
      ],
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Panorama de la plataforma: usuarios, contenido y operación"
      />

      {isLoading ? (
        <Loading />
      ) : (
        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-4 font-display text-xl text-theme">{section.title}</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {section.stats.map((s) => (
                  <StatCard key={s.label} {...s} />
                ))}
              </div>
            </section>
          ))}

          <section className="grid gap-4 sm:grid-cols-2">
            <Link
              to="/requirements"
              className="glass-card p-5 transition hover:-translate-y-0.5 hover:shadow-glow"
            >
              <p className="text-sm text-theme-secondary">Requerimientos</p>
              <p className="mt-1 font-display text-2xl text-theme">
                {data?.pendingRequirements ?? 0} pendientes
              </p>
            </Link>
            <Link
              to="/moderation"
              className="glass-card p-5 transition hover:-translate-y-0.5 hover:shadow-glow"
            >
              <p className="text-sm text-theme-secondary">Moderación</p>
              <p className="mt-1 font-display text-2xl text-theme">
                {data?.pendingModerationReports ?? 0} reportes abiertos
              </p>
            </Link>
          </section>
        </div>
      )}
    </div>
  );
}
