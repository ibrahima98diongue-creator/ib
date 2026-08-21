import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListPageShell } from "@/components/ListPageShell";
import { LinkButton } from "@/components/ui/Button";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { siteStatusLabels } from "@/lib/labels";
import Link from "next/link";

export default async function InstallationsPage() {
  const session = await auth();
  const [installations, hasSites] = await Promise.all([
    prisma.installation.findMany({
      where: { site: { companyId: session!.user.companyId } },
      include: { site: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.site.count({ where: { companyId: session!.user.companyId } }),
  ]);

  return (
    <ListPageShell
      title="Installations"
      description="Les installations photovoltaïques rattachées à vos sites."
      count={installations.length}
      addHref="/installations/nouveau"
      addLabel="+ Ajouter une installation"
      emptyTitle="Aucune installation"
      emptyDescription={
        hasSites > 0
          ? "Vous n'avez encore aucune installation."
          : "Créez d'abord un site, puis ajoutez ses installations."
      }
      emptyActions={
        hasSites > 0 ? (
          <LinkButton href="/installations/nouveau" variant="primary">
            + Ajouter une installation
          </LinkButton>
        ) : (
          <LinkButton href="/sites/nouveau" variant="primary">
            + Ajouter un site
          </LinkButton>
        )
      }
    >
      <Table>
        <Thead>
          <Th>Nom</Th>
          <Th>Site</Th>
          <Th>Type</Th>
          <Th>Capacité</Th>
          <Th>Statut</Th>
          <Th />
        </Thead>
        <Tbody>
          {installations.map((installation) => (
            <tr key={installation.id} className="hover:bg-gray-50">
              <Td>
                <Link
                  href={`/installations/${installation.id}`}
                  className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                >
                  {installation.name}
                </Link>
              </Td>
              <Td className="text-[var(--color-text-secondary)]">
                <Link href={`/sites/${installation.site.id}`} className="hover:text-[var(--color-primary)]">
                  {installation.site.name}
                </Link>
              </Td>
              <Td className="text-[var(--color-text-secondary)]">{installation.type || "—"}</Td>
              <Td className="text-[var(--color-text-secondary)]">
                {installation.capacityKwc ? `${installation.capacityKwc} kWc` : "—"}
              </Td>
              <Td>
                <Badge tone={siteStatusLabels[installation.status].tone}>
                  {siteStatusLabels[installation.status].label}
                </Badge>
              </Td>
              <Td className="text-right">
                <Link
                  href={`/installations/${installation.id}`}
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
