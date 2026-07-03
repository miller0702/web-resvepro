export interface SortableItem {
  code: string;
  sortOrder: number;
}

export function assignSortOrder<T extends SortableItem>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, sortOrder: index + 1 }));
}

/** Reordena por drag-and-drop y reasigna sortOrder 1..n. */
export function reorderByCodes<T extends SortableItem>(
  items: T[],
  fromCode: string,
  toCode: string,
): T[] {
  const fromIndex = items.findIndex((i) => i.code === fromCode);
  const toIndex = items.findIndex((i) => i.code === toCode);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return items;

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return assignSortOrder(next);
}
