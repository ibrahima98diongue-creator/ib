import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { MeteoForm } from "../MeteoForm";
import { createMeteo } from "@/lib/actions/meteo";

export default async function NouvelleMeteoPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string }>;
}) {
  const { siteId } = await searchParams;
  const session = await auth();
  const sites = await prisma.site.findMany({
    where: { companyId: session!.user.companyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Ajouter une donnée météo" />
      {sites.length === 0 ? (
        <EmptyState
          title="Aucun site"
          description="Créez d'abord un site avant d'ajouter une donnée météo."
          actions={
            <LinkButton href="/sites/nouveau" variant="primary">
              + Ajouter un site
            </LinkButton>
          }
        />
      ) : (
        <MeteoForm action={createMeteo} sites={sites} defaultSiteId={siteId} />
      )}
    </div>
  );
}
