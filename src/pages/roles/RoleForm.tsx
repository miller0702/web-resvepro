import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { PageHeader } from '../../components/ui/PageHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { PermissionPicker } from '../../components/PermissionPicker';
import { Loading } from '../../components/ui/Loading';

const schema = z.object({
  code: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Usa MAYÚSCULAS y guiones bajos (ej. EDITOR_LIBROS)'),
  name: z.string().min(2, 'Nombre requerido'),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'Selecciona al menos un permiso'),
});

type FormData = z.infer<typeof schema>;

export function RoleFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: role, isLoading } = useQuery({
    queryKey: ['role', id],
    queryFn: async () => {
      const res = await adminApi.getRole(id!);
      return res.data.data as {
        id: string;
        code: string;
        name: string;
        description?: string;
        permissions: string[];
        isImmutable?: boolean;
      };
    },
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { code: '', name: '', description: '', permissions: [] },
  });

  useEffect(() => {
    if (role) {
      reset({
        code: role.code,
        name: role.name,
        description: role.description ?? '',
        permissions: role.permissions,
      });
    }
  }, [role, reset]);

  const createMutation = useMutation({
    mutationFn: (data: FormData) => adminApi.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      navigate('/roles');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      adminApi.updateRole(id!, {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', id] });
      navigate('/roles');
    },
  });

  const onSubmit = async (data: FormData) => {
    if (isEdit) {
      await updateMutation.mutateAsync(data);
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const readOnly = isEdit && role?.isImmutable;
  const saving = isSubmitting || createMutation.isPending || updateMutation.isPending;
  const apiError =
    (createMutation.error as { response?: { data?: { message?: string | string[] } } })?.response
      ?.data?.message ??
    (updateMutation.error as { response?: { data?: { message?: string | string[] } } })?.response
      ?.data?.message;

  if (isEdit && isLoading) return <Loading />;

  return (
    <div className="w-full">
      <PageHeader
        title={isEdit ? 'Editar rol' : 'Nuevo rol del panel'}
        backTo="/roles"
        subtitle={
          isEdit
            ? 'Actualiza el nombre, descripción y permisos de este rol.'
            : 'Define un rol personalizado y selecciona a qué funcionalidades del panel tendrá acceso.'
        }
      />

      {readOnly && (
        <div className="mb-6 rounded-xl bg-gold/10 px-4 py-3 text-sm text-gold-dim">
          Este rol del sistema no se puede modificar desde el panel.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="glass-card w-full space-y-6 p-8">
        <Input
          label="Código"
          placeholder="EDITOR_LIBROS"
          error={errors.code?.message}
          disabled={isEdit}
          {...register('code')}
        />
        {!isEdit && (
          <p className="-mt-3 text-xs text-theme-muted">
            Identificador único en mayúsculas. No se puede cambiar después de crear el rol.
          </p>
        )}

        <Input
          label="Nombre"
          placeholder="Editor de libros"
          error={errors.name?.message}
          disabled={readOnly}
          {...register('name')}
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-theme-secondary">Descripción</label>
          <textarea
            {...register('description')}
            disabled={readOnly}
            className="input-field disabled:opacity-60"
            rows={3}
            placeholder="Describe las responsabilidades de este rol..."
          />
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-theme-secondary">Permisos del panel</p>
          <p className="mb-4 text-sm text-theme-muted">
            Los lectores de la app móvil usan el rol LECTOR del sistema; no se gestionan aquí.
          </p>
          <Controller
            name="permissions"
            control={control}
            render={({ field }) => (
              <PermissionPicker
                selected={field.value}
                onChange={field.onChange}
                disabled={readOnly}
              />
            )}
          />
          {errors.permissions && (
            <p className="mt-2 text-sm text-ember">{errors.permissions.message}</p>
          )}
        </div>

        {apiError && (
          <div className="rounded-xl bg-ember/10 px-4 py-3 text-sm text-ember">
            {Array.isArray(apiError) ? apiError.join(', ') : apiError}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {!readOnly && (
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear rol'}
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={() => navigate('/roles')}>
            {readOnly ? 'Volver' : 'Cancelar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
