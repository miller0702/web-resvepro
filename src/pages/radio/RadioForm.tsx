import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MediaUpload } from '../../components/MediaUpload';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { ResourceModeHeaderAction, useResourceMode } from '../../hooks/useResourceMode';
import { DetailField, DetailFlags, DetailGrid, DetailSection } from '../../components/ui/DetailView';

export function RadioFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new';
  const { isView, editHref } = useResourceMode();

  const [form, setForm] = useState({
    name: '',
    streamUrl: '',
    description: '',
    sortOrder: 0,
    isLive: true,
    isPublished: false,
  });

  const stationQuery = useQuery({
    queryKey: ['radio-station', id],
    queryFn: async () => (await adminApi.getRadioStation(id!)).data.data as Record<string, unknown>,
    enabled: !isNew && Boolean(id),
  });

  useEffect(() => {
    if (stationQuery.data) {
      const s = stationQuery.data;
      setForm({
        name: String(s.name ?? ''),
        streamUrl: String(s.streamUrl ?? ''),
        description: String(s.description ?? ''),
        sortOrder: Number(s.sortOrder ?? 0),
        isLive: Boolean(s.isLive),
        isPublished: Boolean(s.isPublished),
      });
    }
  }, [stationQuery.data]);

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteRadio(id!),
    onSuccess: () => navigate('/radio'),
  });

  const save = async () => {
    if (isNew) {
      const res = await adminApi.createRadio(form);
      navigate(`/radio/${(res.data.data as { id: string }).id}`);
    } else {
      await adminApi.updateRadio(id!, form);
      queryClient.invalidateQueries({ queryKey: ['radio-station', id] });
    }
  };

  if (!isNew && stationQuery.isLoading) return <Loading />;

  const isPublished = form.isPublished;
  const stationName = form.name || 'Emisora';

  const headerActions = !isNew ? (
    <ResourceModeHeaderAction
      isView={isView}
      editHref={editHref}
      extra={
        <Badge variant={isPublished ? 'success' : 'muted'}>
          {isPublished ? 'Publicado' : 'Borrador'}
        </Badge>
      }
      isPublished={isPublished}
      entityLabel="emisora"
      busy={deleteMutation.isPending}
      onTogglePublish={() => {
        void adminApi.updateRadio(id!, { isPublished: !isPublished }).then(() => {
          setForm((f) => ({ ...f, isPublished: !isPublished }));
          queryClient.invalidateQueries({ queryKey: ['radio-station', id] });
        });
      }}
      onDelete={() => deleteMutation.mutate()}
    />
  ) : undefined;

  if (!isNew && isView) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title={stationName} subtitle="Vista de detalle" action={headerActions} backTo="/radio" />

        <DetailSection>
          <div className="space-y-5">
          <DetailFlags>
            {form.isLive ? <Badge variant="success">En vivo</Badge> : null}
            <Badge variant={isPublished ? 'success' : 'muted'}>
              {isPublished ? 'Publicado' : 'Borrador'}
            </Badge>
          </DetailFlags>
          <DetailGrid>
            <DetailField label="Nombre">{form.name || null}</DetailField>
            <DetailField label="Orden">{String(form.sortOrder)}</DetailField>
            <DetailField label="URL del stream" span={2}>
              {form.streamUrl ? (
                <a
                  href={form.streamUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-gold-dim underline-offset-2 hover:underline dark:text-gold-light"
                >
                  {form.streamUrl}
                </a>
              ) : null}
            </DetailField>
            <DetailField label="Descripción" span={2}>
              {form.description ? (
                <p className="whitespace-pre-wrap text-theme-secondary">{form.description}</p>
              ) : null}
            </DetailField>
          </DetailGrid>
          </div>
        </DetailSection>

        <Button type="button" variant="ghost" onClick={() => navigate('/radio')}>
          Volver al listado
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title={isNew ? 'Nueva emisora' : 'Editar emisora'}
        subtitle={!isNew ? stationName : undefined}
        action={headerActions}
        backTo="/radio"
      />
      <div className="glass-card w-full space-y-4 p-8">
        <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="URL del stream" value={form.streamUrl} onChange={(e) => setForm({ ...form, streamUrl: e.target.value })} />
        <textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input label="Orden" type="number" value={String(form.sortOrder)} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
        {!isNew ? (
          <MediaUpload
            label="Portada"
            accept="image/*"
            mediaType="IMAGE"
            onUploaded={async (asset) => {
              await adminApi.updateRadio(id!, { coverId: asset.id });
              queryClient.invalidateQueries({ queryKey: ['radio-station', id] });
            }}
          />
        ) : null}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isLive} onChange={(e) => setForm({ ...form, isLive: e.target.checked })} />
          En vivo
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
          Publicado
        </label>
        <div className="flex gap-2">
          <Button type="button" onClick={save}>Guardar</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/radio')}>Volver</Button>
        </div>
      </div>
    </div>
  );
}
