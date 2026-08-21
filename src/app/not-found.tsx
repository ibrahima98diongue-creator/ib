import Link from "next/link";

// Filet de sécurité pour les routes en dehors du groupe (app) — par ex.
// une URL invalide tapée alors qu'on n'est pas connecté. Reprend la mise
// en page centrée de la page de connexion, sans le menu applicatif
// (l'utilisateur n'est pas forcément authentifié à ce stade).
export default function RootNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-white p-8 text-center shadow-[var(--shadow-sm)]">
        <h1 className="text-lg font-semibold text-[var(--color-text)]">Page introuvable</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Cette page n&apos;existe pas.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-[var(--color-primary)] px-4 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
