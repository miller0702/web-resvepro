import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { ResourceListPage } from '../components/list/ResourceListPage';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useClientList } from '../hooks/useClientList';

type ReportStatus = 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';
type ReportTargetType = 'POST' | 'USER' | 'COMMENT' | 'POST_IMAGE';

interface ModerationReportRow extends Record<string, unknown> {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string | null;
  contextUrl?: string | null;
  status: ReportStatus;
  adminNotes?: string | null;
  createdAt: string;
  reporter?: { email: string; name: string; username: string } | null;
}

const STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: 'Pendiente',
  IN_REVIEW: 'En revisión',
  RESOLVED: 'Resuelto',
  DISMISSED: 'Descartado',
};

const TARGET_LABELS: Record<ReportTargetType, string> = {
  POST: 'Publicación',
  USER: 'Usuario',
  COMMENT: 'Comentario',
  POST_IMAGE: 'Imagen',
};

const STATUS_VARIANT: Record<ReportStatus, 'warning' | 'muted' | 'success' | 'panel'> = {
  PENDING: 'warning',
  IN_REVIEW: 'panel',
  RESOLVED: 'success',
  DISMISSED: 'muted',
};

const FILTERS: { id: ReportStatus | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'Todos' },
  { id: 'PENDING', label: 'Pendientes' },
  { id: 'IN_REVIEW', label: 'En revisión' },
  { id: 'RESOLVED', label: 'Resueltos' },
  { id: 'DISMISSED', label: 'Descartados' },
];

export function ModerationReportsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ReportStatus | 'ALL'>('PENDING');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ModerationReportRow | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ReportStatus>('PENDING');

  const { data, isLoading } = useQuery({
    queryKey: ['moderation-reports', filter],
    queryFn: async () => {
      const res = await adminApi.getModerationReports(
        filter === 'ALL' ? undefined : filter,
      );
      return res.data.data as ModerationReportRow[];
    },
  });

  const list = useClientList({
    items: (data ?? []) as Record<string, unknown>[],
    search,
    searchKeys: [
      'reason',
      'details',
      'targetId',
      (row) => String((row.reporter as { email?: string } | undefined)?.email ?? ''),
    ],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status: ReportStatus; adminNotes: string } }) =>
      adminApi.updateModerationReport(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
      setSelected(null);
    },
  });

  const openDetail = (row: ModerationReportRow) => {
    setSelected(row);
    setNotes(row.adminNotes ?? '');
    setStatus(row.status);
  };

  const statusFilters = (
    <div className="mb-4 flex flex-wrap gap-2">
      {FILTERS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setFilter(item.id)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            filter === item.id
              ? 'bg-gold/15 text-gold-dim dark:text-gold-light'
              : 'surface-muted text-theme-secondary hover:opacity-90'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <ResourceListPage
        title="Reportes de moderación"
        subtitle="Denuncias de publicaciones, usuarios e imágenes enviadas desde la app móvil."
        toolbarExtra={statusFilters}
        keyField="id"
        items={list.items}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por motivo, ID o email…"
        meta={list.meta}
        page={list.page}
        onPageChange={list.setPage}
        emptyMessage="No hay reportes que coincidan"
        columns={[
          {
            key: 'targetType',
            label: 'Tipo',
            render: (row) => TARGET_LABELS[row.targetType as ReportTargetType] ?? row.targetType,
          },
          { key: 'reason', label: 'Motivo' },
          {
            key: 'reporter',
            label: 'Reportado por',
            render: (row) => (row.reporter as { email?: string } | undefined)?.email ?? '—',
          },
          {
            key: 'status',
            label: 'Estado',
            render: (row) => (
              <Badge variant={STATUS_VARIANT[row.status as ReportStatus]}>
                {STATUS_LABELS[row.status as ReportStatus]}
              </Badge>
            ),
          },
          {
            key: 'createdAt',
            label: 'Fecha',
            render: (row) => new Date(String(row.createdAt)).toLocaleDateString('es-CO'),
          },
          {
            key: 'id',
            label: '',
            render: (row) => (
              <button
                type="button"
                onClick={() => openDetail(row as ModerationReportRow)}
                className="font-medium text-gold-dim hover:text-gold dark:text-gold-light"
              >
                Revisar →
              </button>
            ),
          },
        ]}
      />

      {selected && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="glass-card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl text-theme">
                  {TARGET_LABELS[selected.targetType]} · {selected.reason}
                </h2>
                <p className="mt-1 text-sm text-theme-secondary">
                  ID objetivo: <code>{selected.targetId}</code>
                </p>
                <p className="text-sm text-theme-secondary">
                  {selected.reporter?.name ?? 'Usuario'} · {selected.reporter?.email ?? '—'}
                </p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-theme-muted hover:text-theme">
                ✕
              </button>
            </div>

            <div className="space-y-5">
              {selected.details ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                    Detalle del reporte
                  </p>
                  <p className="whitespace-pre-wrap rounded-xl surface-muted p-4 text-sm leading-relaxed text-theme-secondary">
                    {selected.details}
                  </p>
                </div>
              ) : null}

              {selected.contextUrl ? (
                <p className="text-sm text-theme-secondary">
                  Contexto:{' '}
                  <a href={selected.contextUrl} className="text-gold-dim underline" target="_blank" rel="noreferrer">
                    {selected.contextUrl}
                  </a>
                </p>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-medium text-theme-secondary">Estado</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ReportStatus)}
                  className="input-field"
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-theme-secondary">Notas internas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder="Acción tomada, seguimiento…"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={updateMutation.isPending}
                  onClick={() =>
                    updateMutation.mutate({
                      id: selected.id,
                      payload: { status, adminNotes: notes },
                    })
                  }
                >
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                </Button>
                <Button variant="ghost" onClick={() => setSelected(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
