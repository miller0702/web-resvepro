import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { platformApi } from '../../api/platform';
import { PageHeader } from '../../components/ui/PageHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { APP_ICON_GROUPS, APP_SECTION_LABELS, getIconPreview } from '../../lib/app-icons';

const schema = z.object({
  tabTitle: z.string().min(1, 'Título de pestaña requerido'),
  headerGreeting: z.string().optional(),
  headerTitle: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().min(1),
  iconActive: z.string().min(1),
  emptyIcon: z.string().optional(),
  searchPlaceholder: z.string().optional(),
  emptyMessage: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0),
  isVisible: z.boolean(),
});

type FormData = z.infer<typeof schema>;

function IconSelect({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const Preview = getIconPreview(value);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-theme-secondary">{label}</label>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-dim dark:text-gold-light">
          <Preview className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field flex-1"
        >
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
    </div>
  );
}

export function AppSectionEditPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: section, isLoading } = useQuery({
    queryKey: ['app-section', code],
    queryFn: async () => {
      const res = await platformApi.getAppSection(code!);
      return res.data.data as FormData & { code: string };
    },
    enabled: Boolean(code),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (section) {
      reset({
        tabTitle: section.tabTitle,
        headerGreeting: section.headerGreeting ?? '',
        headerTitle: section.headerTitle ?? '',
        subtitle: section.subtitle ?? '',
        description: section.description ?? '',
        icon: section.icon,
        iconActive: section.iconActive,
        emptyIcon: section.emptyIcon ?? '',
        searchPlaceholder: section.searchPlaceholder ?? '',
        emptyMessage: section.emptyMessage ?? '',
        sortOrder: section.sortOrder,
        isVisible: section.isVisible,
      });
    }
  }, [section, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => platformApi.updateAppSection(code!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-sections'] });
      queryClient.invalidateQueries({ queryKey: ['app-section', code] });
      navigate('/app');
    },
  });

  if (isLoading) return <Loading />;

  return (
    <div className="w-full">
      <PageHeader
        title={`Editar: ${APP_SECTION_LABELS[code ?? ''] ?? code}`}
        subtitle="Personaliza cómo se muestra esta sección en la app móvil."
      />

      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="glass-card w-full space-y-5 p-6 sm:p-8"
      >
        <Input label="Título en la pestaña" error={errors.tabTitle?.message} {...register('tabTitle')} />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="Saludo del encabezado" {...register('headerGreeting')} />
          <Input label="Título principal" {...register('headerTitle')} />
        </div>

        <Input label="Subtítulo / descripción corta" {...register('subtitle')} />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-theme-secondary">Descripción interna</label>
          <textarea {...register('description')} rows={3} className="input-field" />
        </div>

        <Controller
          name="icon"
          control={control}
          render={({ field }) => (
            <IconSelect label="Icono (inactivo)" value={field.value} onChange={field.onChange} />
          )}
        />

        <Controller
          name="iconActive"
          control={control}
          render={({ field }) => (
            <IconSelect label="Icono (activo)" value={field.value} onChange={field.onChange} />
          )}
        />

        <Controller
          name="emptyIcon"
          control={control}
          render={({ field }) => (
            <IconSelect label="Icono estado vacío" value={field.value || 'empty-library'} onChange={field.onChange} />
          )}
        />

        <Input label="Placeholder del buscador" {...register('searchPlaceholder')} />
        <Input label="Mensaje cuando no hay contenido" {...register('emptyMessage')} />

        <Input
          label="Orden en la barra de pestañas"
          type="number"
          min={0}
          {...register('sortOrder')}
        />

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 surface-muted" style={{ borderColor: 'var(--color-border)' }}>
          <input type="checkbox" {...register('isVisible')} className="h-4 w-4 accent-gold" />
          <span className="text-sm text-theme-secondary">Mostrar sección en la app</span>
        </label>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
            {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/app')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
