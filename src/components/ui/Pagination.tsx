import Link from "next/link";

// Navigation Précédent/Suivant partagée par toutes les pages de liste.
// Ne s'affiche pas s'il n'y a qu'une seule page.
export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const linkClass =
    "rounded-md border border-[var(--color-border-strong)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-gray-50";
  const disabledClass = "rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-muted)] opacity-50";

  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      {page > 1 ? (
        <Link href={buildHref(page - 1)} className={linkClass}>
          ← Précédent
        </Link>
      ) : (
        <span className={disabledClass}>← Précédent</span>
      )}
      <span className="text-sm text-[var(--color-text-secondary)]">
        Page {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={buildHref(page + 1)} className={linkClass}>
          Suivant →
        </Link>
      ) : (
        <span className={disabledClass}>Suivant →</span>
      )}
    </div>
  );
}