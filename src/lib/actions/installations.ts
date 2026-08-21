"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fieldErrors, GENERIC_ERROR } from "@/lib/validation";
import { SiteStatus } from "@/generated/prisma/enums";

const numeric = (message: string) =>
  z
    .union([z.literal(""), z.coerce.number({ error: message })])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v));

const installationSchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire."),
  siteId: z.string().trim().min(1, "Le site est obligatoire."),
  type: z.string().trim().optional(),
  capacityKwc: numeric("Capacité invalide."),
  status: z.enum(SiteStatus),
  commissioningDate: z
    .union([z.literal(""), z.string()])
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  notes: z.string().trim().optional(),
});

export type InstallationFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function requireSession() {
  const session = await auth();
  if (!session?.user?.companyId) throw new Error("Non authentifié.");
  return session;
}

function parseForm(formData: FormData) {
  return installationSchema.safeParse({
    name: formData.get("name"),
    siteId: formData.get("siteId"),
    type: formData.get("type"),
    capacityKwc: formData.get("capacityKwc"),
    status: formData.get("status"),
    commissioningDate: formData.get("commissioningDate"),
    notes: formData.get("notes"),
  });
}

export async function createInstallation(
  _prevState: InstallationFormState,
  formData: FormData,
): Promise<InstallationFormState> {
  const session = await requireSession();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: GENERIC_ERROR, fieldErrors: fieldErrors(parsed.error) };
  }

  const site = await prisma.site.findFirst({
    where: { id: parsed.data.siteId, companyId: session.user.companyId },
  });
  if (!site) {
    return { error: GENERIC_ERROR, fieldErrors: { siteId: "Site invalide." } };
  }

  const installation = await prisma.installation.create({ data: parsed.data });

  revalidatePath("/installations");
  revalidatePath(`/sites/${site.id}`);
  redirect(`/installations/${installation.id}`);
}

export async function updateInstallation(
  installationId: string,
  _prevState: InstallationFormState,
  formData: FormData,
): Promise<InstallationFormState> {
  const session = await requireSession();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: GENERIC_ERROR, fieldErrors: fieldErrors(parsed.error) };
  }

  const site = await prisma.site.findFirst({
    where: { id: parsed.data.siteId, companyId: session.user.companyId },
  });
  if (!site) {
    return { error: GENERIC_ERROR, fieldErrors: { siteId: "Site invalide." } };
  }

  const result = await prisma.installation.updateMany({
    where: { id: installationId, site: { companyId: session.user.companyId } },
    data: parsed.data,
  });
  if (result.count === 0) {
    return { error: "Installation introuvable." };
  }

  revalidatePath("/installations");
  revalidatePath(`/installations/${installationId}`);
  redirect(`/installations/${installationId}`);
}

export async function deleteInstallation(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id"));

  const equipementsCount = await prisma.equipement.count({ where: { installationId: id } });
  if (equipementsCount > 0) {
    redirect(`/installations/${id}?erreur=a-des-equipements`);
  }

  await prisma.installation.deleteMany({
    where: { id, site: { companyId: session.user.companyId } },
  });
  revalidatePath("/installations");
  redirect("/installations");
}
