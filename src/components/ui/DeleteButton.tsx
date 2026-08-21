"use client";

export function DeleteButton({
  action,
  id,
  confirmMessage,
  label = "Supprimer",
}: {
  action: (formData: FormData) => void;
  id: string;
  confirmMessage: string;
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="inline-flex h-8 items-center justify-center rounded-md border border-[var(--color-critical)]/30 bg-white px-3 text-sm font-medium text-[var(--color-critical)] hover:bg-[var(--color-critical-bg)]"
      >
        {label}
      </button>
    </form>
  );
}
