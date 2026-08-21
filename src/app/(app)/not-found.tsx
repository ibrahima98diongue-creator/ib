import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

// Remplace la page 404 générique de Next.js (non stylée, en anglais) par
// une page cohérente avec le reste de l'application — atteinte quand un
// utilisateur connecté suit un lien obsolète ou une fiche supprimée
// (les pages de détail appellent notFound() dans ce cas).
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState
        title="Page introuvable"
        description="Cette page n'existe pas ou l'élément que vous cherchez a été supprimé."
        actions={
          <LinkButton href="/" variant="primary">
            Retour au tableau de bord
          </LinkButton>
        }
      />
    </div>
  );
}
