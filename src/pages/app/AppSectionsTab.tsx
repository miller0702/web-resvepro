import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Pencil, Smartphone } from 'lucide-react';
import { platformApi } from '../../api/platform';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { APP_SECTION_LABELS, getIconPreview } from '../../lib/app-icons';
import { SortableList } from '../../components/sortable/SortableList';

interface AppSection {
  id: string;
  code: string;
  tabTitle: string;
  headerGreeting?: string | null;
  headerTitle?: string | null;
  subtitle?: string | null;
  description?: string | null;
  icon: string;
  iconActive: string;
  isVisible: boolean;
  sortOrder: number;
}

export function AppSectionsTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['app-sections'],
    queryFn: async () => {
      const res = await platformApi.getAppSections();
      return res.data.data as AppSection[];
    },
  });

  const sections = [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  const reorderMutation = useMutation({
    mutationFn: (codes: string[]) => platformApi.reorderAppSections(codes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-sections'] }),
  });

  return (
    <>
      <div className="mb-6 flex items-start gap-3 rounded-xl bg-gold/10 p-4 dark:bg-gold/15">
        <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-gold-dim dark:text-gold-light" strokeWidth={1.75} />
        <p className="text-sm text-theme-secondary">
          Arrastra las pestañas para cambiar el orden en la barra inferior de la app. Usa Editar para
          títulos, iconos y visibilidad.
        </p>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <SortableList
          items={sections}
          disabled={reorderMutation.isPending}
          onReorder={(ordered) => reorderMutation.mutate(ordered.map((s) => s.code))}
          renderItem={(section) => {
            const Icon = getIconPreview(section.icon);
            const IconActive = getIconPreview(section.iconActive);
            return (
              <article className="glass-card overflow-hidden">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex gap-2">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl surface-muted text-theme-secondary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold-dim dark:text-gold-light">
                        <IconActive className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-xl text-theme">
                          {APP_SECTION_LABELS[section.code] ?? section.tabTitle}
                        </h3>
                        <Badge variant={section.isVisible ? 'success' : 'muted'}>
                          {section.isVisible ? 'Visible' : 'Oculta'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-theme-secondary">{section.tabTitle}</p>
                      <p className="mt-0.5 font-mono text-xs text-theme-muted">{section.code}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-theme-muted">
                      {section.isVisible ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                      Orden {section.sortOrder}
                    </span>
                    <Link
                      to={`/app/${section.code}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium text-gold-dim transition hover:bg-gold/10 dark:text-gold-light"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Editar
                    </Link>
                  </div>
                </div>
              </article>
            );
          }}
        />
      )}
    </>
  );
}
