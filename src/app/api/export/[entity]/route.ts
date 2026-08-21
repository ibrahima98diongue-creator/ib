import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";
import { exportableEntities, type ExportEntityKey } from "@/lib/importExport";
import {
  siteStatusLabels,
  equipementStatusLabels,
  maintenanceStatusLabels,
  maintenanceTypeLabels,
  priorityLabels,
} from "@/lib/labels";
import { toDateParam } from "@/lib/dates";
import { getRapportStats } from "@/lib/rapport";

function isoDate(date: Date | null) {
  return date ? toDateParam(date) : "";
}

function downloadResponse(filename: string, csv: string) {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ entity: string }> }) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const { entity: entityParam } = await params;
  const entity = entityParam as ExportEntityKey;
  if (!(entity in exportableEntities)) {
    return NextResponse.json({ error: "Type d'export inconnu." }, { status: 404 });
  }

  const companyId = session.user.companyId;

  switch (entity) {
    case "clients": {
      const clients = await prisma.client.findMany({ where: { companyId }, orderBy: { name: "asc" } });
      const rows = [
        ["name", "contact", "email", "phone", "address"],
        ...clients.map((c) => [c.name, c.contact, c.email, c.phone, c.address]),
      ];
      return downloadResponse("clients.csv", toCsv(rows));
    }
    case "sites": {
      const sites = await prisma.site.findMany({
        where: { companyId },
        include: { client: { select: { name: true } } },
        orderBy: { name: "asc" },
      });
      const rows = [
        [
          "name",
          "client",
          "country",
          "powerKwc",
          "status",
          "address",
          "latitude",
          "longitude",
          "commissioningDate",
          "notes",
        ],
        ...sites.map((s) => [
          s.name,
          s.client.name,
          s.country,
          s.powerKwc,
          siteStatusLabels[s.status].label,
          s.address,
          s.latitude,
          s.longitude,
          isoDate(s.commissioningDate),
          s.notes,
        ]),
      ];
      return downloadResponse("sites.csv", toCsv(rows));
    }
    case "installations": {
      const installations = await prisma.installation.findMany({
        where: { site: { companyId } },
        include: { site: { select: { name: true } } },
        orderBy: { name: "asc" },
      });
      const rows = [
        ["name", "site", "type", "capacityKwc", "status", "commissioningDate", "notes"],
        ...installations.map((i) => [
          i.name,
          i.site.name,
          i.type,
          i.capacityKwc,
          siteStatusLabels[i.status].label,
          isoDate(i.commissioningDate),
          i.notes,
        ]),
      ];
      return downloadResponse("installations.csv", toCsv(rows));
    }
    case "equipements": {
      const equipements = await prisma.equipement.findMany({
        where: { installation: { site: { companyId } } },
        include: { installation: { select: { name: true } } },
        orderBy: { name: "asc" },
      });
      const rows = [
        ["name", "installation", "type", "status", "brand", "model", "serialNumber", "installDate", "notes"],
        ...equipements.map((e) => [
          e.name,
          e.installation.name,
          e.type,
          equipementStatusLabels[e.status].label,
          e.brand,
          e.model,
          e.serialNumber,
          isoDate(e.installDate),
          e.notes,
        ]),
      ];
      return downloadResponse("equipements.csv", toCsv(rows));
    }
    case "productions": {
      const productions = await prisma.production.findMany({
        where: { site: { companyId } },
        include: { site: { select: { name: true } } },
        orderBy: { date: "desc" },
      });
      const rows = [
        ["site", "date", "energyKwh", "notes"],
        ...productions.map((p) => [p.site.name, isoDate(p.date), p.energyKwh, p.notes]),
      ];
      return downloadResponse("productions.csv", toCsv(rows));
    }
    case "maintenances": {
      const maintenances = await prisma.maintenance.findMany({
        where: { site: { companyId } },
        include: { site: { select: { name: true } }, equipement: { select: { name: true } } },
        orderBy: { scheduledDate: "desc" },
      });
      const rows = [
        [
          "title",
          "site",
          "equipement",
          "type",
          "status",
          "priority",
          "scheduledDate",
          "responsable",
          "description",
          "notes",
        ],
        ...maintenances.map((m) => [
          m.title,
          m.site.name,
          m.equipement?.name ?? "",
          maintenanceTypeLabels[m.type],
          maintenanceStatusLabels[m.status].label,
          priorityLabels[m.priority].label,
          isoDate(m.scheduledDate),
          m.responsable,
          m.description,
          m.notes,
        ]),
      ];
      return downloadResponse("maintenances.csv", toCsv(rows));
    }
    case "rapport": {
      const stats = await getRapportStats(companyId);
      const rows = [
        ["Indicateur", "Valeur"],
        ["Date du rapport", isoDate(stats.date)],
        ["Clients", stats.clientsCount],
        ["Sites", stats.sitesCount],
        ["Sites actifs", stats.activeSitesCount],
        ["Installations", stats.installationsCount],
        ["Équipements", stats.equipementsCount],
        ["Chantiers en cours", stats.chantiersEnCours],
        ["Chantiers terminés", stats.chantiersTermines],
        ["Maintenances à venir", stats.maintenancesAVenir],
        ["Maintenances terminées", stats.maintenancesTerminees],
        ["Nettoyages en cours", stats.nettoyagesEnCours],
        ["Tâches à faire", stats.tachesAFaire],
        ["Tâches terminées", stats.tachesTerminees],
        ["Production du mois (kWh)", stats.productionMonthKwh],
        ["Production de l'année (kWh)", stats.productionYearKwh],
      ];
      return downloadResponse("rapport.csv", toCsv(rows));
    }
  }
}
