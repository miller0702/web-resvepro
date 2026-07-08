export const LEGAL_TYPE_TO_SLUG: Record<string, string> = {
  TERMS: 'terms',
  PRIVACY: 'privacy',
  COOKIES: 'cookies',
  ACCEPTABLE_USE: 'acceptable-use',
};

export const LEGAL_SLUG_LABELS: Record<string, string> = {
  terms: 'Términos y condiciones',
  privacy: 'Política de privacidad',
  cookies: 'Política de cookies',
  'acceptable-use': 'Normas de uso aceptable',
};

export function slugToLegalType(slug: string): string | null {
  const entry = Object.entries(LEGAL_TYPE_TO_SLUG).find(([, value]) => value === slug);
  return entry?.[0] ?? null;
}

export function legalTypeToSlug(type: string): string {
  return LEGAL_TYPE_TO_SLUG[type] ?? type.toLowerCase();
}

export function buildLegalPublicUrl(siteUrl: string, type: string): string {
  const base = siteUrl.replace(/\/$/, '');
  return `${base}/legal/${legalTypeToSlug(type)}`;
}
