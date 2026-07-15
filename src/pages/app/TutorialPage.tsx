import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Pencil } from 'lucide-react';
import { platformApi } from '../../api/platform';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
import { SortableList } from '../../components/sortable/SortableList';
import { assignSortOrder } from '../../utils/reorder';
import { getIconPreview } from '../../lib/app-icons';

export interface TutorialStep {
  id: string;
  code: string;
  title: string;
  body: string;
  icon: string;
  sortOrder: number;
  isVisible: boolean;
}

export function TutorialPage({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['tutorial-steps'],
    queryFn: async () => {
      const res = await platformApi.getTutorialSteps();
      return res.data.data as TutorialStep[];
    },
  });

  const steps = [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  const reorderMutation = useMutation({
    mutationFn: (ordered: TutorialStep[]) =>
      platformApi.bulkUpdateTutorialSteps(
        assignSortOrder(ordered).map((s) => ({
          code: s.code,
          sortOrder: s.sortOrder,
        })),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tutorial-steps'] }),
  });

  if (isLoading) return <Loading />;

  return (
    <div>
      {!embedded ? (
        <PageHeader
          title="Tutorial de bienvenida"
          subtitle="Pasos que ven los usuarios nuevos la primera vez que entran a la app."
        />
      ) : null}

      <div className="mb-6 flex items-start gap-3 rounded-xl bg-gold/10 p-4 dark:bg-gold/15">
        <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-gold-dim dark:text-gold-light" strokeWidth={1.75} />
        <p className="text-sm text-theme-secondary">
          Arrastra los pasos para definir el orden del tutorial. Edita título, texto e icono en cada
          página de paso.
        </p>
      </div>

      <SortableList
        items={steps}
        disabled={reorderMutation.isPending}
        onReorder={(ordered) => reorderMutation.mutate(ordered)}
        renderItem={(step, index) => {
          const Icon = getIconPreview(step.icon);
          return (
            <article className="glass-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-dim dark:text-gold-light">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">
                      Paso {index + 1}
                    </span>
                    <Badge variant={step.isVisible ? 'success' : 'muted'}>
                      {step.isVisible ? 'Visible' : 'Oculto'}
                    </Badge>
                  </div>
                  <h3 className="font-display text-lg text-theme">{step.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-theme-secondary">{step.body}</p>
                </div>
              </div>
              <Link
                to={`/app/tutorial/${step.code}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium text-gold-dim transition hover:bg-gold/10 dark:text-gold-light"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Pencil className="h-4 w-4" strokeWidth={1.75} />
                Editar
              </Link>
            </article>
          );
        }}
      />
    </div>
  );
}
