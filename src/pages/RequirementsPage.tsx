import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { platformApi } from '../api/platform';
import { ResourceListPage } from '../components/list/ResourceListPage';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useClientList } from '../hooks/useClientList';

type RequirementStatus = 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED';

interface RequirementRow extends Record<string, unknown> {
  id: string;
  subject: string;
  message: string;
  status: RequirementStatus;
  adminNotes?: string | null;
  createdAt: string;
  user?: { email: string; name: string } | null;
}

const STATUS_LABELS: Record<RequirementStatus, string> = {
  PENDING: 'Pendiente',
  IN_REVIEW: 'En revisión',
  RESOLVED: 'Resuelto',
  REJECTED: 'Rechazado',
};

const STATUS_VARIANT: Record<RequirementStatus, 'warning' | 'muted' | 'success' | 'panel'> = {
  PENDING: 'warning',
  IN_REVIEW: 'panel',
  RESOLVED: 'success',
  REJECTED: 'muted',
};

const FILTERS: { id: RequirementStatus | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'Todos' },
  { id: 'PENDING', label: 'Pendientes' },
  { id: 'IN_REVIEW', label: 'En revisión' },
  { id: 'RESOLVED', label: 'Resueltos' },
  { id: 'REJECTED', label: 'Rechazados' },
];

export function RequirementsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<RequirementStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<RequirementRow | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<RequirementStatus>('PENDING');

  const { data, isLoading } = useQuery({
    queryKey: ['requirements', filter],
    queryFn: async () => {
      const res = await platformApi.getRequirements(filter === 'ALL' ? undefined : filter);
      return res.data.data as RequirementRow[];
    },
  });

  const list = useClientList({
    items: (data ?? []) as Record<string, unknown>[],
    search,
    searchKeys: ['subject', 'message', (row) => String((row.user as { email?: string } | undefined)?.email ?? '')],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status: RequirementStatus; adminNotes: string } }) =>
      platformApi.updateRequirement(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      setSelected(null);
    },
  });

  const openDetail = (row: RequirementRow) => {
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
        title="Requerimientos"
        subtitle="Solicitudes y comentarios enviados por los usuarios desde la app móvil."
        toolbarExtra={statusFilters}
        keyField="id"
        items={list.items}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por asunto, mensaje o email…"
        meta={list.meta}
        page={list.page}
        onPageChange={list.setPage}
        emptyMessage="No hay requerimientos que coincidan"
        columns={[
          { key: 'subject', label: 'Asunto' },
          {
            key: 'user',
            label: 'Usuario',
            render: (row) => (row.user as { email?: string } | undefined)?.email ?? 'Anónimo',
          },
          {
            key: 'status',
            label: 'Estado',
            render: (row) => (
              <Badge variant={STATUS_VARIANT[row.status as RequirementStatus]}>
                {STATUS_LABELS[row.status as RequirementStatus]}
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
                onClick={() => openDetail(row as RequirementRow)}
                className="font-medium text-gold-dim hover:text-gold dark:text-gold-light"
              >
                Ver detalle →
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
                <h2 className="font-display text-2xl text-theme">{selected.subject}</h2>
                <p className="mt-1 text-sm text-theme-secondary">
                  {selected.user?.name ?? 'Usuario'} · {selected.user?.email ?? '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-theme-muted hover:text-theme"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                  Mensaje
                </p>
                <p className="whitespace-pre-wrap rounded-xl surface-muted p-4 text-sm leading-relaxed text-theme-secondary">
                  {selected.message}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-theme-secondary">
                  Estado
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RequirementStatus)}
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
                <label className="mb-2 block text-sm font-medium text-theme-secondary">
                  Notas internas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder="Respuesta o seguimiento del equipo..."
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
