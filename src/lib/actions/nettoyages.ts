"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fieldErrors, GENERIC_ERROR } from "@/lib/validation";
import { ChantierStatus, Priority } from "@/generated/prisma/enums";

const nettoyageSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire."),
  siteId: z.string().trim().min(1, "Le site est obligatoire."),
  status: z.enum(ChantierStatus),
  priority: z.enum(Priority),
  scheduledDate: z
    .union([z.literal(""), z.string()])
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  responsable: z.string().trim().optional(),
  description: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type NettoyageFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function requireSession() {
  const session = await auth();
  if (!session?.user?.companyId) throw new Error("Non authentifié.");
  return session;
}

function parseForm(formData: FormData) {
  return nettoyageSchema.safeParse({
    title: formData.get("title"),
    siteId: formData.get("siteId"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    scheduledDate: formData.get("scheduledDate"),
    responsable: formData.get("responsable"),
    description: formData.get("description"),
    notes: formData.get("notes"),
  });
}

export async function createNettoyage(
  _prevState: NettoyageFormState,
  formData: FormData,
): Promise<NettoyageFormState> {
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

  const nettoyage = await prisma.nettoyage.create({ data: parsed.data });

  revalidatePath("/nettoyage");
  revalidatePath(`/sites/${site.id}`);
  redirect(`/nettoyage/${nettoyage.id}`);
}

export async function updateNettoyage(
  nettoyageId: string,
  _prevState: NettoyageFormState,
  formData: FormData,
): Promise<NettoyageFormState> {
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

  const result = await prisma.nettoyage.updateMany({
    where: { id: nettoyageId, site: { companyId: session.user.companyId } },
    data: parsed.data,
  });
  if (result.count === 0) {
    return { error: "Nettoyage introuvable." };
  }

  revalidatePath("/nettoyage");
  revalidatePath(`/nettoyage/${nettoyageId}`);
  redirect(`/nettoyage/${nettoyageId}`);
}

export async function deleteNettoyage(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id"));

  await prisma.nettoyage.deleteMany({
    where: { id, site: { companyId: session.user.companyId } },
  });
  revalidatePath("/nettoyage");
  redirect("/nettoyage");
}
