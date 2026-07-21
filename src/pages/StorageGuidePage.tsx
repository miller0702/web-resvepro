import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Cloud, DollarSign, HardDrive, Info, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { mediaApi } from '../api/media';
import { PageHeader } from '../components/ui/PageHeader';
import { Loading } from '../components/ui/Loading';
import { formatBytes } from '../utils/compressVideo';
import {
  formatCop,
  formatCopFromUsd,
  formatCopMonthlyRangeFromUsd,
  formatCopPerMonthFromUsd,
  USD_TO_COP,
  usdToCop,
} from '../utils/storagePricing';

const GCS_STORAGE_USD_PER_GB_MONTH = 0.026;
const GCS_EGRESS_USD_PER_GB = 0.12;

const STORAGE_ROWS = [
  { space: '50 GB', usdMonth: 1.3 },
  { space: '100 GB', usdMonth: 2.6 },
  { space: '300 GB', usdMonth: 7.8 },
  { space: '500 GB', usdMonth: 13 },
  { space: '1 TB', usdMonth: 26 },
];

const EGRESS_ROWS = [
  { traffic: '50 GB vistos', usdMonth: 6 },
  { traffic: '100 GB vistos', usdMonth: 12 },
  { traffic: '500 GB vistos', usdMonth: 60 },
  { traffic: '1 TB vistos', usdMonth: 120 },
];

const TYPE_LABELS: Record<string, string> = {
  VIDEO: 'Videos',
  IMAGE: 'Imágenes',
  COVER: 'Portadas',
  AUDIO: 'Audio',
  EPUB: 'EPUB',
  PDF: 'PDF',
  DOCUMENT: 'Documentos',
  OTHER: 'Otros',
};

/** Tipos que siempre se muestran en el panel (aunque no haya archivos). */
const ALWAYS_SHOW_TYPES = ['VIDEO', 'AUDIO', 'IMAGE', 'COVER'] as const;

function clampRatio(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(1, value);
}

function barTone(ratio: number): string {
  if (ratio >= 0.85) return 'bg-ember';
  if (ratio >= 0.6) return 'bg-gold';
  return 'bg-sage';
}

function StorageProgressBar({
  label,
  detail,
  usedBytes,
  budgetBytes,
  toneRatio,
  count,
  unknownSize,
  /** Si true, el % es proporción del total medido (no un presupuesto de capacidad). */
  shareOfTotal = false,
}: {
  label: string;
  detail?: string;
  usedBytes: number;
  budgetBytes: number;
  toneRatio?: number;
  count?: number;
  unknownSize?: boolean;
  shareOfTotal?: boolean;
}) {
  const ratio = clampRatio(budgetBytes > 0 ? usedBytes / budgetBytes : 0);
  const tone = unknownSize ? 'bg-gold/70' : barTone(toneRatio ?? ratio);
  const pct = Math.round(ratio * 1000) / 10;
  // Capacidad real: no inflar la barra; proporción entre tipos: mínimo visible si hay bytes.
  const visualWidth =
    usedBytes > 0
      ? shareOfTotal
        ? Math.min(100, Math.max(pct, 1.5))
        : Math.min(100, pct)
      : unknownSize && (count ?? 0) > 0
        ? 4
        : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-theme">
            {label}
            {typeof count === 'number' ? (
              <span className="ml-2 text-xs font-normal text-theme-muted">
                ({count} archivo{count === 1 ? '' : 's'})
              </span>
            ) : null}
          </p>
          {detail ? <p className="text-xs text-theme-muted">{detail}</p> : null}
        </div>
        <p className="shrink-0 text-sm tabular-nums text-theme-secondary">
          {unknownSize && usedBytes === 0 ? (
            <span className="text-theme-muted">tamaño pendiente</span>
          ) : shareOfTotal ? (
            <>
              {formatBytes(usedBytes)}
              <span className="ml-2 font-medium text-theme">
                {pct}% <span className="font-normal text-theme-muted">del total</span>
              </span>
            </>
          ) : (
            <>
              {formatBytes(usedBytes)}
              <span className="text-theme-muted"> / {formatBytes(budgetBytes)}</span>
              <span className="ml-2 font-medium text-theme">{pct}%</span>
            </>
          )}
        </p>
      </div>
      <div
        className="h-3 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, Math.round(pct))}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${tone}`}
          style={{ width: `${visualWidth}%` }}
        />
      </div>
    </div>
  );
}

