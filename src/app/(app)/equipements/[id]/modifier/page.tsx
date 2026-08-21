import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { EquipementForm } from "../../EquipementForm";
import { updateEquipement } from "@/lib/actions/equipements";

export default async function ModifierEquipementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const [equipement, installations] = await Promise.all([
    prisma.equipement.findFirst({
      where: { id, installation: { site: { companyId: session!.user.companyId } } },
    }),
    prisma.installation.findMany({
      where: { site: { companyId: session!.user.companyId } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!equipement) notFound();

  const action = updateEquipement.bind(null, equipement.id);

  return (
    <div>
      <PageHeader title={`Modifier ${equipement.name}`} />
      <EquipementForm action={action} equipement={equipement} installations={installations} />
    </div>
  );
}
