/**
 * TRM orientativa para mostrar costes en pesos colombianos en el panel.
 * Actualízala cuando cambie mucho el dólar; son estimaciones, no factura real.
 */
export const USD_TO_COP = 4200;

export function usdToCop(usd: number): number {
  return usd * USD_TO_COP;
}

/** Formato moneda COP (es-CO): $ 5.300 */
export function formatCop(amountCop: number, decimals = 0): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amountCop);
}

export function formatCopFromUsd(usd: number, decimals = 0): string {
  return formatCop(usdToCop(usd), decimals);
}

export function formatCopPerMonthFromUsd(usd: number, decimals = 0): string {
  const cop = usdToCop(usd);
  // Costes muy bajos (pocos MB): mostrar centavos de peso si hace falta.
  const digits = cop > 0 && cop < 1 ? 2 : decimals;
  return `~ ${formatCop(cop, digits)} / mes`;
}

export function formatCopMonthlyRangeFromUsd(minUsd: number, maxUsd: number): string {
  return `${formatCopFromUsd(minUsd)} – ${formatCopFromUsd(maxUsd)} / mes`;
}

/** Tarifa por GB en COP (p. ej. almacenamiento o egress). */
export function formatCopPerGbFromUsd(usdPerGb: number): string {
  const cop = usdToCop(usdPerGb);
  return `${formatCop(cop, cop < 1000 ? 0 : 0)} / GB`;
}
