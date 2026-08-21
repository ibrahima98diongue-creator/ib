import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { WorldMapLoader } from "@/components/map/WorldMapLoader";
import { MaintenanceStatus } from "@/generated/prisma/enums";
import { startOfYear } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import type { MapSite } from "@/components/map/WorldMap";

export default async function CartePage() {
  const session = await auth();
  const companyId = session!.user.companyId;
  const today = new Date();

  const sites = await prisma.site.findMany({
    where: { companyId, latitude: { not: null }, longitude: { not: null } },
    include: { client: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const siteIds = sites.map((s) => s.id);

  const [productionSums, upcomingMaintenances] = await Promise.all([
    siteIds.length > 0
      ? prisma.production.groupBy({
          by: ["siteId"],
          where: { siteId: { in: siteIds }, date: { gte: startOfYear(today) } },
          _sum: { energyKwh: true },
        })
      : Promise.resolve([]),
    siteIds.length > 0
      ? prisma.maintenance.findMany({
          where: {
            siteId: { in: siteIds },
            scheduledDate: { gte: today },
            status: { notIn: [MaintenanceStatus.TERMINEE] },
          },
          orderBy: { scheduledDate: "asc" },
          select: { siteId: true, title: true, scheduledDate: true },
        })
      : Promise.resolve([]),
  ]);

  const productionBySite = new Map(productionSums.map((p) => [p.siteId, p._sum.energyKwh ?? 0]));
  const nextMaintenanceBySite = new Map<string, { title: string; date: string }>();
  for (const m of upcomingMaintenances) {
    if (!nextMaintenanceBySite.has(m.siteId) && m.scheduledDate) {
      nextMaintenanceBySite.set(m.siteId, { title: m.title, date: formatDate(m.scheduledDate) });
    }
  }

  const mapSites: MapSite[] = sites.map((site) => ({
    id: site.id,
    name: site.name,
    clientName: site.client.name,
    latitude: site.latitude!,
    longitude: site.longitude!,
    powerKwc: site.powerKwc,
    status: site.status,
    productionThisYear: productionBySite.get(site.id) ?? null,
    nextMaintenance: nextMaintenanceBySite.get(site.id) ?? null,
  }));

  return (
    <div>
      <PageHeader title="Carte mondiale" description="La localisation de vos sites." />

      {mapSites.length === 0 ? (
        <EmptyState
          title="Aucun site à afficher"
          description="Aucun de vos sites n'a de coordonnées géographiques renseignées."
          actions={
            <LinkButton href="/sites/nouveau" variant="primary">
              + Ajouter un site
            </LinkButton>
          }
        />
      ) : (
        <WorldMapLoader sites={mapSites} />
      )}
    </div>
  );
}
