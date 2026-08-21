import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListPageShell } from "@/components/ListPageShell";
import { LinkButton } from "@/components/ui/Button";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { siteStatusLabels } from "@/lib/labels";
import { PAGE_SIZE, parsePage, skipFor, totalPagesFor } from "@/lib/pagination";
import Link from "next/link";

export default async function SitesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const session = await auth();
  const where = { companyId: session!.user.companyId };
  const [sites, total, hasClients] = await Promise.all([
    prisma.site.findMany({
      where,
      include: { client: { select: { name: true } } },
      orderBy: { name: "asc" },
      skip: skipFor(page),
      take: PAGE_SIZE,
    }),
    prisma.site.count({ where }),
    prisma.client.count({ where: { companyId: session!.user.companyId } }),
  ]);

  return (
    <ListPageShell
      title="Sites"
      description="Les sites de production rattachés à vos clients."
      count={total}
      addHref="/sites/nouveau"
      addLabel="+ Ajouter un site"
      emptyTitle="Aucun site"
      emptyDescription={
        hasClients > 0 ? "Vous n'avez encore aucun site." : "Créez d'abord un client, puis ajoutez ses sites."
      }
      emptyActions={
        hasClients > 0 ? (
          <LinkButton href="/sites/nouveau" variant="primary">
            + Ajouter un site
          </LinkButton>
        ) : (
          <LinkButton href="/clients/nouveau" variant="primary">
            + Ajouter un client
          </LinkButton>
        )
      }
      page={page}
      totalPages={totalPagesFor(total)}
      buildPageHref={(p) => `/sites?page=${p}`}
    >
      <Table>
        <Thead>
          <Th>Nom</Th>
          <Th>Client</Th>
          <Th>Pays</Th>
          <Th>Puissance</Th>
          <Th>Statut</Th>
          <Th />
        </Thead>
        <Tbody>
          {sites.map((site) => (
            <tr key={site.id} className="hover:bg-gray-50">
              <Td>
                <Link
                  href={`/sites/${site.id}`}
                  className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                >
                  {site.name}
                </Link>
              </Td>
              <Td className="text-[var(--color-text-secondary)]">{site.client.name}</Td>
              <Td className="text-[var(--color-text-secondary)]">{site.country || "—"}</Td>
              <Td className="text-[var(--color-text-secondary)]">
                {site.powerKwc ? `${site.powerKwc} kWc` : "—"}
              </Td>
              <Td>
                <Badge tone={siteStatusLabels[site.status].tone}>{siteStatusLabels[site.status].label}</Badge>
              </Td>
              <Td className="text-right">
                <Link
                  href={`/sites/${site.id}`}
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
