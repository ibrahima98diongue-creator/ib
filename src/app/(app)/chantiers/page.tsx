import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListPageShell } from "@/components/ListPageShell";
import { LinkButton } from "@/components/ui/Button";
import { InterventionsTable } from "@/components/InterventionsSection";
import { chantierStatusLabels, priorityLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { PAGE_SIZE, parsePage, skipFor, totalPagesFor } from "@/lib/pagination";

export default async function ChantiersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const session = await auth();
  const where = { site: { companyId: session!.user.companyId } };
  const [chantiers, total, hasSites] = await Promise.all([
    prisma.chantier.findMany({
      where,
      include: { site: { select: { id: true, name: true } } },
      orderBy: [{ startDate: "asc" }, { name: "asc" }],
      skip: skipFor(page),
      take: PAGE_SIZE,
    }),
    prisma.chantier.count({ where }),
    prisma.site.count({ where: { companyId: session!.user.companyId } }),
  ]);

  return (
    <ListPageShell
      title="Chantiers"
      description="Les chantiers en cours ou à venir sur vos sites."
      count={total}
      addHref="/chantiers/nouveau"
      addLabel="+ Ajouter un chantier"
      emptyTitle="Aucun chantier"
      emptyDescription={
        hasSites > 0 ? "Vous n'avez encore aucun chantier." : "Créez d'abord un site avant d'ajouter un chantier."
      }
      emptyActions={
        hasSites > 0 ? (
          <LinkButton href="/chantiers/nouveau" variant="primary">
            + Ajouter un chantier
          </LinkButton>
        ) : (
          <LinkButton href="/sites/nouveau" variant="primary">
            + Ajouter un site
          </LinkButton>
        )
      }
      page={page}
      totalPages={totalPagesFor(total)}
      buildPageHref={(p) => `/chantiers?page=${p}`}
    >
      <InterventionsTable
        items={chantiers.map((c) => ({
          id: c.id,
          href: `/chantiers/${c.id}`,
          name: c.name,
          status: chantierStatusLabels[c.status],
          priority: priorityLabels[c.priority],
          date: formatDate(c.startDate),
          responsable: c.responsable,
          site: { name: c.site.name, href: `/sites/${c.site.id}` },
        }))}
      />
    </ListPageShell>
  );
}