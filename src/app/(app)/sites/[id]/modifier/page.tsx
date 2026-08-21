import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { SiteForm } from "../../SiteForm";
import { updateSite } from "@/lib/actions/sites";

export default async function ModifierSitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const [site, clients] = await Promise.all([
    prisma.site.findFirst({ where: { id, companyId: session!.user.companyId } }),
    prisma.client.findMany({
      where: { companyId: session!.user.companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!site) notFound();

  const action = updateSite.bind(null, site.id);

  return (
    <div>
      <PageHeader title={`Modifier ${site.name}`} />
      <SiteForm action={action} site={site} clients={clients} />
    </div>
  );
}
