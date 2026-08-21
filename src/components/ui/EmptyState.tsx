export function EmptyState({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border-strong)] bg-white px-6 py-16 text-center">
      <p className="text-base font-medium text-[var(--color-text)]">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-[var(--color-text-secondary)]">
          {description}
        </p>
      )}
      {actions && <div className="mt-6 flex items-center gap-3">{actions}</div>}
    </div>
  );
}
