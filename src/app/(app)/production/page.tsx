import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListPageShell } from "@/components/ListPageShell";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { ProductionChart } from "@/components/ProductionChart";
import { deleteProduction } from "@/lib/actions/productions";
import { startOfDay, startOfWeek, startOfMonth, startOfYear, addDays, toDateParam } from "@/lib/dates";
import { formatDate, formatDateShort, formatKwh } from "@/lib/format";
import { PAGE_SIZE, parsePage, skipFor, totalPagesFor } from "@/lib/pagination";
import Link from "next/link";

export default async function ProductionPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const session = await auth();
  const companyId = session!.user.companyId;
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const last30Start = addDays(today, -29);
  const where = { site: { companyId } };

  // Les totaux et le graphique portent sur toute la période concernée
  // (pas seulement la page affichée) : calculés via des requêtes dédiées,
  // pas en filtrant en mémoire le tableau paginé.
  const [todayAgg, weekAgg, monthAgg, yearAgg, chartRows, entries, total, hasSites] = await Promise.all([
    prisma.production.aggregate({
      where: { ...where, date: { gte: today, lt: tomorrow } },
      _sum: { energyKwh: true },
    }),
    prisma.production.aggregate({
      where: { ...where, date: { gte: startOfWeek(today) } },
      _sum: { energyKwh: true },
    }),
    prisma.production.aggregate({
      where: { ...where, date: { gte: startOfMonth(today) } },
      _sum: { energyKwh: true },
    }),
    prisma.production.aggregate({
      where: { ...where, date: { gte: startOfYear(today) } },
      _sum: { energyKwh: true },
    }),
    prisma.production.findMany({
      where: { ...where, date: { gte: last30Start, lte: today } },
      select: { date: true, energyKwh: true },
    }),
    prisma.production.findMany({
      where,
      include: { site: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
      skip: skipFor(page),
      take: PAGE_SIZE,
    }),
    prisma.production.count({ where }),
    prisma.site.count({ where: { companyId } }),
  ]);

  const todayTotal = todayAgg._sum.energyKwh ?? 0;
  const weekTotal = weekAgg._sum.energyKwh ?? 0;
  const monthTotal = monthAgg._sum.energyKwh ?? 0;
  const yearTotal = yearAgg._sum.energyKwh ?? 0;

  const chartData = Array.from({ length: 30 }, (_, i) => {
    const day = addDays(last30Start, i);
    const total = chartRows
      .filter((e) => toDateParam(e.date) === toDateParam(day))
      .reduce((t, e) => t + e.energyKwh, 0);
    return {
      label: formatDateShort(day),
      value: total,
    };
  });
  const hasRecentData = chartData.some((d) => d.value > 0);

  return (
    <ListPageShell
      title="Production"
      description="Le suivi de la production d'énergie de vos sites."
      count={total}
      addHref="/production/nouveau"
      addLabel="+ Ajouter une production"
      headerExtra={<LinkButton href="/import-export">Importer</LinkButton>}
      emptyTitle="Aucune donnée de production"
      emptyDescription={
        hasSites > 0
          ? "Vous n'avez encore aucune donnée de production."
          : "Créez d'abord un site avant d'ajouter une production."
      }
      emptyActions={
        hasSites > 0 ? (
          <>
            <LinkButton href="/production/nouveau" variant="primary">
              + Ajouter une production
            </LinkButton>
            <LinkButton href="/import-export">Importer un fichier</LinkButton>
          </>
        ) : (
          <LinkButton href="/sites/nouveau" variant="primary">
            + Ajouter un site
          </LinkButton>
        )
      }
      page={page}
      totalPages={totalPagesFor(total)}
      buildPageHref={(p) => `/production?page=${p}`}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Aujourd'hui" value={formatKwh(todayTotal)} />
        <StatTile label="Cette semaine" value={formatKwh(weekTotal)} />
        <StatTile label="Ce mois-ci" value={formatKwh(monthTotal)} />
        <StatTile label="Cette année" value={formatKwh(yearTotal)} />
      </div>

      {hasRecentData && (
        <div className="mt-8">
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-text)]">
            Production quotidienne — 30 derniers jours
          </h2>
          <Card>
            <ProductionChart data={chartData} />
          </Card>
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-4 text-sm font-semibold text-[var(--color-text)]">Relevés</h2>
        <Table>
          <Thead>
            <Th>Date</Th>
            <Th>Site</Th>
            <Th>Production</Th>
            <Th />
          </Thead>
          <Tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <Td className="text-[var(--color-text-secondary)]">{formatDate(entry.date)}</Td>
                <Td>
                  <Link
                    href={`/sites/${entry.site.id}`}
                    className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                  >
                    {entry.site.name}
                  </Link>
                </Td>
                <Td className="text-[var(--color-text-secondary)]">{formatKwh(entry.energyKwh)}</Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/production/${entry.id}/modifier`}
                      className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                      Modifier
                    </Link>
                    <DeleteButton
                      action={deleteProduction}
                      id={entry.id}
                      confirmMessage={`Supprimer la production du ${formatDate(entry.date)} pour "${entry.site.name}" ?`}
                    />
                  </div>
                </Td>
              </tr>
            ))}
          </Tbody>
        </Table>
      </div>
    </ListPageShell>
  );
}