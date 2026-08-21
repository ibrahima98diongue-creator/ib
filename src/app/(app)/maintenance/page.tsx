import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListPageShell } from "@/components/ListPageShell";
import { LinkButton } from "@/components/ui/Button";
import { InterventionsTable } from "@/components/InterventionsSection";
import { maintenanceStatusLabels, priorityLabels, maintenanceTypeLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { PAGE_SIZE, parsePage, skipFor, totalPagesFor } from "@/lib/pagination";

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const session = await auth();
  const where = { site: { companyId: session!.user.companyId } };
  const [maintenances, total, hasSites] = await Promise.all([
    prisma.maintenance.findMany({
      where,
      include: { site: { select: { id: true, name: true } } },
      orderBy: [{ scheduledDate: "asc" }, { title: "asc" }],
      skip: skipFor(page),
      take: PAGE_SIZE,
    }),
    prisma.maintenance.count({ where }),
    prisma.site.count({ where: { companyId: session!.user.companyId } }),
  ]);

  return (
    <ListPageShell
      title="Maintenance"
      description="Les interventions de maintenance préventive et corrective."
      count={total}
      addHref="/maintenance/nouveau"
      addLabel="+ Ajouter une maintenance"
      emptyTitle="Aucune maintenance"
      emptyDescription={
        hasSites > 0
          ? "Vous n'avez encore aucune maintenance."
          : "Créez d'abord un site avant d'ajouter une maintenance."
      }
      emptyActions={
        hasSites > 0 ? (
          <LinkButton href="/maintenance/nouveau" variant="primary">
            + Ajouter une maintenance
          </LinkButton>
        ) : (
          <LinkButton href="/sites/nouveau" variant="primary">
            + Ajouter un site
          </LinkButton>
        )
      }
      page={page}
      totalPages={totalPagesFor(total)}
      buildPageHref={(p) => `/maintenance?page=${p}`}
    >
      <InterventionsTable
        items={maintenances.map((m) => ({
          id: m.id,
          href: `/maintenance/${m.id}`,
          name: m.title,
          status: maintenanceStatusLabels[m.status],
          priority: priorityLabels[m.priority],
          date: formatDate(m.scheduledDate),
          responsable: m.responsable,
          site: { name: m.site.name, href: `/sites/${m.site.id}` },
          type: maintenanceTypeLabels[m.type],
        }))}
      />
    </ListPageShell>
  );
}