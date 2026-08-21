// Validation et résolution des lignes CSV — réservé au serveur (accès
// Prisma). Ne jamais importer ce fichier depuis un composant client :
// utiliser importExport.ts pour les constantes partagées.
import { prisma } from "@/lib/prisma";
import { SiteStatus, EquipementStatus } from "@/generated/prisma/enums";
import { siteStatusLabels, equipementStatusLabels } from "@/lib/labels";
import type { Tone } from "@/components/ui/Badge";
import type { ImportEntityKey } from "@/lib/importExport";

// ---------------------------------------------------------------------------
// Résolution des énumérations par clé technique OU par libellé français
// (pour accepter aussi bien un export réimporté qu'une saisie manuelle).
// ---------------------------------------------------------------------------

function resolveEnumWithLabels<K extends string>(
  labels: Record<K, { label: string; tone: Tone }>,
  value: string,
  fieldLabel: string,
): { ok: true; value: K } | { ok: false; error: string } {
  const entries = Object.entries(labels) as [K, { label: string; tone: Tone }][];
  const key = value.trim();
  if (!key) return { ok: false, error: `${fieldLabel} manquant.` };
  const match = entries.find(
    ([enumKey, meta]) => enumKey.toLowerCase() === key.toLowerCase() || meta.label.toLowerCase() === key.toLowerCase(),
  );
  if (!match) return { ok: false, error: `${fieldLabel} "${value}" inconnu.` };
  return { ok: true, value: match[0] };
}

// ---------------------------------------------------------------------------
// Recherche d'entités liées par nom (Client, Site, Installation)
// ---------------------------------------------------------------------------

function indexByName<T extends { name: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = item.name.trim().toLowerCase();
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return map;
}

function resolveByName<T>(
  map: Map<string, T[]>,
  name: string,
  fieldLabel: string,
): { ok: true; item: T } | { ok: false; error: string } {
  const key = name.trim().toLowerCase();
  if (!key) return { ok: false, error: `${fieldLabel} manquant.` };
  const matches = map.get(key) ?? [];
  if (matches.length === 0) return { ok: false, error: `${fieldLabel} "${name}" introuvable.` };
  if (matches.length > 1) return { ok: false, error: `${fieldLabel} "${name}" ambigu (plusieurs correspondances).` };
  return { ok: true, item: matches[0] };
}

export async function loadImportLookups(companyId: string) {
  const [clients, sites, installations] = await Promise.all([
    prisma.client.findMany({ where: { companyId }, select: { id: true, name: true } }),
    prisma.site.findMany({ where: { companyId }, select: { id: true, name: true } }),
    prisma.installation.findMany({
      where: { site: { companyId } },
      select: { id: true, name: true },
    }),
  ]);
  return {
    clientByName: indexByName(clients),
    siteByName: indexByName(sites),
    installationByName: indexByName(installations),
  };
}

export type ImportLookups = Awaited<ReturnType<typeof loadImportLookups>>;

function numberField(value: string, fieldLabel: string): { ok: true; value: number | undefined } | { ok: false; error: string } {
  if (!value.trim()) return { ok: true, value: undefined };
  const n = Number(value.replace(",", "."));
  if (Number.isNaN(n)) return { ok: false, error: `${fieldLabel} invalide.` };
  return { ok: true, value: n };
}

function dateField(value: string, fieldLabel: string): { ok: true; value: Date | undefined } | { ok: false; error: string } {
  if (!value.trim()) return { ok: true, value: undefined };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { ok: false, error: `${fieldLabel} invalide (format attendu AAAA-MM-JJ).` };
  return { ok: true, value: d };
}

export type ValidatedRow = { ok: true; data: Record<string, unknown> } | { ok: false; error: string };

