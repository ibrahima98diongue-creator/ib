import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { EquipementForm } from "../EquipementForm";
import { createEquipement } from "@/lib/actions/equipements";

export default async function NouvelEquipementPage({
  searchParams,
}: {
  searchParams: Promise<{ installationId?: string }>;
}) {
  const { installationId } = await searchParams;
  const session = await auth();
  const installations = await prisma.installation.findMany({
    where: { site: { companyId: session!.user.companyId } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Ajouter un équipement" />
      {installations.length === 0 ? (
        <EmptyState
          title="Aucune installation"
          description="Créez d'abord une installation avant d'ajouter un équipement."
          actions={
            <LinkButton href="/installations/nouveau" variant="primary">
              + Ajouter une installation
            </LinkButton>
          }
        />
      ) : (
        <EquipementForm
          action={createEquipement}
          installations={installations}
          defaultInstallationId={installationId}
        />
      )}
    </div>
  );
}
