import { type ReactNode, useState } from 'react';
import { GripVertical } from 'lucide-react';

interface SortableListProps<T extends { code: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  disabled?: boolean;
  className?: string;
}

export function SortableList<T extends { code: string }>({
  items,
  onReorder,
  renderItem,
  disabled = false,
  className = 'space-y-3',
}: SortableListProps<T>) {
  const [dragCode, setDragCode] = useState<string | null>(null);
  const [overCode, setOverCode] = useState<string | null>(null);

  const move = (fromCode: string, toCode: string) => {
    if (fromCode === toCode) return;
    const fromIndex = items.findIndex((i) => i.code === fromCode);
    const toIndex = items.findIndex((i) => i.code === toCode);
    if (fromIndex < 0 || toIndex < 0) return;

    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onReorder(next);
  };

  return (
    <div className={className}>
      {items.map((item, index) => {
        const isDragging = dragCode === item.code;
        const isOver = overCode === item.code && dragCode !== item.code;

        return (
          <div
            key={item.code}
            draggable={!disabled}
            onDragStart={(e) => {
              if (disabled) return;
              e.stopPropagation();
              setDragCode(item.code);
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', item.code);
            }}
            onDragEnd={(e) => {
              e.stopPropagation();
              setDragCode(null);
              setOverCode(null);
            }}
            onDragOver={(e) => {
              if (disabled || !dragCode) return;
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'move';
              setOverCode(item.code);
            }}
            onDragLeave={() => {
              if (overCode === item.code) setOverCode(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const from = e.dataTransfer.getData('text/plain') || dragCode;
              if (from) move(from, item.code);
              setDragCode(null);
              setOverCode(null);
            }}
            className={`flex gap-2 rounded-xl transition ${
              isDragging ? 'opacity-40' : ''
            } ${isOver ? 'ring-2 ring-gold/40' : ''}`}
          >
            <button
              type="button"
              tabIndex={-1}
              className={`mt-1 flex h-10 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg text-theme-muted active:cursor-grabbing ${
                disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-[var(--color-bg-subtle)]'
              }`}
              aria-label="Arrastrar para reordenar"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
          </div>
        );
      })}
    </div>
  );
}