export function StorageGuidePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['media-storage-usage'],
    queryFn: async () => (await mediaApi.storageUsage()).data.data,
    staleTime: 30_000,
  });

  const typeBars = useMemo(() => {
    const byType = new Map(
      (data?.byType ?? []).map((row) => [row.type, row] as const),
    );
    const types = new Set<string>([
      ...ALWAYS_SHOW_TYPES,
      ...(data?.byType ?? []).map((t) => t.type),
    ]);
    const rows = [...types].map((type) => {
      const row = byType.get(type);
      return {
        type,
        label: TYPE_LABELS[type] ?? type,
        bytes: row?.bytes ?? 0,
        count: row?.count ?? 0,
        unknownSizeCount: row?.unknownSizeCount ?? 0,
      };
    });
    return rows
      .sort((a, b) => b.bytes - a.bytes || b.count - a.count)
      .map((row) => ({
        ...row,
        unknownSize:
          row.count > 0 && (row.bytes === 0 || row.unknownSizeCount > 0),
      }));
  }, [data]);

  return (
    <div className="w-full space-y-8">
      <PageHeader
        title="Almacenamiento y costes"
        subtitle="Directorio para administradores: uso actual del multimedia, presupuestos recomendados y costes orientativos en pesos colombianos (COP)."
      />

      <section className="glass-card w-full space-y-5 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <HardDrive className="mt-0.5 h-5 w-5 shrink-0 text-gold-dim dark:text-gold-light" strokeWidth={1.75} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl text-theme">Uso actual</h2>
            <p className="mt-1 text-sm text-theme-secondary">
              Suma de archivos registrados en la plataforma (Cloud Storage + legado inline). Los
              presupuestos de 300 GB (cómodo) y 500 GB (alto) son guías internas, no un límite duro
              de Google.
            </p>
          </div>
        </div>

        {isLoading ? (
          <Loading />
        ) : isError || !data ? (
          <p className="text-sm text-ember">No se pudo cargar el uso de almacenamiento.</p>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-theme-secondary">
                Archivos:{' '}
                <strong className="font-medium text-theme">{data.totalCount}</strong>
              </span>
              <span className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-theme-secondary">
                Peso medido:{' '}
                <strong className="font-medium text-theme">{formatBytes(data.totalBytes)}</strong>
              </span>
              <span className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-theme-secondary">
                En tu bucket:{' '}
                <strong className="font-medium text-theme">
                  {formatBytes(data.gcsBytes ?? 0)}
                </strong>
                <span className="text-theme-muted">
                  {' '}
                  ({data.gcsCount ?? 0} archivo{(data.gcsCount ?? 0) === 1 ? '' : 's'})
                </span>
              </span>
              <span className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-theme-secondary">
                Bucket:{' '}
                <strong className="font-medium text-theme">
                  {data.bucket || (data.configured ? 'configurado' : 'no configurado')}
                </strong>
              </span>
              <span className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-theme-secondary">
                Coste guardar en bucket (est.):{' '}
                <strong className="font-medium text-theme">
                  {formatCopPerMonthFromUsd(data.estimatedStorageUsdMonth)}
                </strong>
              </span>
            </div>

            {(data.unknownSizeCount ?? 0) > 0 ? (
              <p className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-theme-secondary">
                Hay <strong className="text-theme">{data.unknownSizeCount}</strong> archivo
                {(data.unknownSizeCount ?? 0) === 1 ? '' : 's'} sin tamaño registrado (p. ej. URLs
                externas del seed). Al abrir esta página se intenta detectar el peso; YouTube no
                ocupa espacio en el bucket.
                {(data.sizesRefreshed ?? 0) > 0
                  ? ` Se actualizaron ${data.sizesRefreshed} en esta consulta.`
                  : ''}
              </p>
            ) : null}

            {(data.remoteUrlCount ?? 0) > 0 ? (
              <p className="rounded-xl border border-[var(--color-border)] bg-black/[0.02] px-4 py-3 text-sm text-theme-secondary dark:bg-white/[0.03]">
                Hay <strong className="text-theme">{data.remoteUrlCount}</strong> archivo
                {(data.remoteUrlCount ?? 0) === 1 ? '' : 's'} con URL externa (
                {formatBytes(data.remoteUrlBytes ?? 0)}). Cuentan en el peso medido, pero{' '}
                <strong className="text-theme">no ocupan ni facturan</strong> tu bucket{' '}
                {data.bucket ? (
                  <code className="rounded bg-black/5 px-1 text-xs dark:bg-white/10">{data.bucket}</code>
                ) : (
                  'GCS'
                )}
                .
              </p>
            ) : null}

            <StorageProgressBar
              label="Presupuesto cómodo (300 GB)"
              detail="Zona recomendada para empezar sin preocuparte por el almacenamiento. Solo cuenta lo de tu bucket."
              usedBytes={data.gcsBytes ?? 0}
              budgetBytes={data.softBudgetBytes}
              count={data.gcsCount ?? 0}
            />

            <StorageProgressBar
              label="Presupuesto alto (500 GB)"
              detail="Si te acercas a este nivel, revisa compresión, YouTube para videos largos y alertas en GCP."
              usedBytes={data.gcsBytes ?? 0}
              budgetBytes={data.highBudgetBytes}
              count={data.gcsCount ?? 0}
            />

            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
              <StorageProgressBar
                label="En tu bucket GCS"
                detail={`Archivos subidos a ${data.bucket || 'Cloud Storage'}. Sí facturan almacenamiento.`}
                usedBytes={data.gcsBytes ?? 0}
                budgetBytes={Math.max(data.totalBytes, 1)}
                toneRatio={clampRatio((data.gcsBytes ?? 0) / data.softBudgetBytes)}
                count={data.gcsCount ?? 0}
                shareOfTotal
              />
              <StorageProgressBar
                label="URLs externas"
                detail="Enlaces públicos o del seed (p. ej. demos). No viven en tu bucket."
                usedBytes={data.remoteUrlBytes ?? 0}
                budgetBytes={Math.max(data.totalBytes, 1)}
                toneRatio={0.35}
                count={data.remoteUrlCount ?? 0}
                shareOfTotal
              />
              <StorageProgressBar
                label="Legado en base de datos"
                detail="Assets INLINE residuales (conviene migrar)."
                usedBytes={data.inlineBytes}
                budgetBytes={Math.max(data.totalBytes, 1)}
                toneRatio={data.inlineBytes > 0 ? 0.7 : 0}
                shareOfTotal
              />
            </div>

            <div className="space-y-4 border-t border-[var(--color-border)] pt-5">
              <h3 className="text-sm font-semibold text-theme">Por tipo de contenido</h3>
              <p className="text-xs text-theme-muted">
                El porcentaje es respecto al presupuesto cómodo de 300 GB (igual que arriba), no
                “lleno al 100%”. Imágenes/portadas solo cuentan si subiste archivos; YouTube no suma
                bytes en el bucket.
              </p>
              <div className="space-y-4">
                {typeBars.map((row) => (
                  <StorageProgressBar
                    key={row.type}
                    label={row.label}
                    detail={
                      row.count === 0
                        ? 'Sin archivos de este tipo'
                        : row.unknownSize
                          ? 'Registrados, pero el peso aún no se pudo medir'
                          : undefined
                    }
                    usedBytes={row.bytes}
                    budgetBytes={data.softBudgetBytes}
                    toneRatio={clampRatio((data.gcsBytes ?? 0) / data.softBudgetBytes)}
                    count={row.count}
                    unknownSize={row.unknownSize}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="glass-card w-full space-y-4 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <Cloud className="mt-0.5 h-5 w-5 shrink-0 text-gold-dim dark:text-gold-light" strokeWidth={1.75} />
          <div>
            <h2 className="font-display text-xl text-theme">Dónde se guarda el contenido</h2>
            <p className="mt-2 text-sm leading-relaxed text-theme-secondary">
              Videos, imágenes, audios y documentos del panel se almacenan en el bucket de Google Cloud
              Storage <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs dark:bg-white/10">media-resvepro</code>.
              PostgreSQL solo guarda metadatos (título, categoría, URL del archivo), no el binario.
              YouTube no ocupa espacio en el bucket: solo se guarda el identificador del video.
            </p>
          </div>
        </div>
      </section>

      <section className="glass-card w-full space-y-4 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <Upload className="mt-0.5 h-5 w-5 shrink-0 text-gold-dim dark:text-gold-light" strokeWidth={1.75} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl text-theme">Subidas desde el panel</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-theme-secondary">
              <li>
                <strong className="font-medium text-theme">Sin límite de tamaño</strong> en videos ni
                archivos: puedes subir piezas largas.
              </li>
              <li>
                El panel <strong className="font-medium text-theme">comprime automáticamente</strong>{' '}
                imágenes (&gt; 200 KB) y videos (&gt; 15 MB) para que ocupen menos y bajen los costes de
                almacenamiento y de reproducción.
              </li>
              <li>
                Archivos muy grandes pueden tardar varios minutos (optimizar + subir a la nube). No
                cierres la pestaña mientras aparece el progreso.
              </li>
              <li>
                Para contenido masivo o viral, conviene usar{' '}
                <Link to="/videos" className="text-gold-dim underline-offset-2 hover:underline dark:text-gold-light">
                  YouTube
                </Link>{' '}
                (opción A en el formulario de video): no consume almacenamiento ni egress del bucket.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="glass-card w-full space-y-5 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <DollarSign className="mt-0.5 h-5 w-5 shrink-0 text-gold-dim dark:text-gold-light" strokeWidth={1.75} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl text-theme">Facturación mensual (estimación en COP)</h2>
            <p className="mt-2 text-sm leading-relaxed text-theme-secondary">
              Precios orientativos de Google Cloud Storage Standard (multi-región US), convertidos a{' '}
              <strong className="font-medium text-theme">pesos colombianos (COP)</strong> con TRM
              referencia de{' '}
              <strong className="font-medium text-theme">{formatCop(USD_TO_COP, 0)}</strong> por US$.
              Tarifas base de Google: almacenamiento ≈{' '}
              <strong className="font-medium text-theme">
                {formatCop(usdToCop(GCS_STORAGE_USD_PER_GB_MONTH), 0)} / GB / mes
              </strong>{' '}
              y tráfico de salida al reproducir ≈{' '}
              <strong className="font-medium text-theme">
                {formatCop(usdToCop(GCS_EGRESS_USD_PER_GB), 0)} / GB
              </strong>
              . Google puede actualizar tarifas y el dólar varía: usa esto como guía, no como factura
              exacta.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-theme">
              <Cloud className="h-4 w-4 text-theme-muted" strokeWidth={1.75} />
              Solo guardar (poco caro)
            </h3>
            <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)]">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/[0.03] text-theme-muted dark:bg-white/[0.04]">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Espacio en el bucket</th>
                    <th className="px-4 py-2.5 font-medium">Coste aprox.</th>
                  </tr>
                </thead>
                <tbody>
                  {STORAGE_ROWS.map((row) => (
                    <tr key={row.space} className="border-t border-[var(--color-border)]">
                      <td className="px-4 py-2.5 text-theme">{row.space}</td>
                      <td className="px-4 py-2.5 text-theme-secondary">
                        {formatCopPerMonthFromUsd(row.usdMonth)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-theme">
              <Upload className="h-4 w-4 text-theme-muted" strokeWidth={1.75} />
              Reproducir (lo que más pesa)
            </h3>
            <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)]">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/[0.03] text-theme-muted dark:bg-white/[0.04]">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Tráfico de salida / mes</th>
                    <th className="px-4 py-2.5 font-medium">Coste aprox.</th>
                  </tr>
                </thead>
                <tbody>
                  {EGRESS_ROWS.map((row) => (
                    <tr key={row.traffic} className="border-t border-[var(--color-border)]">
                      <td className="px-4 py-2.5 text-theme">{row.traffic}</td>
                      <td className="px-4 py-2.5 text-theme-secondary">
                        {formatCopPerMonthFromUsd(row.usdMonth)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm leading-relaxed text-theme-secondary">
          <p className="font-medium text-theme">Ejemplo rápido</p>
          <p className="mt-1">
            Un video de <strong className="text-theme">50 MB</strong> visto{' '}
            <strong className="text-theme">1.000 veces</strong> genera ≈ 50 GB de salida ≈{' '}
            <strong className="text-theme">{formatCopPerMonthFromUsd(6)}</strong> (además del coste
            de guardar el archivo). Por eso comprimimos y conviene YouTube para piezas muy largas o
            muy vistas.
          </p>
        </div>
      </section>

      <section className="glass-card w-full space-y-4 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-gold-dim dark:text-gold-light" strokeWidth={1.75} />
          <div>
            <h2 className="font-display text-xl text-theme">Recomendaciones para el equipo</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-theme-secondary">
              <li>
                Presupuesto cómodo al inicio:{' '}
                <strong className="text-theme">{formatCopMonthlyRangeFromUsd(10, 30)}</strong>{' '}
                entre almacenamiento y reproducciones ligeras.
              </li>
              <li>
                Catálogo razonable sin preocuparse mucho: hasta{' '}
                <strong className="text-theme">200–500 GB</strong> guardados.
              </li>
              <li>
                Configura alertas de presupuesto en Google Cloud (p. ej. aviso equivalente a{' '}
                <strong className="text-theme">{formatCopFromUsd(20)}</strong> y{' '}
                <strong className="text-theme">{formatCopFromUsd(50)}</strong> al mes).
              </li>
              <li>
                Si el tráfico de la app crece mucho, valorar Cloud CDN delante del bucket para abaratar
                las reproducciones.
              </li>
            </ul>
            <p className="mt-4 text-xs text-theme-muted">
              Referencia de precios:{' '}
              <a
                href="https://cloud.google.com/storage/pricing"
                target="_blank"
                rel="noreferrer"
                className="text-gold-dim underline-offset-2 hover:underline dark:text-gold-light"
              >
                cloud.google.com/storage/pricing
              </a>
              . Conversión con TRM orientativa {formatCop(USD_TO_COP, 0)} / US$. Última revisión del
              equipo: julio 2026.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
