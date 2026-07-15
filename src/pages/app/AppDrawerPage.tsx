import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Menu, Save } from 'lucide-react';
import { platformApi } from '../../api/platform';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
import { IconPicker } from '../../components/ui/IconPicker';
import { getIconPreview } from '../../lib/app-icons';
import { SortableList } from '../../components/sortable/SortableList';
import { assignSortOrder } from '../../utils/reorder';

interface DrawerItem {
  id: string;
  code: string;
  groupTitle: string;
  groupSortOrder: number;
  label: string;
  href: string;
  icon: string;
  sortOrder: number;
  isVisible: boolean;
}

interface DrawerGroup {
  code: string;
  groupTitle: string;
  groupSortOrder: number;
  items: DrawerItem[];
}

function buildGroups(items: DrawerItem[]): DrawerGroup[] {
  const map = new Map<string, DrawerItem[]>();
  for (const item of items) {
    const list = map.get(item.groupTitle) ?? [];
    list.push(item);
    map.set(item.groupTitle, list);
  }

  return [...map.entries()]
    .map(([groupTitle, groupItems]) => ({
      code: groupTitle,
      groupTitle,
      groupSortOrder: groupItems[0]?.groupSortOrder ?? 0,
      items: [...groupItems].sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .sort((a, b) => a.groupSortOrder - b.groupSortOrder);
}

function flattenGroups(groups: DrawerGroup[]): DrawerItem[] {
  return groups.flatMap((group, groupIndex) =>
    group.items.map((item, itemIndex) => ({
      ...item,
      groupTitle: group.groupTitle,
      groupSortOrder: groupIndex + 1,
      sortOrder: itemIndex + 1,
    })),
  );
}

export function AppDrawerPage({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['drawer-items'],
    queryFn: async () => {
      const res = await platformApi.getDrawerItems();
      return res.data.data as DrawerItem[];
    },
  });

  const [items, setItems] = useState<DrawerItem[]>([]);

  useEffect(() => {
    if (data) setItems(data);
  }, [data]);

  const groups = useMemo(() => buildGroups(items), [items]);

  const saveMutation = useMutation({
    mutationFn: (payload: DrawerItem[]) =>
      platformApi.bulkUpdateDrawerItems(
        payload.map((item) => ({
          code: item.code,
          groupTitle: item.groupTitle,
          groupSortOrder: item.groupSortOrder,
          label: item.label,
          href: item.href,
          icon: item.icon,
          sortOrder: item.sortOrder,
          isVisible: item.isVisible,
        })),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drawer-items'] }),
  });

  const persistGroups = (nextGroups: DrawerGroup[]) => {
    const flat = flattenGroups(nextGroups);
    setItems(flat);
    saveMutation.mutate(flat);
  };

  const reorderGroups = (ordered: DrawerGroup[]) => {
    persistGroups(ordered);
  };

  const reorderItemsInGroup = (groupTitle: string, orderedItems: DrawerItem[]) => {
    const nextGroups = groups.map((g) =>
      g.groupTitle === groupTitle
        ? { ...g, items: assignSortOrder(orderedItems) }
        : g,
    );
    persistGroups(nextGroups);
  };

  const updateItem = (code: string, patch: Partial<DrawerItem>) => {
    setItems((prev) => prev.map((item) => (item.code === code ? { ...item, ...patch } : item)));
  };

  if (isLoading) return <Loading />;

  return (
    <div>
      {!embedded ? (
        <PageHeader
          title="Menú lateral"
          subtitle="Etiquetas, iconos, rutas y visibilidad de los ítems del drawer en la app móvil."
        />
      ) : null}

      <div className="mb-6 flex items-start gap-3 rounded-xl bg-sage/10 p-4 dark:bg-sage/15">
        <Menu className="mt-0.5 h-5 w-5 shrink-0 text-sage" strokeWidth={1.75} />
        <p className="text-sm text-theme-secondary">
          Arrastra los grupos y los ítems dentro de cada grupo para cambiar el orden del menú lateral.
          Las rutas deben coincidir con pantallas existentes (ej.{' '}
          <code className="rounded bg-black/5 px-1">/settings</code>).
        </p>
      </div>

      <SortableList
        items={groups}
        disabled={saveMutation.isPending}
        onReorder={reorderGroups}
        className="space-y-8"
        renderItem={(group) => (
          <section className="glass-card overflow-hidden">
            <div className="border-b px-5 py-4" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <h3 className="font-display text-lg text-theme">{group.groupTitle}</h3>
              <p className="text-xs text-theme-muted">Grupo {group.groupSortOrder}</p>
            </div>
            <div className="p-4">
              <SortableList
                items={group.items}
                disabled={saveMutation.isPending}
                onReorder={(ordered) => reorderItemsInGroup(group.groupTitle, ordered)}
                renderItem={(item) => {
                  const Icon = getIconPreview(item.icon);
                  return (
                    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border-subtle)' }}>
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold-dim dark:text-gold-light">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-mono text-xs text-theme-muted">{item.code}</p>
                          <Badge variant={item.isVisible ? 'success' : 'muted'}>
                            {item.isVisible ? 'Visible' : 'Oculto'}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <Input
                          label="Etiqueta"
                          value={item.label}
                          onChange={(e) => updateItem(item.code, { label: e.target.value })}
                        />
                        <Input
                          label="Ruta (href)"
                          value={item.href}
                          onChange={(e) => updateItem(item.code, { href: e.target.value })}
                        />
                        <div className="sm:col-span-2 xl:col-span-3">
                          <IconPicker
                            label="Icono"
                            value={item.icon}
                            onChange={(icon) => updateItem(item.code, { icon })}
                          />
                        </div>
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 surface-muted sm:col-span-2 xl:col-span-3" style={{ borderColor: 'var(--color-border)' }}>
                          <input
                            type="checkbox"
                            checked={item.isVisible}
                            onChange={(e) => updateItem(item.code, { isVisible: e.target.checked })}
                            className="h-4 w-4 accent-gold"
                          />
                          <span className="text-sm text-theme-secondary">Mostrar en el menú lateral</span>
                        </label>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          </section>
        )}
      />

      <div className="mt-6">
        <Button onClick={() => saveMutation.mutate(items)} disabled={saveMutation.isPending}>
          <Save className="mr-2 h-4 w-4" strokeWidth={1.75} />
          {saveMutation.isPending ? 'Guardando...' : 'Guardar menú lateral'}
        </Button>
      </div>
    </div>
  );
}
