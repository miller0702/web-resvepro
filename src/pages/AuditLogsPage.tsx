import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { PageHeader } from '../components/ui/PageHeader';
import { Loading } from '../components/ui/Loading';
import { Badge } from '../components/ui/Badge';
import { DataTable } from '../components/DataTable';

interface AuditRow {
  id: string;
  action: string;
  summary?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  createdAt: string;
  actor?: { email?: string; firstName?: string; lastName?: string };
}

const ACTION_LABELS: Record<string, string> = {
  USER_CREATE: 'Creó usuario',
  USER_UPDATE: 'Actualizó usuario',
  IMPERSONATE_START: 'Personificación iniciada',
  IMPERSONATE_STOP: 'Personificación terminada',
};

export function AuditLogsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: async () => {
      const res = await adminApi.getAuditLogs({ page, limit: 30 });
      return {
        rows: res.data.data as AuditRow[],
        meta: res.data.meta as { totalPages?: number; total?: number },
      };
    },
  });

  return (
    <div>
      <PageHeader
        title="Auditoría"
        subtitle="Registro de acciones administrativas: creación, cambios y personificaciones"
      />

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <DataTable
            keyField="id"
            columns={[
              {
                key: 'createdAt',
                label: 'Fecha',
                render: (row) =>
                  new Date(String(row.createdAt)).toLocaleString('es-CO', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }),
              },
              {
                key: 'actor',
                label: 'Actor',
                render: (row) => {
                  const actor = row.actor as AuditRow['actor'];
                  const name = [actor?.firstName, actor?.lastName].filter(Boolean).join(' ');
                  return name || actor?.email || '—';
                },
              },
              {
                key: 'action',
                label: 'Acción',
                render: (row) => (
                  <Badge variant="muted">
                    {ACTION_LABELS[String(row.action)] ?? String(row.action)}
                  </Badge>
                ),
              },
              {
                key: 'summary',
                label: 'Detalle',
                render: (row) => String(row.summary ?? '—'),
              },
            ]}
            data={(data?.rows ?? []) as unknown as Record<string, unknown>[]}
          />

          {(data?.meta?.totalPages ?? 1) > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="px-2 py-1.5 text-sm text-theme-secondary">
                Página {page} de {data?.meta?.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= (data?.meta?.totalPages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
