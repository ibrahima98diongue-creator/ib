// Config des colonnes import/export — pas de dépendance à Prisma ici : ce
// fichier est aussi importé côté client (formulaire d'import), la logique
// de validation qui touche la base vit dans importExportServer.ts.

export const importableEntities = {
  clients: { label: "Clients", columns: ["name", "contact", "email", "phone", "address"] },
  sites: {
    label: "Sites",
    columns: [
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
  },
  installations: {
    label: "Installations",
    columns: ["name", "site", "type", "capacityKwc", "status", "commissioningDate", "notes"],
  },
  equipements: {
    label: "Équipements",
    columns: ["name", "installation", "type", "status", "brand", "model", "serialNumber", "installDate", "notes"],
  },
  productions: { label: "Productions", columns: ["site", "date", "energyKwh", "notes"] },
  meteo: {
    label: "Météo",
    columns: [
      "site",
      "date",
      "irradiation",
      "ghi",
      "dni",
      "dhi",
      "temperature",
      "windSpeed",
      "precipitation",
      "notes",
    ],
  },
} as const;

export type ImportEntityKey = keyof typeof importableEntities;

export const exportableEntities = {
  clients: "Clients",
  sites: "Sites",
  installations: "Installations",
  equipements: "Équipements",
  productions: "Productions",
  maintenances: "Maintenances",
  rapport: "Rapport",
} as const;

export type ExportEntityKey = keyof typeof exportableEntities;
