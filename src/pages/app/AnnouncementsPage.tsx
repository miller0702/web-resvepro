import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Send } from 'lucide-react';
import { communityAdminApi } from '../../api/community';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function AnnouncementsPage({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await communityAdminApi.listAnnouncements({ limit: 20 });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: () => communityAdminApi.createAnnouncement({ body: body.trim() }),
    onSuccess: () => {
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  return (
    <div>
      {!embedded ? (
        <PageHeader
          title="Anuncios oficiales"
          subtitle="Publica actualizaciones y novedades como @resvepro. Aparecen fijadas en el feed de la app."
        />
      ) : null}

      <div className="mb-6 flex items-start gap-3 rounded-xl bg-gold/10 p-4 dark:bg-gold/15">
        <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-gold-dim dark:text-gold-light" strokeWidth={1.75} />
        <p className="text-sm text-theme-secondary">
          Los anuncios se publican desde la cuenta oficial <strong className="text-theme">@resvepro</strong>.
          Los usuarios los verán destacados en Inicio y recibirán un aviso si hay uno nuevo desde su última visita.
        </p>
      </div>

      <div className="glass-card mb-8 space-y-4 p-6 sm:p-8">
        <label className="block text-sm font-medium text-theme-secondary">Nuevo anuncio</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className="input-field"
          placeholder="Ej: Nueva versión 1.2 disponible con mejoras en el lector y sincronización..."
        />
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!body.trim() || createMutation.isPending}
        >
          <Send className="mr-2 h-4 w-4" strokeWidth={1.75} />
          {createMutation.isPending ? 'Publicando...' : 'Publicar como @resvepro'}
        </Button>
      </div>

      <h3 className="mb-4 font-display text-xl text-theme">Historial</h3>
      {isLoading ? (
        <Loading />
      ) : (
        <div className="space-y-4">
          {(data?.data ?? []).map((post) => (
            <article key={post.id} className="glass-card p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="success">@resvepro</Badge>
                {post.isPinned ? <Badge variant="panel">Fijado</Badge> : null}
                <span className="text-xs text-theme-muted">
                  {formatDate(post.createdAt)}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-theme-secondary">{post.body}</p>
            </article>
          ))}
          {(data?.data ?? []).length === 0 && (
            <p className="text-sm text-theme-muted">Aún no hay anuncios publicados.</p>
          )}
        </div>
      )}
    </div>
  );
}
