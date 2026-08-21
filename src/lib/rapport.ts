// Calcul des indicateurs du rapport — partagé entre la page /rapports et
// la route d'export CSV correspondante, pour ne jamais avoir deux
// définitions du même chiffre.
import { prisma } from "@/lib/prisma";
import { ChantierStatus, MaintenanceStatus, SiteStatus, TaskStatus } from "@/generated/prisma/enums";
import { startOfMonth, startOfYear } from "@/lib/dates";

export async function getRapportStats(companyId: string) {
  const today = new Date();

  const [
    clientsCount,
    sitesCount,
    activeSitesCount,
    installationsCount,
    equipementsCount,
    chantiersEnCours,
    chantiersTermines,
    maintenancesAVenir,
    maintenancesTerminees,
    nettoyagesEnCours,
    tachesAFaire,
    tachesTerminees,
    productionMonth,
    productionYear,
  ] = await Promise.all([
    prisma.client.count({ where: { companyId } }),
    prisma.site.count({ where: { companyId } }),
    prisma.site.count({ where: { companyId, status: SiteStatus.ACTIF } }),
    prisma.installation.count({ where: { site: { companyId } } }),
    prisma.equipement.count({ where: { installation: { site: { companyId } } } }),
    prisma.chantier.count({ where: { site: { companyId }, status: ChantierStatus.EN_COURS } }),
    prisma.chantier.count({ where: { site: { companyId }, status: ChantierStatus.TERMINE } }),
    prisma.maintenance.count({ where: { site: { companyId }, status: { notIn: [MaintenanceStatus.TERMINEE] } } }),
    prisma.maintenance.count({ where: { site: { companyId }, status: MaintenanceStatus.TERMINEE } }),
    prisma.nettoyage.count({ where: { site: { companyId }, status: ChantierStatus.EN_COURS } }),
    prisma.task.count({ where: { companyId, status: TaskStatus.A_FAIRE } }),
    prisma.task.count({ where: { companyId, status: TaskStatus.TERMINEE } }),
    prisma.production.aggregate({
      where: { site: { companyId }, date: { gte: startOfMonth(today) } },
      _sum: { energyKwh: true },
    }),
    prisma.production.aggregate({
      where: { site: { companyId }, date: { gte: startOfYear(today) } },
      _sum: { energyKwh: true },
    }),
  ]);

  return {
    date: today,
    clientsCount,
    sitesCount,
    activeSitesCount,
    installationsCount,
    equipementsCount,
    chantiersEnCours,
    chantiersTermines,
    maintenancesAVenir,
    maintenancesTerminees,
    nettoyagesEnCours,
    tachesAFaire,
    tachesTerminees,
    productionMonthKwh: productionMonth._sum.energyKwh ?? 0,
    productionYearKwh: productionYear._sum.energyKwh ?? 0,
  };
}

export type RapportStats = Awaited<ReturnType<typeof getRapportStats>>;
