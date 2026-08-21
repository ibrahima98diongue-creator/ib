"use client";

import { useEffect } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button, LinkButton } from "@/components/ui/Button";

// Remplace l'écran d'erreur générique de Next.js par un message cohérent
// avec le reste de l'application. Le détail technique de l'erreur n'est
// jamais affiché à l'utilisateur (il pourrait exposer des informations
// internes) ; il part uniquement en console pour le diagnostic.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState
        title="Une erreur est survenue"
        description="Quelque chose s'est mal passé. Vous pouvez réessayer ou revenir au tableau de bord."
        actions={
          <>
            <Button variant="primary" onClick={reset}>
              Réessayer
            </Button>
            <LinkButton href="/">Retour au tableau de bord</LinkButton>
          </>
        }
      />
    </div>
  );
}
