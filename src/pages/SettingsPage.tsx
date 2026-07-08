import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Globe, Link2, Lock, Palette, Settings2, ShieldCheck } from 'lucide-react';
import { platformApi } from '../api/platform';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loading } from '../components/ui/Loading';
import { Badge } from '../components/ui/Badge';
import { getUser } from '../lib/auth';
import { buildLegalPublicUrl } from '../utils/legalSlugs';

type Tab = 'general' | 'branding' | 'security' | 'legal';

interface LegalDocument {
  id: string;
  type: string;
  title: string;
  content: string;
  version: string;
  isPublished: boolean;
  updatedAt: string;
}

interface SecuritySettings {
  jwtAccessExpires: string;
  jwtRefreshExpires: string;
  passwordResetExpires: string;
  authRateLimitPerMinute: number;
}

const LEGAL_LABELS: Record<string, string> = {
  TERMS: 'Términos y condiciones',
  PRIVACY: 'Política de privacidad',
  COOKIES: 'Política de cookies',
  ACCEPTABLE_USE: 'Normas de uso aceptable',
};

const DURATION_HINTS = [
  { label: '15 min', value: '15m' },
  { label: '1 hora', value: '1h' },
  { label: '7 días', value: '7d' },
  { label: '30 días', value: '30d' },
  { label: '90 días', value: '90d' },
];

