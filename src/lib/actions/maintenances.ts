"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fieldErrors, GENERIC_ERROR } from "@/lib/validation";
import { MaintenanceStatus, MaintenanceType, Priority } from "@/generated/prisma/enums";

const maintenanceSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire."),
  siteId: z.string().trim().min(1, "Le site est obligatoire."),
  equipementId: z
    .union([z.literal(""), z.string()])
    .optional()
    .transform((v) => (v ? v : null)),
  type: z.enum(MaintenanceType),
  status: z.enum(MaintenanceStatus),
  priority: z.enum(Priority),
  scheduledDate: z
    .union([z.literal(""), z.string()])
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  responsable: z.string().trim().optional(),
  description: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type MaintenanceFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function requireSession() {
  const session = await auth();
  if (!session?.user?.companyId) throw new Error("Non authentifié.");
  return session;
}

function parseForm(formData: FormData) {
  return maintenanceSchema.safeParse({
    title: formData.get("title"),
    siteId: formData.get("siteId"),
    equipementId: formData.get("equipementId"),
    type: formData.get("type"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    scheduledDate: formData.get("scheduledDate"),
    responsable: formData.get("responsable"),
    description: formData.get("description"),
    notes: formData.get("notes"),
  });
}

type SiteCheckResult =
  | { ok: true; site: { id: string } }
  | { ok: false; error: string };

async function validateSiteAndEquipement(
  companyId: string,
  siteId: string,
  equipementId: string | null | undefined,
): Promise<SiteCheckResult> {
  const site = await prisma.site.findFirst({ where: { id: siteId, companyId } });
  if (!site) return { ok: false, error: "Site invalide." };

  if (equipementId) {
    const equipement = await prisma.equipement.findFirst({
      where: { id: equipementId, installation: { siteId: site.id } },
    });
    if (!equipement) return { ok: false, error: "Équipement invalide pour ce site." };
  }

  return { ok: true, site };
}

export async function createMaintenance(
  _prevState: MaintenanceFormState,
  formData: FormData,
): Promise<MaintenanceFormState> {
  const session = await requireSession();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: GENERIC_ERROR, fieldErrors: fieldErrors(parsed.error) };
  }

  const check = await validateSiteAndEquipement(
    session.user.companyId,
    parsed.data.siteId,
    parsed.data.equipementId,
  );
  if (!check.ok) {
    return { error: GENERIC_ERROR, fieldErrors: { siteId: check.error } };
  }

  const maintenance = await prisma.maintenance.create({ data: parsed.data });

  revalidatePath("/maintenance");
  revalidatePath(`/sites/${check.site.id}`);
  redirect(`/maintenance/${maintenance.id}`);
}

export async function updateMaintenance(
  maintenanceId: string,
  _prevState: MaintenanceFormState,
  formData: FormData,
): Promise<MaintenanceFormState> {
  const session = await requireSession();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: GENERIC_ERROR, fieldErrors: fieldErrors(parsed.error) };
  }

  const check = await validateSiteAndEquipement(
    session.user.companyId,
    parsed.data.siteId,
    parsed.data.equipementId,
  );
  if (!check.ok) {
    return { error: GENERIC_ERROR, fieldErrors: { siteId: check.error } };
  }

  const result = await prisma.maintenance.updateMany({
    where: { id: maintenanceId, site: { companyId: session.user.companyId } },
    data: parsed.data,
  });
  if (result.count === 0) {
    return { error: "Maintenance introuvable." };
  }

  revalidatePath("/maintenance");
  revalidatePath(`/maintenance/${maintenanceId}`);
  redirect(`/maintenance/${maintenanceId}`);
}

export async function deleteMaintenance(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id"));

  await prisma.maintenance.deleteMany({
    where: { id, site: { companyId: session.user.companyId } },
  });
  revalidatePath("/maintenance");
  redirect("/maintenance");
}
