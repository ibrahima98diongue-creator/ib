import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { SiteForm } from "../SiteForm";
import { createSite } from "@/lib/actions/sites";

export default async function NouveauSitePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const session = await auth();
  const clients = await prisma.client.findMany({
    where: { companyId: session!.user.companyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Ajouter un site" />
      {clients.length === 0 ? (
        <EmptyState
          title="Aucun client"
          description="Créez d'abord un client avant d'ajouter un site."
          actions={
            <LinkButton href="/clients/nouveau" variant="primary">
              + Ajouter un client
            </LinkButton>
          }
        />
      ) : (
        <SiteForm action={createSite} clients={clients} defaultClientId={clientId} />
      )}
    </div>
  );
}