export function SettingsPage() {
  const queryClient = useQueryClient();
  const isSuperAdmin = getUser()?.roles?.includes('SUPER_ADMIN') ?? false;
  const [tab, setTab] = useState<Tab>('general');
  const [selectedLegalType, setSelectedLegalType] = useState<string>('TERMS');

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const res = await platformApi.getSettings();
      return res.data.data as Record<string, string>;
    },
  });

  const { data: securitySettings, isLoading: loadingSecurity } = useQuery({
    queryKey: ['security-settings'],
    queryFn: async () => {
      const res = await platformApi.getSecuritySettings();
      return res.data.data as SecuritySettings;
    },
    enabled: isSuperAdmin,
  });

  const { data: legalDocs, isLoading: loadingLegal } = useQuery({
    queryKey: ['legal-documents'],
    queryFn: async () => {
      const res = await platformApi.getLegalDocuments();
      return res.data.data as LegalDocument[];
    },
  });

  const [form, setForm] = useState({
    publicSiteUrl: 'https://resvepro.web.app',
    supportEmail: '',
    welcomeMessage: '',
    maintenanceMode: 'false',
    maintenanceMessage: '',
    serviceUnavailableMode: 'false',
    unavailableMessage: '',
    minAppVersion: '1.0.0',
    seasonTheme: 'none',
    seasonAutoMode: 'false',
    appName: '',
    appTagline: '',
    colorPrimaryLight: '#c9a227',
    colorPrimaryDark: '#e8c547',
    colorAccentLight: '#4a6741',
    colorAccentDark: '#6b8f61',
    colorBackgroundLight: '#f7f3ec',
    colorBackgroundDark: '#0c0f14',
    logoUrl: '',
    logoUrlDark: '',
    logoMarkUrl: '',
  });

  const [securityForm, setSecurityForm] = useState<SecuritySettings>({
    jwtAccessExpires: '15m',
    jwtRefreshExpires: '90d',
    passwordResetExpires: '1h',
    authRateLimitPerMinute: 10,
  });

  const [legalForm, setLegalForm] = useState({
    title: '',
    content: '',
    version: '1.0',
    isPublished: false,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        publicSiteUrl: settings.publicSiteUrl ?? 'https://resvepro.web.app',
        supportEmail: settings.supportEmail ?? '',
        welcomeMessage: settings.welcomeMessage ?? '',
        maintenanceMode: settings.maintenanceMode ?? 'false',
        maintenanceMessage: settings.maintenanceMessage ?? '',
        serviceUnavailableMode: settings.serviceUnavailableMode ?? 'false',
        unavailableMessage: settings.unavailableMessage ?? '',
        minAppVersion: settings.minAppVersion ?? '1.0.0',
        seasonTheme: settings.seasonTheme ?? 'none',
        seasonAutoMode: settings.seasonAutoMode ?? 'false',
        appName: settings.appName ?? '',
        appTagline: settings.appTagline ?? '',
        colorPrimaryLight: settings.colorPrimaryLight ?? '#c9a227',
        colorPrimaryDark: settings.colorPrimaryDark ?? '#e8c547',
        colorAccentLight: settings.colorAccentLight ?? '#4a6741',
        colorAccentDark: settings.colorAccentDark ?? '#6b8f61',
        colorBackgroundLight: settings.colorBackgroundLight ?? '#f7f3ec',
        colorBackgroundDark: settings.colorBackgroundDark ?? '#0c0f14',
        logoUrl: settings.logoUrl ?? '',
        logoUrlDark: settings.logoUrlDark ?? '',
        logoMarkUrl: settings.logoMarkUrl ?? '',
      });
    }
  }, [settings]);

  useEffect(() => {
    if (securitySettings) {
      setSecurityForm(securitySettings);
    }
  }, [securitySettings]);

  useEffect(() => {
    const doc = legalDocs?.find((d) => d.type === selectedLegalType);
    if (doc) {
      setLegalForm({
        title: doc.title,
        content: doc.content,
        version: doc.version,
        isPublished: doc.isPublished,
      });
    }
  }, [legalDocs, selectedLegalType]);

  const saveSettingsMutation = useMutation({
    mutationFn: () => platformApi.updateSettings(form),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-settings'] }),
  });

  const saveSecurityMutation = useMutation({
    mutationFn: () => platformApi.updateSecuritySettings(securityForm),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['security-settings'] }),
  });

  const saveLegalMutation = useMutation({
    mutationFn: () => platformApi.updateLegalDocument(selectedLegalType, legalForm),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['legal-documents'] }),
  });

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings2 },
    { id: 'branding' as const, label: 'Marca y colores', icon: Palette },
    ...(isSuperAdmin
      ? [{ id: 'security' as const, label: 'Seguridad', icon: Lock }]
      : []),
    { id: 'legal' as const, label: 'Legal y políticas', icon: ShieldCheck },
  ];

  return (
    <div>
      <PageHeader
        title="Configuración"
        subtitle="Ajustes de la plataforma, seguridad de sesiones, textos legales y documentos de la app."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                tab === item.id
                  ? 'bg-gold/15 text-gold-dim dark:text-gold-light'
                  : 'surface-muted text-theme-secondary hover:opacity-90'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === 'general' && (
        <div className="glass-card w-full space-y-5 p-6 sm:p-8">
          {loadingSettings ? (
            <Loading />
          ) : (
            <>
              <div className="flex items-start gap-3 rounded-xl bg-sage/10 p-4 dark:bg-sage/15">
                <Globe className="mt-0.5 h-5 w-5 shrink-0 text-sage" strokeWidth={1.75} />
                <p className="text-sm text-theme-secondary">
                  Estos ajustes afectan la experiencia en la app móvil: mensajes de bienvenida,
                  contacto de soporte y modo mantenimiento.
                </p>
              </div>

              <Input
                label="URL pública del sitio"
                value={form.publicSiteUrl}
                onChange={(e) => setForm((f) => ({ ...f, publicSiteUrl: e.target.value }))}
                placeholder="https://resvepro.web.app"
              />
              <p className="-mt-3 text-xs text-theme-muted">
                Base para enlaces legales públicos (Play Store, app). Ejemplo privacidad:{' '}
                {buildLegalPublicUrl(form.publicSiteUrl || 'https://resvepro.web.app', 'PRIVACY')}
                {' · '}
                Eliminación de cuenta:{' '}
                {(form.publicSiteUrl || 'https://resvepro.web.app').replace(/\/$/, '')}/account-deletion
              </p>
              <Input
                label="Email de soporte"
                value={form.supportEmail}
                onChange={(e) => setForm((f) => ({ ...f, supportEmail: e.target.value }))}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-theme-secondary">
                  Mensaje de bienvenida
                </label>
                <textarea
                  value={form.welcomeMessage}
                  onChange={(e) => setForm((f) => ({ ...f, welcomeMessage: e.target.value }))}
                  rows={3}
                  className="input-field"
                />
              </div>
              <Input
                label="Versión mínima de la app"
                value={form.minAppVersion}
                onChange={(e) => setForm((f) => ({ ...f, minAppVersion: e.target.value }))}
              />
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 surface-muted" style={{ borderColor: 'var(--color-border)' }}>
                <input
                  type="checkbox"
                  checked={form.maintenanceMode === 'true'}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, maintenanceMode: e.target.checked ? 'true' : 'false' }))
                  }
                  className="h-4 w-4 accent-gold"
                />
                <span className="text-sm text-theme-secondary">
                  Modo mantenimiento (la app muestra pantalla de mantenimiento)
                </span>
              </label>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-theme-secondary">
                  Mensaje de mantenimiento (opcional)
                </label>
                <textarea
                  value={form.maintenanceMessage}
                  onChange={(e) => setForm((f) => ({ ...f, maintenanceMessage: e.target.value }))}
                  rows={3}
                  className="input-field"
                  placeholder="Texto personalizado para la pantalla de mantenimiento en la app móvil."
                />
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 surface-muted" style={{ borderColor: 'var(--color-border)' }}>
                <input
                  type="checkbox"
                  checked={form.serviceUnavailableMode === 'true'}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      serviceUnavailableMode: e.target.checked ? 'true' : 'false',
                    }))
                  }
                  className="h-4 w-4 accent-gold"
                />
                <span className="text-sm text-theme-secondary">
                  Servicio no disponible (emergencia: API caída o incidente grave)
                </span>
              </label>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-theme-secondary">
                  Mensaje de servicio no disponible (opcional)
                </label>
                <textarea
                  value={form.unavailableMessage}
                  onChange={(e) => setForm((f) => ({ ...f, unavailableMessage: e.target.value }))}
                  rows={3}
                  className="input-field"
                  placeholder="Texto para la pantalla de emergencia cuando el servicio no está operativo."
                />
              </div>
              <Button
                onClick={() => saveSettingsMutation.mutate()}
                disabled={saveSettingsMutation.isPending}
              >
                {saveSettingsMutation.isPending ? 'Guardando...' : 'Guardar configuración'}
              </Button>
            </>
          )}
        </div>
      )}

      {tab === 'branding' && (
        <div className="glass-card w-full space-y-5 p-6 sm:p-8">
          {loadingSettings ? (
            <Loading />
          ) : (
            <>
              <div className="flex items-start gap-3 rounded-xl bg-gold/10 p-4 dark:bg-gold/15">
                <Palette className="mt-0.5 h-5 w-5 shrink-0 text-gold-dim dark:text-gold-light" strokeWidth={1.75} />
                <p className="text-sm text-theme-secondary">
                  Nombre, colores y logos de la app móvil. Los cambios se aplican al reiniciar o
                  refrescar la app (cache ~5 min). Deja las URLs de logo vacías para usar los assets
                  embebidos.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label="Nombre de la app"
                  value={form.appName}
                  onChange={(e) => setForm((f) => ({ ...f, appName: e.target.value }))}
                />
                <Input
                  label="Eslogan / tagline"
                  value={form.appTagline}
                  onChange={(e) => setForm((f) => ({ ...f, appTagline: e.target.value }))}
                />
              </div>

              <div className="space-y-4 rounded-xl border p-4 surface-muted" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="text-sm font-semibold text-theme">Temporadas temáticas</h3>
                <p className="text-sm text-theme-secondary">
                  Aplica paletas especiales (Navidad, Pascua, Adviento, Pentecostés). Con modo automático,
                  la app elige la temporada según el calendario.
                </p>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.seasonAutoMode === 'true'}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, seasonAutoMode: e.target.checked ? 'true' : 'false' }))
                    }
                    className="h-4 w-4 accent-gold"
                  />
                  <span className="text-sm text-theme-secondary">Detectar temporada automáticamente</span>
                </label>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-theme-secondary">Temporada manual</label>
                  <select
                    className="input-field"
                    value={form.seasonTheme}
                    disabled={form.seasonAutoMode === 'true'}
                    onChange={(e) => setForm((f) => ({ ...f, seasonTheme: e.target.value }))}
                  >
                    <option value="none">Sin temporada</option>
                    <option value="christmas">Navidad</option>
                    <option value="easter">Pascua</option>
                    <option value="advent">Adviento</option>
                    <option value="pentecost">Pentecostés</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <ColorField
                  label="Color primario (tema claro)"
                  value={form.colorPrimaryLight}
                  onChange={(v) => setForm((f) => ({ ...f, colorPrimaryLight: v }))}
                />
                <ColorField
                  label="Color primario (tema oscuro)"
                  value={form.colorPrimaryDark}
                  onChange={(v) => setForm((f) => ({ ...f, colorPrimaryDark: v }))}
                />
                <ColorField
                  label="Color acento (tema claro)"
                  value={form.colorAccentLight}
                  onChange={(v) => setForm((f) => ({ ...f, colorAccentLight: v }))}
                />
                <ColorField
                  label="Color acento (tema oscuro)"
                  value={form.colorAccentDark}
                  onChange={(v) => setForm((f) => ({ ...f, colorAccentDark: v }))}
                />
                <ColorField
                  label="Fondo (tema claro)"
                  value={form.colorBackgroundLight}
                  onChange={(v) => setForm((f) => ({ ...f, colorBackgroundLight: v }))}
                />
                <ColorField
                  label="Fondo (tema oscuro)"
                  value={form.colorBackgroundDark}
                  onChange={(v) => setForm((f) => ({ ...f, colorBackgroundDark: v }))}
                />
              </div>

              <Input
                label="URL logo completo (tema claro)"
                value={form.logoUrl}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                placeholder="https://..."
              />
              <Input
                label="URL logo completo (tema oscuro)"
                value={form.logoUrlDark}
                onChange={(e) => setForm((f) => ({ ...f, logoUrlDark: e.target.value }))}
                placeholder="https://..."
              />
              <Input
                label="URL icono / isotipo"
                value={form.logoMarkUrl}
                onChange={(e) => setForm((f) => ({ ...f, logoMarkUrl: e.target.value }))}
                placeholder="https://..."
              />

              <Button
                onClick={() => saveSettingsMutation.mutate()}
                disabled={saveSettingsMutation.isPending}
              >
                {saveSettingsMutation.isPending ? 'Guardando...' : 'Guardar marca y colores'}
              </Button>
            </>
          )}
        </div>
      )}

      {tab === 'security' && isSuperAdmin && (
        <div className="glass-card w-full space-y-5 p-6 sm:p-8">
          {loadingSecurity ? (
            <Loading />
          ) : (
            <>
              <div className="flex items-start gap-3 rounded-xl bg-ember/10 p-4 dark:bg-ember/15">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-ember" strokeWidth={1.75} />
                <div className="space-y-1 text-sm text-theme-secondary">
                  <p>
                    Controla la duración de tokens y límites de autenticación. Los cambios aplican
                    a <strong className="font-semibold text-theme">nuevos inicios de sesión</strong>;
                    las sesiones activas conservan su expiración hasta refrescar o volver a entrar.
                  </p>
                  <p className="text-xs text-theme-muted">
                    Formato de duración: número + unidad (<code className="rounded bg-black/5 px-1">m</code> minutos,{' '}
                    <code className="rounded bg-black/5 px-1">h</code> horas,{' '}
                    <code className="rounded bg-black/5 px-1">d</code> días). Ej: 15m, 1h, 90d.
                  </p>
                </div>
              </div>

              <DurationField
                label="Duración del access token"
                hint="Tiempo antes de que la app deba refrescar la sesión."
                value={securityForm.jwtAccessExpires}
                onChange={(value) => setSecurityForm((f) => ({ ...f, jwtAccessExpires: value }))}
                presets={['15m', '30m', '1h']}
              />

              <DurationField
                label="Duración del refresh token"
                hint="Tiempo máximo de sesión persistente sin volver a iniciar sesión."
                value={securityForm.jwtRefreshExpires}
                onChange={(value) => setSecurityForm((f) => ({ ...f, jwtRefreshExpires: value }))}
                presets={['7d', '30d', '90d']}
              />

              <DurationField
                label="Expiración enlace recuperar contraseña"
                hint="Validez del token enviado por email al olvidar contraseña."
                value={securityForm.passwordResetExpires}
                onChange={(value) => setSecurityForm((f) => ({ ...f, passwordResetExpires: value }))}
                presets={['30m', '1h', '24h']}
              />

              <Input
                label="Intentos de login por minuto (por IP)"
                type="number"
                min={5}
                max={120}
                value={String(securityForm.authRateLimitPerMinute)}
                onChange={(e) =>
                  setSecurityForm((f) => ({
                    ...f,
                    authRateLimitPerMinute: Number(e.target.value) || 10,
                  }))
                }
              />
              <p className="-mt-3 text-xs text-theme-muted">
                Referencia documentada; el límite en caliente puede requerir reinicio del API según despliegue.
              </p>

              <Button
                onClick={() => saveSecurityMutation.mutate()}
                disabled={saveSecurityMutation.isPending}
              >
                {saveSecurityMutation.isPending ? 'Guardando...' : 'Guardar seguridad'}
              </Button>
            </>
          )}
        </div>
      )}

      {tab === 'legal' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_1fr]">
          <div className="glass-card space-y-2 p-4">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-theme-muted">
              Documentos
            </p>
            {loadingLegal ? (
              <Loading />
            ) : (
              legalDocs?.map((doc) => (
                <button
                  key={doc.type}
                  type="button"
                  onClick={() => setSelectedLegalType(doc.type)}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${
                    selectedLegalType === doc.type
                      ? 'bg-gold/10 text-gold-dim dark:text-gold-light'
                      : 'hover:bg-[var(--color-bg-subtle)]'
                  }`}
                >
                  <FileText className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-theme">
                      {LEGAL_LABELS[doc.type] ?? doc.title}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant={doc.isPublished ? 'success' : 'muted'}>
                        {doc.isPublished ? 'Publicado' : 'Borrador'}
                      </Badge>
                      <span className="text-xs text-theme-muted">v{doc.version}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="glass-card w-full space-y-5 p-6 sm:p-8">
            {legalForm.isPublished ? (
              <div className="rounded-xl border border-sage/30 bg-sage/10 p-4 dark:bg-sage/15">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium text-theme">
                      <Link2 className="h-4 w-4 text-sage" strokeWidth={1.75} />
                      URL pública
                    </p>
                    <p className="mt-1 break-all font-mono text-sm text-theme-secondary">
                      {buildLegalPublicUrl(
                        settings?.publicSiteUrl ?? 'https://resvepro.web.app',
                        selectedLegalType,
                      )}
                    </p>
                    <p className="mt-2 text-xs text-theme-muted">
                      Usa esta URL en Google Play Console y en la ficha de la app.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const url = buildLegalPublicUrl(
                        settings?.publicSiteUrl ?? 'https://resvepro.web.app',
                        selectedLegalType,
                      );
                      void navigator.clipboard.writeText(url);
                    }}
                  >
                    Copiar URL
                  </Button>
                </div>
              </div>
            ) : null}
            <div className="rounded-xl bg-gold/10 p-4 dark:bg-gold/15">
              <p className="text-sm text-ink/70 dark:text-parchment/70">
                El usuario de la app debe aceptar estos documentos al registrarse o cuando publiques
                una nueva versión. Usa Markdown o texto plano.
              </p>
            </div>

            <Input
              label="Título"
              value={legalForm.title}
              onChange={(e) => setLegalForm((f) => ({ ...f, title: e.target.value }))}
            />
            <Input
              label="Versión"
              value={legalForm.version}
              onChange={(e) => setLegalForm((f) => ({ ...f, version: e.target.value }))}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink/80 dark:text-parchment/80">
                Contenido
              </label>
              <textarea
                value={legalForm.content}
                onChange={(e) => setLegalForm((f) => ({ ...f, content: e.target.value }))}
                rows={14}
                className="input-field font-mono text-sm"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink/10 bg-white/50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <input
                type="checkbox"
                checked={legalForm.isPublished}
                onChange={(e) => setLegalForm((f) => ({ ...f, isPublished: e.target.checked }))}
                className="h-4 w-4 accent-gold"
              />
              <span className="text-sm text-ink/80 dark:text-parchment/80">
                Publicar (visible en la app para aceptación del usuario)
              </span>
            </label>
            <Button
              onClick={() => saveLegalMutation.mutate()}
              disabled={saveLegalMutation.isPending}
            >
              {saveLegalMutation.isPending ? 'Guardando...' : 'Guardar documento'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-theme-secondary">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-14 cursor-pointer rounded-lg border border-[var(--color-border)] bg-transparent"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function DurationField({
  label,
  hint,
  value,
  onChange,
  presets,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  presets: string[];
}) {
  return (
    <div className="space-y-2">
      <Input label={label} value={value} onChange={(e) => onChange(e.target.value)} />
      <p className="text-xs text-theme-muted">{hint}</p>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              value === preset
                ? 'bg-gold/20 text-gold-dim dark:text-gold-light'
                : 'surface-muted text-theme-secondary hover:opacity-90'
            }`}
          >
            {DURATION_HINTS.find((h) => h.value === preset)?.label ?? preset}
          </button>
        ))}
      </div>
    </div>
  );
}
