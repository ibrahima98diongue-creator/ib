import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { MaintenanceForm } from "../../MaintenanceForm";
import { updateMaintenance } from "@/lib/actions/maintenances";

export default async function ModifierMaintenancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const [maintenance, sites, equipementRows] = await Promise.all([
    prisma.maintenance.findFirst({ where: { id, site: { companyId: session!.user.companyId } } }),
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
  if (!maintenance) notFound();

  const equipements = equipementRows.map((e) => ({ id: e.id, name: e.name, siteId: e.installation.siteId }));
  const action = updateMaintenance.bind(null, maintenance.id);

  return (
    <div>
      <PageHeader title={`Modifier ${maintenance.title}`} />
      <MaintenanceForm action={action} maintenance={maintenance} sites={sites} equipements={equipements} />
    </div>
  );
}
