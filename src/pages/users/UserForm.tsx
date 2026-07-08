import { useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { PageHeader } from '../../components/ui/PageHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { ADMIN_ROLE_CODES } from '../../lib/rbac';

const baseSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .regex(/^[a-z0-9._-]+$/, 'Solo minúsculas, números, puntos y guiones'),
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').optional(),
  roleCodes: z.array(z.string()).min(1, 'Selecciona al menos un rol'),
  isActive: z.boolean(),
  canPost: z.boolean(),
});

type FormData = z.infer<typeof baseSchema>;

export function UserFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const defaultContext = searchParams.get('context') === 'app' ? 'app' : 'panel';

  const userQuery = useQuery({
    queryKey: ['admin-user', id],
    queryFn: async () => (await adminApi.getUserById(id!)).data.data as Record<string, unknown>,
    enabled: isEdit,
  });

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await adminApi.getRoles();
      return res.data.data as Array<{ code: string; name: string }>;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      roleCodes: defaultContext === 'app' ? ['LECTOR'] : ['ADMIN_GENERAL'],
      isActive: true,
      canPost: true,
    },
  });

  const selectedRoles = watch('roleCodes');

  useEffect(() => {
    if (userQuery.data) {
      reset({
        email: String(userQuery.data.email),
        username: String(userQuery.data.username),
        firstName: String(userQuery.data.firstName ?? ''),
        lastName: String(userQuery.data.lastName ?? ''),
        roleCodes: (userQuery.data.roles as string[]) ?? [],
        isActive: Boolean(userQuery.data.isActive),
        canPost: userQuery.data.canPost !== false,
      });
    }
  }, [userQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      if (!isEdit && !data.password) {
        throw new Error('La contraseña es obligatoria');
      }
      const payload = {
        email: data.email,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        roleCodes: data.roleCodes,
        isActive: data.isActive,
        canPost: data.canPost,
        ...(data.password ? { password: data.password } : {}),
      };
      return isEdit ? adminApi.updateUser(id!, payload) : adminApi.createUser(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteUserAccount(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
  });

  const toggleRole = (code: string) => {
    const next = selectedRoles.includes(code)
      ? selectedRoles.filter((r) => r !== code)
      : [...selectedRoles, code];
    setValue('roleCodes', next, { shouldValidate: true });
  };

  if (isEdit && userQuery.isLoading) return <Loading />;

  const assignableRoles = (rolesQuery.data ?? []).filter((r) =>
    defaultContext === 'app' ? r.code === 'LECTOR' : ADMIN_ROLE_CODES.includes(r.code as (typeof ADMIN_ROLE_CODES)[number]),
  );

  return (
    <div className="w-full max-w-2xl">
      <PageHeader
        title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
        subtitle={
          defaultContext === 'app'
            ? 'Cuenta de lector para la app móvil'
            : 'Cuenta con acceso al panel administrativo'
        }
      />

      <form
        onSubmit={handleSubmit((d) => saveMutation.mutate(d))}
        className="glass-card space-y-5 p-8"
      >
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} disabled={isEdit} />
        <Input label="Usuario" error={errors.username?.message} {...register('username')} disabled={isEdit} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre" error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Apellido" error={errors.lastName?.message} {...register('lastName')} />
        </div>
        <Input
          label={isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}
          type="password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium text-theme-secondary">Roles</p>
          <div className="flex flex-wrap gap-2">
            {assignableRoles.map((role) => {
              const active = selectedRoles.includes(role.code);
              return (
                <button
                  key={role.code}
                  type="button"
                  onClick={() => toggleRole(role.code)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    active
                      ? 'border-gold/40 bg-gold/10 text-gold-dim dark:text-gold-light'
                      : 'border-[var(--color-border)] text-theme-secondary hover:bg-[var(--color-bg-subtle)]'
                  }`}
                >
                  {role.name}
                </button>
              );
            })}
          </div>
          {errors.roleCodes && (
            <p className="text-sm text-ember">{errors.roleCodes.message}</p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-theme-secondary">
          <input type="checkbox" {...register('isActive')} className="rounded" />
          Cuenta activa (puede iniciar sesión)
        </label>

        {defaultContext === 'app' ? (
          <label className="flex items-center gap-2 text-sm text-theme-secondary">
            <input type="checkbox" {...register('canPost')} className="rounded" />
            Puede publicar en la comunidad
          </label>
        ) : null}

        {isEdit && defaultContext === 'app' ? (
          <div className="rounded-xl border border-ember/30 bg-ember/5 p-4">
            <p className="text-sm font-medium text-ember">Zona de riesgo</p>
            <p className="mt-1 text-sm text-theme-secondary">
              Elimina y anonimiza la cuenta del lector, borrando datos personales y publicaciones.
            </p>
            <Button
              type="button"
              variant="danger"
              className="mt-3"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    '¿Eliminar esta cuenta de forma permanente? Esta acción no se puede deshacer.',
                  )
                ) {
                  deleteMutation.mutate();
                }
              }}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar cuenta'}
            </Button>
          </div>
        ) : null}

        {saveMutation.isError && (
          <p className="text-sm text-ember">No se pudo guardar el usuario. Revisa los datos.</p>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting || saveMutation.isPending}>
            {isEdit ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
          <Link to="/users">
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
