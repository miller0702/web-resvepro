interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
}: DataTableProps<T>) {
  return (
    <div className="glass-card w-full overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr
              className="border-b"
              style={{
                borderColor: 'var(--color-border-subtle)',
                backgroundColor: 'var(--color-bg-subtle)',
              }}
            >
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-theme-muted"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-16 text-center text-theme-muted">
                  Sin registros
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={String(row[keyField])}
                  className="border-b transition hover:bg-gold/5 dark:hover:bg-gold/10"
                  style={{
                    borderColor: 'var(--color-border-subtle)',
                    backgroundColor: i % 2 === 0 ? 'var(--color-bg-subtle)' : 'transparent',
                  }}
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-5 py-4 text-theme-secondary">
                      {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
