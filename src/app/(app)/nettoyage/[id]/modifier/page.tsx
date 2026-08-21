import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { NettoyageForm } from "../../NettoyageForm";
import { updateNettoyage } from "@/lib/actions/nettoyages";

export default async function ModifierNettoyagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const [nettoyage, sites] = await Promise.all([
    prisma.nettoyage.findFirst({ where: { id, site: { companyId: session!.user.companyId } } }),
    prisma.site.findMany({
      where: { companyId: session!.user.companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!nettoyage) notFound();

  const action = updateNettoyage.bind(null, nettoyage.id);

  return (
    <div>
      <PageHeader title={`Modifier ${nettoyage.title}`} />
      <NettoyageForm action={action} nettoyage={nettoyage} sites={sites} />
    </div>
  );
}
