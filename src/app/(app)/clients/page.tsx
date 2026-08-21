import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListPageShell } from "@/components/ListPageShell";
import { LinkButton } from "@/components/ui/Button";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import Link from "next/link";

export default async function ClientsPage() {
  const session = await auth();
  const clients = await prisma.client.findMany({
    where: { companyId: session!.user.companyId },
    include: { _count: { select: { sites: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <ListPageShell
      title="Clients"
      description="Les clients pour lesquels vous exploitez des sites."
      count={clients.length}
      addHref="/clients/nouveau"
      addLabel="+ Ajouter un client"
      emptyTitle="Aucun client"
      emptyDescription="Vous n'avez encore aucun client."
      emptyActions={
        <LinkButton href="/clients/nouveau" variant="primary">
          + Ajouter un client
        </LinkButton>
      }
    >
      <Table>
        <Thead>
          <Th>Nom</Th>
          <Th>Contact</Th>
          <Th>Sites</Th>
          <Th>Téléphone</Th>
          <Th />
        </Thead>
        <Tbody>
          {clients.map((client) => (
            <tr key={client.id} className="hover:bg-gray-50">
              <Td>
                <Link
                  href={`/clients/${client.id}`}
                  className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                >
                  {client.name}
                </Link>
              </Td>
              <Td className="text-[var(--color-text-secondary)]">{client.contact || "—"}</Td>
              <Td className="text-[var(--color-text-secondary)]">{client._count.sites}</Td>
              <Td className="text-[var(--color-text-secondary)]">{client.phone || "—"}</Td>
              <Td className="text-right">
                <Link
                  href={`/clients/${client.id}`}
                  className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                  Consulter
                </Link>
              </Td>
            </tr>
          ))}
        </Tbody>
      </Table>
    </ListPageShell>
  );
}