// Valide une ligne CSV pour une entité donnée et prépare les données prêtes
// pour prisma.create (sans companyId, ajouté par l'appelant).
export async function validateImportRow(
  entity: ImportEntityKey,
  row: Record<string, string>,
  lookups: ImportLookups,
): Promise<ValidatedRow> {
  switch (entity) {
    case "clients": {
      if (!row.name?.trim()) return { ok: false, error: "Nom obligatoire." };
      if (row.email && !/^\S+@\S+\.\S+$/.test(row.email)) return { ok: false, error: "Email invalide." };
      return {
        ok: true,
        data: {
          name: row.name.trim(),
          contact: row.contact || null,
          email: row.email || null,
          phone: row.phone || null,
          address: row.address || null,
        },
      };
    }
    case "sites": {
      if (!row.name?.trim()) return { ok: false, error: "Nom obligatoire." };
      const client = resolveByName(lookups.clientByName, row.client ?? "", "Client");
      if (!client.ok) return client;
      const status = row.status
        ? resolveEnumWithLabels(siteStatusLabels, row.status, "Statut")
        : ({ ok: true, value: SiteStatus.ACTIF } as const);
      if (!status.ok) return status;
      const power = numberField(row.powerKwc ?? "", "Puissance");
      if (!power.ok) return power;
      const lat = numberField(row.latitude ?? "", "Latitude");
      if (!lat.ok) return lat;
      const lng = numberField(row.longitude ?? "", "Longitude");
      if (!lng.ok) return lng;
      const commissioning = dateField(row.commissioningDate ?? "", "Date de mise en service");
      if (!commissioning.ok) return commissioning;
      return {
        ok: true,
        data: {
          name: row.name.trim(),
          clientId: client.item.id,
          country: row.country || null,
          powerKwc: power.value ?? null,
          status: status.value,
          address: row.address || null,
          latitude: lat.value ?? null,
          longitude: lng.value ?? null,
          commissioningDate: commissioning.value ?? null,
          notes: row.notes || null,
        },
      };
    }
    case "installations": {
      if (!row.name?.trim()) return { ok: false, error: "Nom obligatoire." };
      const site = resolveByName(lookups.siteByName, row.site ?? "", "Site");
      if (!site.ok) return site;
      const status = row.status
        ? resolveEnumWithLabels(siteStatusLabels, row.status, "Statut")
        : ({ ok: true, value: SiteStatus.ACTIF } as const);
      if (!status.ok) return status;
      const capacity = numberField(row.capacityKwc ?? "", "Capacité");
      if (!capacity.ok) return capacity;
      const commissioning = dateField(row.commissioningDate ?? "", "Date de mise en service");
      if (!commissioning.ok) return commissioning;
      return {
        ok: true,
        data: {
          name: row.name.trim(),
          siteId: site.item.id,
          type: row.type || null,
          capacityKwc: capacity.value ?? null,
          status: status.value,
          commissioningDate: commissioning.value ?? null,
          notes: row.notes || null,
        },
      };
    }
    case "equipements": {
      if (!row.name?.trim()) return { ok: false, error: "Nom obligatoire." };
      const installation = resolveByName(lookups.installationByName, row.installation ?? "", "Installation");
      if (!installation.ok) return installation;
      const status = row.status
        ? resolveEnumWithLabels(equipementStatusLabels, row.status, "Statut")
        : ({ ok: true, value: EquipementStatus.EN_SERVICE } as const);
      if (!status.ok) return status;
      const installDate = dateField(row.installDate ?? "", "Date d'installation");
      if (!installDate.ok) return installDate;
      return {
        ok: true,
        data: {
          name: row.name.trim(),
          installationId: installation.item.id,
          type: row.type || null,
          status: status.value,
          brand: row.brand || null,
          model: row.model || null,
          serialNumber: row.serialNumber || null,
          installDate: installDate.value ?? null,
          notes: row.notes || null,
        },
      };
    }
    case "productions": {
      const site = resolveByName(lookups.siteByName, row.site ?? "", "Site");
      if (!site.ok) return site;
      const date = dateField(row.date ?? "", "Date");
      if (!date.ok) return date;
      if (!date.value) return { ok: false, error: "Date obligatoire." };
      const energy = numberField(row.energyKwh ?? "", "Production");
      if (!energy.ok) return energy;
      if (energy.value === undefined) return { ok: false, error: "Production obligatoire." };
      return {
        ok: true,
        data: { siteId: site.item.id, date: date.value, energyKwh: energy.value, notes: row.notes || null },
      };
    }
    case "meteo": {
      const site = resolveByName(lookups.siteByName, row.site ?? "", "Site");
      if (!site.ok) return site;
      const date = dateField(row.date ?? "", "Date");
      if (!date.ok) return date;
      if (!date.value) return { ok: false, error: "Date obligatoire." };
      const fields: Record<string, number | undefined> = {};
      for (const key of ["irradiation", "ghi", "dni", "dhi", "temperature", "windSpeed", "precipitation"]) {
        const result = numberField(row[key] ?? "", key);
        if (!result.ok) return result;
        fields[key] = result.value;
      }
      return {
        ok: true,
        data: {
          siteId: site.item.id,
          date: date.value,
          irradiation: fields.irradiation ?? null,
          ghi: fields.ghi ?? null,
          dni: fields.dni ?? null,
          dhi: fields.dhi ?? null,
          temperature: fields.temperature ?? null,
          windSpeed: fields.windSpeed ?? null,
          precipitation: fields.precipitation ?? null,
          notes: row.notes || null,
        },
      };
    }
  }
}

export async function createValidatedRow(entity: ImportEntityKey, companyId: string, data: Record<string, unknown>) {
  switch (entity) {
    case "clients":
      return prisma.client.create({ data: { ...data, companyId } as never });
    case "sites":
      return prisma.site.create({ data: { ...data, companyId } as never });
    case "installations":
      return prisma.installation.create({ data: data as never });
    case "equipements":
      return prisma.equipement.create({ data: data as never });
    case "productions":
      return prisma.production.create({ data: data as never });
    case "meteo":
      return prisma.meteo.create({ data: data as never });
  }
}
