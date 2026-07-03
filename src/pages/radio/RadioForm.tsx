import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MediaUpload } from '../../components/MediaUpload';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';

export function RadioFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new';

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

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title={isNew ? 'Nueva emisora' : 'Editar emisora'}
        action={!isNew ? (
          <Badge variant={form.isPublished ? 'success' : 'muted'}>
            {form.isPublished ? 'Publicado' : 'Borrador'}
          </Badge>
        ) : undefined}
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
          {!isNew ? (
            <Button type="button" variant="danger" onClick={async () => {
              if (confirm('¿Eliminar emisora?')) {
                await adminApi.deleteRadio(id!);
                navigate('/radio');
              }
            }}>Eliminar</Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
