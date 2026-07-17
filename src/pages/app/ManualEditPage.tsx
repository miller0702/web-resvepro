import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { platformApi } from '../../api/platform';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';
import { useForm } from 'react-hook-form';
import type { ManualSection } from './ManualPage';

interface FormValues {
  title: string;
  body: string;
  isVisible: boolean;
}

export function ManualEditPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['manual-sections', 'ALL'],
    queryFn: async () => {
      const res = await platformApi.getManualSections('ALL');
      return res.data.data as ManualSection[];
    },
  });

  const section = data?.find((s) => s.code === code);

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: { title: '', body: '', isVisible: true },
  });

  useEffect(() => {
    if (section) {
      reset({
        title: section.title,
        body: section.body,
        isVisible: section.isVisible,
      });
    }
  }, [section, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      platformApi.bulkUpdateManualSections([
        {
          code: code!,
          title: values.title,
          body: values.body,
          isVisible: values.isVisible,
        },
      ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-sections'] });
      const audience = section?.audience === 'PANEL' ? 'PANEL' : 'APP';
      navigate(
        audience === 'PANEL' ? '/app?tab=manual&audience=PANEL' : '/app?tab=manual',
      );
    },
  });

  const backTo =
    section?.audience === 'PANEL' ? '/app?tab=manual&audience=PANEL' : '/app?tab=manual';

  if (isLoading) return <Loading />;
  if (!section) {
    return (
      <div>
        <p className="text-theme-secondary">Sección no encontrada.</p>
        <Link to="/app?tab=manual" className="mt-4 inline-block text-gold-dim dark:text-gold-light">
          Volver al manual
        </Link>
      </div>
    );
  }

  const isVisible = watch('isVisible');

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`Editar: ${section.title}`}
        subtitle={`Sección del manual (${section.audience === 'PANEL' ? 'panel web' : 'app móvil'}) · ${section.code}`}
        backTo={backTo}
      />

      <form
        onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
        className="glass-card space-y-5 p-8"
      >
        <Input label="Título" {...register('title', { required: true })} />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-theme-secondary">Contenido</label>
          <textarea {...register('body', { required: true })} rows={18} className="input-field font-mono text-sm" />
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 surface-muted" style={{ borderColor: 'var(--color-border)' }}>
          <input
            type="checkbox"
            checked={isVisible}
            onChange={(e) => setValue('isVisible', e.target.checked)}
            className="h-4 w-4 accent-gold"
          />
          <span className="text-sm text-theme-secondary">
            {section.audience === 'PANEL' ? 'Visible en el manual del panel' : 'Visible en el manual de la app'}
          </span>
        </label>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" strokeWidth={1.75} />
            {saveMutation.isPending ? 'Guardando...' : 'Guardar sección'}
          </Button>
          <Link to={backTo}>
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
