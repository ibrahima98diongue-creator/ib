export const inputClass =
  "w-full rounded-md border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-bg)]";

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--color-border)] pb-6 mb-6 last:border-b-0 last:mb-0 last:pb-0">
      <h2 className="text-sm font-semibold text-[var(--color-text)]">{title}</h2>
      {description && (
        <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{description}</p>
      )}
      <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  required,
  full,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--color-text)]">
        {label} {required && <span className="text-[var(--color-critical)]">*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-[var(--color-critical)]">{error}</p>}
    </div>
  );
}
