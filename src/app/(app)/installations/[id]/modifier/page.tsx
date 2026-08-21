import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { InstallationForm } from "../../InstallationForm";
import { updateInstallation } from "@/lib/actions/installations";

export default async function ModifierInstallationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const [installation, sites] = await Promise.all([
    prisma.installation.findFirst({
      where: { id, site: { companyId: session!.user.companyId } },
    }),
    prisma.site.findMany({
      where: { companyId: session!.user.companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!installation) notFound();

  const action = updateInstallation.bind(null, installation.id);

  return (
    <div>
      <PageHeader title={`Modifier ${installation.name}`} />
      <InstallationForm action={action} installation={installation} sites={sites} />
    </div>
  );
}
