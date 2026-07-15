import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Pencil } from 'lucide-react';
import { platformApi } from '../../api/platform';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
import { SortableList } from '../../components/sortable/SortableList';
import { assignSortOrder } from '../../utils/reorder';

export type ManualAudience = 'APP' | 'PANEL';

export interface ManualSection {
  id: string;
  code: string;
  audience: ManualAudience;
  title: string;
  body: string;
  sortOrder: number;
  isVisible: boolean;
}

function parseAudience(value: string | null): ManualAudience {
  return value === 'PANEL' ? 'PANEL' : 'APP';
}

export function ManualPage({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const audience = parseAudience(searchParams.get('audience'));

  const setAudience = (next: ManualAudience) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'manual');
    if (next === 'APP') {
      params.delete('audience');
    } else {
      params.set('audience', next);
    }
    setSearchParams(params);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['manual-sections', audience],
    queryFn: async () => {
      const res = await platformApi.getManualSections(audience);
      return res.data.data as ManualSection[];
    },
  });

  const sections = [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  const reorderMutation = useMutation({
    mutationFn: (ordered: ManualSection[]) =>
      platformApi.bulkUpdateManualSections(
        assignSortOrder(ordered).map((s) => ({
          code: s.code,
          sortOrder: s.sortOrder,
        })),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['manual-sections'] }),
  });

  const handleReorder = (ordered: ManualSection[]) => {
    reorderMutation.mutate(ordered);
  };

  if (isLoading) return <Loading />;

  return (
    <div>
      {!embedded ? (
        <PageHeader
          title="Manual de usuario"
          subtitle="Contenido editable guardado en la base de datos (app y panel)."
        />
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { id: 'APP' as const, label: 'App móvil' },
            { id: 'PANEL' as const, label: 'Panel web' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setAudience(item.id)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              audience === item.id
                ? 'bg-gold/15 text-gold-dim dark:text-gold-light'
                : 'surface-muted text-theme-secondary hover:opacity-90'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl bg-sage/10 p-4 dark:bg-sage/15">
        <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-sage" strokeWidth={1.75} />
        <p className="text-sm text-theme-secondary">
          {audience === 'APP'
            ? 'Estas secciones se muestran en el Manual de usuario de la app. Arrastra para ordenar y edita cada tarjeta.'
            : 'Estas secciones alimentan el Manual del panel (menú Manual del panel). También puedes leerlas ahí en modo guía.'}
          {audience === 'PANEL' ? (
            <>
              {' '}
              <Link to="/help" className="font-medium text-gold-dim dark:text-gold-light">
                Ver manual del panel
              </Link>
            </>
          ) : null}
        </p>
      </div>

      <SortableList
        items={sections}
        disabled={reorderMutation.isPending}
        onReorder={handleReorder}
        renderItem={(section) => (
          <article className="glass-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg text-theme">{section.title}</h3>
                <Badge variant={section.isVisible ? 'success' : 'muted'}>
                  {section.isVisible ? 'Visible' : 'Oculta'}
                </Badge>
                <span className="font-mono text-xs text-theme-muted">{section.code}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-theme-secondary">{section.body}</p>
            </div>
            <Link
              to={`/app/manual/${section.code}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium text-gold-dim transition hover:bg-gold/10 dark:text-gold-light"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <Pencil className="h-4 w-4" strokeWidth={1.75} />
              Editar
            </Link>
          </article>
        )}
      />
    </div>
  );
}
