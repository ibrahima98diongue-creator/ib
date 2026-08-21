import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListPageShell } from "@/components/ListPageShell";
import { LinkButton } from "@/components/ui/Button";
import { InterventionsTable } from "@/components/InterventionsSection";
import { chantierStatusLabels, priorityLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { PAGE_SIZE, parsePage, skipFor, totalPagesFor } from "@/lib/pagination";

export default async function NettoyagePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const session = await auth();
  const where = { site: { companyId: session!.user.companyId } };
  const [nettoyages, total, hasSites] = await Promise.all([
    prisma.nettoyage.findMany({
      where,
      include: { site: { select: { id: true, name: true } } },
      orderBy: [{ scheduledDate: "asc" }, { title: "asc" }],
      skip: skipFor(page),
      take: PAGE_SIZE,
    }),
    prisma.nettoyage.count({ where }),
    prisma.site.count({ where: { companyId: session!.user.companyId } }),
  ]);

  return (
    <ListPageShell
      title="Nettoyage"
      description="Les interventions de nettoyage planifiées sur vos sites."
      count={total}
      addHref="/nettoyage/nouveau"
      addLabel="+ Ajouter un nettoyage"
      emptyTitle="Aucun nettoyage"
      emptyDescription={
        hasSites > 0 ? "Vous n'avez encore aucun nettoyage." : "Créez d'abord un site avant d'ajouter un nettoyage."
      }
      emptyActions={
        hasSites > 0 ? (
          <LinkButton href="/nettoyage/nouveau" variant="primary">
            + Ajouter un nettoyage
          </LinkButton>
        ) : (
          <LinkButton href="/sites/nouveau" variant="primary">
            + Ajouter un site
          </LinkButton>
        )
      }
      page={page}
      totalPages={totalPagesFor(total)}
      buildPageHref={(p) => `/nettoyage?page=${p}`}
    >
      <InterventionsTable
        items={nettoyages.map((n) => ({
          id: n.id,
          href: `/nettoyage/${n.id}`,
          name: n.title,
          status: chantierStatusLabels[n.status],
          priority: priorityLabels[n.priority],
          date: formatDate(n.scheduledDate),
          responsable: n.responsable,
          site: { name: n.site.name, href: `/sites/${n.site.id}` },
        }))}
      />
    </ListPageShell>
  );
}