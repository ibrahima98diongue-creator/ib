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

const siteSchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire."),
  clientId: z.string().trim().min(1, "Le client est obligatoire."),
  country: z.string().trim().optional(),
  powerKwc: numeric("Puissance invalide."),
  status: z.enum(SiteStatus),
  address: z.string().trim().optional(),
  latitude: numeric("Latitude invalide."),
  longitude: numeric("Longitude invalide."),
  commissioningDate: z
    .union([z.literal(""), z.string()])
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  notes: z.string().trim().optional(),
});

export type SiteFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function requireSession() {
  const session = await auth();
  if (!session?.user?.companyId) throw new Error("Non authentifié.");
  return session;
}

function parseForm(formData: FormData) {
  return siteSchema.safeParse({
    name: formData.get("name"),
    clientId: formData.get("clientId"),
    country: formData.get("country"),
    powerKwc: formData.get("powerKwc"),
    status: formData.get("status"),
    address: formData.get("address"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    commissioningDate: formData.get("commissioningDate"),
    notes: formData.get("notes"),
  });
}

export async function createSite(
  _prevState: SiteFormState,
  formData: FormData,
): Promise<SiteFormState> {
  const session = await requireSession();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: GENERIC_ERROR, fieldErrors: fieldErrors(parsed.error) };
  }

  const client = await prisma.client.findFirst({
    where: { id: parsed.data.clientId, companyId: session.user.companyId },
  });
  if (!client) {
    return { error: GENERIC_ERROR, fieldErrors: { clientId: "Client invalide." } };
  }

  const site = await prisma.site.create({
    data: { ...parsed.data, companyId: session.user.companyId },
  });

  revalidatePath("/sites");
  revalidatePath(`/clients/${client.id}`);
  redirect(`/sites/${site.id}`);
}

export async function updateSite(
  siteId: string,
  _prevState: SiteFormState,
  formData: FormData,
): Promise<SiteFormState> {
  const session = await requireSession();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: GENERIC_ERROR, fieldErrors: fieldErrors(parsed.error) };
  }

  const client = await prisma.client.findFirst({
    where: { id: parsed.data.clientId, companyId: session.user.companyId },
  });
  if (!client) {
    return { error: GENERIC_ERROR, fieldErrors: { clientId: "Client invalide." } };
  }

  const result = await prisma.site.updateMany({
    where: { id: siteId, companyId: session.user.companyId },
    data: parsed.data,
  });
  if (result.count === 0) {
    return { error: "Site introuvable." };
  }

  revalidatePath("/sites");
  revalidatePath(`/sites/${siteId}`);
  redirect(`/sites/${siteId}`);
}

export async function deleteSite(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id"));

  const installationsCount = await prisma.installation.count({ where: { siteId: id } });
  if (installationsCount > 0) {
    redirect(`/sites/${id}?erreur=a-des-installations`);
  }

  await prisma.site.deleteMany({ where: { id, companyId: session.user.companyId } });
  revalidatePath("/sites");
  redirect("/sites");
}
