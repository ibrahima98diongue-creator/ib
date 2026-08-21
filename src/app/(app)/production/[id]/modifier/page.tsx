import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProductionForm } from "../../ProductionForm";
import { updateProduction } from "@/lib/actions/productions";

export default async function ModifierProductionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const [production, sites] = await Promise.all([
    prisma.production.findFirst({ where: { id, site: { companyId: session!.user.companyId } } }),
    prisma.site.findMany({
      where: { companyId: session!.user.companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!production) notFound();

  const action = updateProduction.bind(null, production.id);

  return (
    <div>
      <PageHeader title="Modifier la production" />
      <ProductionForm action={action} production={production} sites={sites} />
    </div>
  );
}
