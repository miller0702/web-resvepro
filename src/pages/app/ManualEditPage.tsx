import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
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
    queryKey: ['manual-sections'],
    queryFn: async () => {
      const res = await platformApi.getManualSections();
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
      navigate('/app?tab=manual');
    },
  });

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
        subtitle={`Sección del manual · ${section.code}`}
        action={
          <Link
            to="/app?tab=manual"
            className="inline-flex items-center gap-2 text-sm font-medium text-theme-secondary hover:text-theme"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Volver
          </Link>
        }
      />

      <form
        onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
        className="glass-card space-y-5 p-8"
      >
        <Input label="Título" {...register('title', { required: true })} />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-theme-secondary">Contenido</label>
          <textarea {...register('body', { required: true })} rows={12} className="input-field" />
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 surface-muted" style={{ borderColor: 'var(--color-border)' }}>
          <input
            type="checkbox"
            checked={isVisible}
            onChange={(e) => setValue('isVisible', e.target.checked)}
            className="h-4 w-4 accent-gold"
          />
          <span className="text-sm text-theme-secondary">Visible en la app</span>
        </label>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" strokeWidth={1.75} />
            {saveMutation.isPending ? 'Guardando...' : 'Guardar sección'}
          </Button>
          <Link to="/app?tab=manual">
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
