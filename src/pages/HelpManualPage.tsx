import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, List, Pencil } from 'lucide-react';
import { platformApi } from '../api/platform';
import { PageHeader } from '../components/ui/PageHeader';
import { Loading } from '../components/ui/Loading';
import type { ManualSection } from './app/ManualPage';

function bodyBlocks(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function isListHeavy(block: string) {
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return false;
  const listLike = lines.filter(
    (l) =>
      /^[•\-*–]/.test(l) ||
      /^\d+[\).\-]/.test(l) ||
      /^[–-]/.test(l),
  ).length;
  return listLike >= Math.ceil(lines.length * 0.6);
}

export function HelpManualPage() {
  const [activeCode, setActiveCode] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['manual-sections', 'PANEL'],
    queryFn: async () => {
      const res = await platformApi.getManualSections('PANEL');
      return res.data.data as ManualSection[];
    },
  });

  const sections = useMemo(
    () =>
      [...(data ?? [])]
        .filter((s) => s.isVisible)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [data],
  );

  useEffect(() => {
    if (sections.length && !activeCode) {
      setActiveCode(sections[0]!.code);
    }
  }, [sections, activeCode]);

  useEffect(() => {
    const nodes = sections
      .map((s) => document.getElementById(`manual-${s.code}`))
      .filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target.id?.replace(/^manual-/, '');
        if (top) setActiveCode(top);
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.1, 0.35, 0.6] },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (code: string) => {
    const el = document.getElementById(`manual-${code}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveCode(code);
  };

  if (isLoading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Manual del panel"
        subtitle="Guía completa para el equipo editorial y de operaciones de RESVEPRO."
        action={
          <Link
            to="/app?tab=manual&audience=PANEL"
            className="inline-flex items-center gap-2 rounded-xl bg-gold/15 px-4 py-2.5 text-sm font-medium text-gold-dim dark:text-gold-light"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.75} />
            Editar contenido
          </Link>
        }
      />

      <div className="mb-6 flex items-start gap-3 rounded-xl bg-sage/10 p-4 dark:bg-sage/15">
        <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-sage" strokeWidth={1.75} />
        <div className="text-sm text-theme-secondary">
          <p>
            Consulta esta guía para publicar contenido, moderar la comunidad y configurar la app.
            Para cambiar el texto, ve a{' '}
            <Link
              to="/app?tab=manual&audience=PANEL"
              className="font-medium text-gold-dim dark:text-gold-light"
            >
              App móvil → Manual → Panel web
            </Link>
            .
          </p>
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="text-sm text-theme-secondary">Aún no hay secciones del manual del panel.</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="glass-card p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-theme">
                <List className="h-4 w-4 text-gold-dim dark:text-gold-light" strokeWidth={1.75} />
                Índice
              </div>
              <nav className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto">
                {sections.map((section, index) => {
                  const active = activeCode === section.code;
                  return (
                    <button
                      key={section.code}
                      type="button"
                      onClick={() => scrollToSection(section.code)}
                      className={`rounded-lg px-3 py-2 text-left text-sm transition ${
                        active
                          ? 'bg-gold/15 font-medium text-gold-dim dark:text-gold-light'
                          : 'text-theme-secondary hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className="mr-2 text-xs text-theme-muted">{index + 1}.</span>
                      {section.title}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="space-y-5">
            {sections.map((section, index) => (
              <article
                key={section.code}
                id={`manual-${section.code}`}
                className="glass-card scroll-mt-6 p-6 sm:p-8"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">
                  Sección {index + 1}
                </p>
                <h2 className="mt-1 font-display text-2xl text-theme">{section.title}</h2>
                <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-theme-secondary">
                  {bodyBlocks(section.body).map((block, blockIndex) => {
                    if (isListHeavy(block)) {
                      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
                      const heading =
                        lines[0] && !/^[•\-*–\d]/.test(lines[0]) && !/^[–-]/.test(lines[0])
                          ? lines[0]
                          : null;
                      const items = heading ? lines.slice(1) : lines;
                      return (
                        <div key={`${section.code}-b-${blockIndex}`}>
                          {heading ? (
                            <p className="mb-2 font-semibold text-theme">{heading}</p>
                          ) : null}
                          <ul className="space-y-1.5 pl-1">
                            {items.map((line, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/70" />
                                <span className="whitespace-pre-wrap">
                                  {line.replace(/^[•\-*–]\s*/, '').replace(/^\d+[\).\-]\s*/, '')}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    return (
                      <p key={`${section.code}-b-${blockIndex}`} className="whitespace-pre-wrap">
                        {block}
                      </p>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
