import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { MaintenanceForm } from "../MaintenanceForm";
import { createMaintenance } from "@/lib/actions/maintenances";

export default async function NouvelleMaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string }>;
}) {
  const { siteId } = await searchParams;
  const session = await auth();
  const [sites, equipementRows] = await Promise.all([
    prisma.site.findMany({
      where: { companyId: session!.user.companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.equipement.findMany({
      where: { installation: { site: { companyId: session!.user.companyId } } },
      select: { id: true, name: true, installation: { select: { siteId: true } } },
      orderBy: { name: "asc" },
    }),
  ]);
  const equipements = equipementRows.map((e) => ({ id: e.id, name: e.name, siteId: e.installation.siteId }));

  return (
    <div>
      <PageHeader title="Ajouter une maintenance" />
      {sites.length === 0 ? (
        <EmptyState
          title="Aucun site"
          description="Créez d'abord un site avant d'ajouter une maintenance."
          actions={
            <LinkButton href="/sites/nouveau" variant="primary">
              + Ajouter un site
            </LinkButton>
          }
        />
      ) : (
        <MaintenanceForm
          action={createMaintenance}
          sites={sites}
          equipements={equipements}
          defaultSiteId={siteId}
        />
      )}
    </div>
  );
}
