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
import { APP_ICON_GROUPS } from '../../lib/app-icons';
import type { TutorialStep } from './TutorialPage';

interface FormValues {
  title: string;
  body: string;
  icon: string;
  isVisible: boolean;
}

export function TutorialEditPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['tutorial-steps'],
    queryFn: async () => {
      const res = await platformApi.getTutorialSteps();
      return res.data.data as TutorialStep[];
    },
  });

  const step = data?.find((s) => s.code === code);

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: { title: '', body: '', icon: 'home', isVisible: true },
  });

  useEffect(() => {
    if (step) {
      reset({
        title: step.title,
        body: step.body,
        icon: step.icon,
        isVisible: step.isVisible,
      });
    }
  }, [step, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      platformApi.bulkUpdateTutorialSteps([
        {
          code: code!,
          title: values.title,
          body: values.body,
          icon: values.icon,
          isVisible: values.isVisible,
        },
      ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorial-steps'] });
      navigate('/app?tab=tutorial');
    },
  });

  if (isLoading) return <Loading />;
  if (!step) {
    return (
      <div>
        <p className="text-theme-secondary">Paso no encontrado.</p>
        <Link to="/app?tab=tutorial" className="mt-4 inline-block text-gold-dim dark:text-gold-light">
          Volver al tutorial
        </Link>
      </div>
    );
  }

  const isVisible = watch('isVisible');

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`Editar paso: ${step.title}`}
        subtitle={`Tutorial de bienvenida · ${step.code}`}
        action={
          <Link
            to="/app?tab=tutorial"
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
          <label className="block text-sm font-medium text-theme-secondary">Descripción</label>
          <textarea {...register('body', { required: true })} rows={6} className="input-field" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-theme-secondary">Icono</label>
          <select {...register('icon')} className="input-field">
            {APP_ICON_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.icons.map((icon) => (
                  <option key={icon.value} value={icon.value}>
                    {icon.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 surface-muted" style={{ borderColor: 'var(--color-border)' }}>
          <input
            type="checkbox"
            checked={isVisible}
            onChange={(e) => setValue('isVisible', e.target.checked)}
            className="h-4 w-4 accent-gold"
          />
          <span className="text-sm text-theme-secondary">Incluir en el tutorial</span>
        </label>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" strokeWidth={1.75} />
            {saveMutation.isPending ? 'Guardando...' : 'Guardar paso'}
          </Button>
          <Link to="/app?tab=tutorial">
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
