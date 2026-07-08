import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../../api/public';
import { getConfig } from '../../config/environments';
import { BrandLogo } from '../../components/BrandLogo';
import { LEGAL_SLUG_LABELS, slugToLegalType } from '../../utils/legalSlugs';

function renderLegalContent(content: string) {
  return content.split('\n').map((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return (
        <h1 key={index} className="mb-4 mt-6 font-display text-2xl text-theme first:mt-0">
          {trimmed.slice(2)}
        </h1>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h2 key={index} className="mb-3 mt-5 text-lg font-semibold text-theme">
          {trimmed.slice(3)}
        </h2>
      );
    }
    if (!trimmed) {
      return <div key={index} className="h-3" />;
    }
    return (
      <p key={index} className="text-base leading-7 text-theme-secondary">
        {line}
      </p>
    );
  });
}

export function LegalPublicPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const legalType = slugToLegalType(slug);
  const { appName } = getConfig();
  const pageTitle = LEGAL_SLUG_LABELS[slug] ?? 'Documento legal';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-legal', legalType],
    enabled: !!legalType,
    queryFn: async () => {
      const res = await publicApi.getLegalDocument(legalType!);
      return res.data.data;
    },
  });

  if (!legalType) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-theme-page px-6">
        <div className="glass-card max-w-md p-8 text-center">
          <p className="text-theme-secondary">Documento no encontrado.</p>
          <Link to="/login" className="mt-4 inline-block text-sm text-gold-dim dark:text-gold-light">
            Ir al panel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-page">
      <header className="border-b px-4 py-5 sm:px-8" style={{ borderColor: 'var(--color-border)' }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo variant="icon" className="h-10 w-10" />
            <div>
              <p className="font-display text-lg text-theme">{appName}</p>
              <p className="text-sm text-theme-muted">{pageTitle}</p>
            </div>
          </div>
          <Link
            to="/login"
            className="text-sm text-theme-secondary transition hover:text-gold-dim dark:hover:text-gold-light"
          >
            Panel admin
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-12">
        <article className="glass-card p-6 sm:p-10">
          {isLoading ? (
            <p className="text-theme-muted">Cargando documento…</p>
          ) : isError || !data ? (
            <p className="text-theme-secondary">
              Este documento aún no está publicado. Vuelve a intentar más tarde.
            </p>
          ) : (
            <>
              <p className="mb-6 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                Versión {data.version}
              </p>
              <div className="space-y-1">{renderLegalContent(data.content)}</div>
            </>
          )}
        </article>
      </main>
    </div>
  );
}
