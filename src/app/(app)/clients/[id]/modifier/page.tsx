import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClientForm } from "../../ClientForm";
import { updateClient } from "@/lib/actions/clients";

export default async function ModifierClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const client = await prisma.client.findFirst({
    where: { id, companyId: session!.user.companyId },
  });
  if (!client) notFound();

  const action = updateClient.bind(null, client.id);

  return (
    <div>
      <PageHeader title={`Modifier ${client.name}`} />
      <ClientForm action={action} client={client} />
    </div>
  );
}
