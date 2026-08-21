import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { ChantierForm } from "../../ChantierForm";
import { updateChantier } from "@/lib/actions/chantiers";

export default async function ModifierChantierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const [chantier, sites] = await Promise.all([
    prisma.chantier.findFirst({ where: { id, site: { companyId: session!.user.companyId } } }),
    prisma.site.findMany({
      where: { companyId: session!.user.companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!chantier) notFound();

  const action = updateChantier.bind(null, chantier.id);

  return (
    <div>
      <PageHeader title={`Modifier ${chantier.name}`} />
      <ChantierForm action={action} chantier={chantier} sites={sites} />
    </div>
  );
}
