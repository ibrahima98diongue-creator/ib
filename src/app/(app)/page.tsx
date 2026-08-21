import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/ui/StatTile";
import { chantierStatusLabels, maintenanceStatusLabels, priorityLabels } from "@/lib/labels";
import { ChantierStatus, MaintenanceStatus, Priority, SiteStatus, TaskStatus } from "@/generated/prisma/enums";
import { startOfMonth, startOfYear, toDateParam } from "@/lib/dates";
import { formatDateShort } from "@/lib/format";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const companyId = session!.user.companyId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    clientsCount,
    sitesCount,
    activeSitesCount,
    chantiersEnCoursCount,
    maintenancesAVenirCount,
    interventionsUrgentesChantiers,
    interventionsUrgentesMaintenances,
    upcomingChantiers,
    upcomingMaintenances,
    productionEntries,
    monthMeteo,
    tachesAFaireCount,
  ] = await Promise.all([
    prisma.client.count({ where: { companyId } }),
    prisma.site.count({ where: { companyId } }),
    prisma.site.count({ where: { companyId, status: SiteStatus.ACTIF } }),
    prisma.chantier.count({ where: { site: { companyId }, status: ChantierStatus.EN_COURS } }),
    prisma.maintenance.count({
      where: {
        site: { companyId },
        status: { in: [MaintenanceStatus.A_PLANIFIER, MaintenanceStatus.PLANIFIEE] },
      },
    }),
    prisma.chantier.count({
      where: {
        site: { companyId },
        priority: { in: [Priority.CRITIQUE, Priority.HAUTE] },
        status: { notIn: [ChantierStatus.TERMINE] },
      },
    }),
    prisma.maintenance.count({
      where: {
        site: { companyId },
        priority: { in: [Priority.CRITIQUE, Priority.HAUTE] },
        status: { notIn: [MaintenanceStatus.TERMINEE] },
      },
    }),
    prisma.chantier.findMany({
      where: { site: { companyId }, startDate: { gte: today } },
      include: { site: { select: { name: true } } },
      orderBy: { startDate: "asc" },
      take: 5,
    }),
    prisma.maintenance.findMany({
      where: { site: { companyId }, scheduledDate: { gte: today } },
      include: { site: { select: { name: true } } },
      orderBy: { scheduledDate: "asc" },
      take: 5,
    }),
    prisma.production.findMany({ where: { site: { companyId } }, select: { date: true, energyKwh: true } }),
    prisma.meteo.findMany({
      where: { site: { companyId }, date: { gte: startOfMonth(today) }, irradiation: { not: null } },
      select: { irradiation: true },
    }),
    prisma.task.count({ where: { companyId, status: TaskStatus.A_FAIRE } }),
  ]);

  const isEmpty = clientsCount === 0 && sitesCount === 0;
  const interventionsUrgentesCount = interventionsUrgentesChantiers + interventionsUrgentesMaintenances;

  const hasProductionData = productionEntries.length > 0;
  const productionToday = productionEntries
    .filter((p) => toDateParam(p.date) === toDateParam(today))
    .reduce((t, p) => t + p.energyKwh, 0);
  const productionMonth = productionEntries
    .filter((p) => p.date >= startOfMonth(today))
    .reduce((t, p) => t + p.energyKwh, 0);
  const productionYear = productionEntries
    .filter((p) => p.date >= startOfYear(today))
    .reduce((t, p) => t + p.energyKwh, 0);

  const avgIrradiation =
    monthMeteo.length > 0
      ? monthMeteo.reduce((t, m) => t + (m.irradiation ?? 0), 0) / monthMeteo.length
      : null;

  const upcoming = [
    ...upcomingChantiers.map((c) => ({
      id: c.id,
      href: `/chantiers/${c.id}`,
      kind: "Chantier" as const,
      name: c.name,
      site: c.site.name,
      date: c.startDate!,
      responsable: c.responsable,
      priorityLabel: priorityLabels[c.priority],
      statusLabel: chantierStatusLabels[c.status],
    })),
    ...upcomingMaintenances.map((m) => ({
      id: m.id,
      href: `/maintenance/${m.id}`,
      kind: "Maintenance" as const,
      name: m.title,
      site: m.site.name,
      date: m.scheduledDate!,
      responsable: m.responsable,
      priorityLabel: priorityLabels[m.priority],
      statusLabel: maintenanceStatusLabels[m.status],
    })),
  ]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description={`Bienvenue, ${session!.user.name}.`}
      />

      {isEmpty ? (
        <EmptyState
          title="Aucune donnée disponible"
          description="Commencez par ajouter votre premier client, puis ses sites."
          actions={
            <>
              <LinkButton href="/clients/nouveau" variant="primary">
                + Ajouter un client
              </LinkButton>
              <LinkButton href="/import-export">Importer</LinkButton>
            </>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile label="Sites actifs" value={activeSitesCount} href="/sites" />
            <StatTile label="Chantiers en cours" value={chantiersEnCoursCount} href="/chantiers" />
            <StatTile label="Maintenances à venir" value={maintenancesAVenirCount} href="/maintenance" />
            <StatTile label="Interventions urgentes" value={interventionsUrgentesCount} href="/planning" />
            <StatTile label="Tâches à faire" value={tachesAFaireCount} href="/todo" />
          </div>

          {(hasProductionData || avgIrradiation !== null) && (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {hasProductionData && (
                <div>
                  <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Production</h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <StatTile label="Aujourd'hui" value={`${productionToday.toFixed(0)} kWh`} href="/production" />
                    <StatTile label="Ce mois-ci" value={`${productionMonth.toFixed(0)} kWh`} href="/production" />
                    <StatTile label="Cette année" value={`${productionYear.toFixed(0)} kWh`} href="/production" />
                  </div>
                </div>
              )}
              {avgIrradiation !== null && (
                <div>
                  <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Performance</h2>
                  <StatTile
                    label="Irradiation moyenne (ce mois)"
                    value={`${avgIrradiation.toFixed(2)} kWh/m²`}
                    href="/meteo"
                  />
                </div>
              )}
            </div>
          )}

          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--color-text)]">Prochaines interventions</h2>
              <Link href="/planning" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
                Voir le planning
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <EmptyState
                title="Aucune intervention à venir"
                description="Aucun chantier ni maintenance planifié pour les prochains jours."
                actions={
                  <>
                    <LinkButton href="/chantiers/nouveau" variant="primary">
                      + Ajouter un chantier
                    </LinkButton>
                    <LinkButton href="/maintenance/nouveau">+ Ajouter une maintenance</LinkButton>
                  </>
                }
              />
            ) : (
              <Table>
                <Thead>
                  <Th>Date</Th>
                  <Th>Type</Th>
                  <Th>Nom</Th>
                  <Th>Site</Th>
                  <Th>Responsable</Th>
                  <Th>Priorité</Th>
                  <Th>Statut</Th>
                </Thead>
                <Tbody>
                  {upcoming.map((entry) => (
                    <tr key={`${entry.kind}-${entry.id}`} className="hover:bg-gray-50">
                      <Td className="text-[var(--color-text-secondary)]">{formatDateShort(entry.date)}</Td>
                      <Td className="text-[var(--color-text-secondary)]">{entry.kind}</Td>
                      <Td>
                        <Link
                          href={entry.href}
                          className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                        >
                          {entry.name}
                        </Link>
                      </Td>
                      <Td className="text-[var(--color-text-secondary)]">{entry.site}</Td>
                      <Td className="text-[var(--color-text-secondary)]">{entry.responsable || "—"}</Td>
                      <Td>
                        <Badge tone={entry.priorityLabel.tone}>{entry.priorityLabel.label}</Badge>
                      </Td>
                      <Td>
                        <Badge tone={entry.statusLabel.tone}>{entry.statusLabel.label}</Badge>
                      </Td>
                    </tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
