"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { parseCsv, csvRowsToObjects } from "@/lib/csv";
import { importableEntities, type ImportEntityKey } from "@/lib/importExport";
import { loadImportLookups, validateImportRow, createValidatedRow } from "@/lib/importExportServer";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.companyId) throw new Error("Non authentifié.");
  return session;
}

const entityPaths: Record<ImportEntityKey, string> = {
  clients: "/clients",
  sites: "/sites",
  installations: "/installations",
  equipements: "/equipements",
  productions: "/production",
  meteo: "/meteo",
};

export type PreviewRow = { raw: Record<string, string>; error?: string };
export type PreviewResult = {
  columns: string[];
  rows: PreviewRow[];
  validCount: number;
  invalidCount: number;
};

export async function previewImport(entity: ImportEntityKey, csvText: string): Promise<PreviewResult> {
  const session = await requireSession();
  const objects = csvRowsToObjects(parseCsv(csvText));
  const lookups = await loadImportLookups(session.user.companyId);

  const rows: PreviewRow[] = [];
  for (const raw of objects) {
    const result = await validateImportRow(entity, raw, lookups);
    rows.push({ raw, error: result.ok ? undefined : result.error });
  }

  return {
    columns: [...importableEntities[entity].columns],
    rows,
    validCount: rows.filter((r) => !r.error).length,
    invalidCount: rows.filter((r) => r.error).length,
  };
}

export async function commitImport(
  entity: ImportEntityKey,
  csvText: string,
): Promise<{ imported: number; skipped: number }> {
  const session = await requireSession();
  const objects = csvRowsToObjects(parseCsv(csvText));
  const lookups = await loadImportLookups(session.user.companyId);

  let imported = 0;
  let skipped = 0;
  for (const raw of objects) {
    const result = await validateImportRow(entity, raw, lookups);
    if (!result.ok) {
      skipped++;
      continue;
    }
    try {
      await createValidatedRow(entity, session.user.companyId, result.data);
      imported++;
    } catch {
      // ex. doublon site+date pour Production/Météo — la ligne est ignorée
      // plutôt que de faire échouer tout l'import.
      skipped++;
    }
  }

  revalidatePath(entityPaths[entity]);
  return { imported, skipped };
}
