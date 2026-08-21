import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { MeteoForm } from "../../MeteoForm";
import { updateMeteo } from "@/lib/actions/meteo";

export default async function ModifierMeteoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const [meteo, sites] = await Promise.all([
    prisma.meteo.findFirst({ where: { id, site: { companyId: session!.user.companyId } } }),
    prisma.site.findMany({
      where: { companyId: session!.user.companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!meteo) notFound();

  const action = updateMeteo.bind(null, meteo.id);

  return (
    <div>
      <PageHeader title="Modifier la donnée météo" />
      <MeteoForm action={action} meteo={meteo} sites={sites} />
    </div>
  );
}
