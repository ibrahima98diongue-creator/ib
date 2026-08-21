"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fieldErrors, GENERIC_ERROR } from "@/lib/validation";
import { ChantierStatus, Priority } from "@/generated/prisma/enums";

const optionalDate = z
  .union([z.literal(""), z.string()])
  .optional()
  .transform((v) => (v ? new Date(v) : undefined));

const chantierSchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire."),
  siteId: z.string().trim().min(1, "Le site est obligatoire."),
  status: z.enum(ChantierStatus),
  priority: z.enum(Priority),
  responsable: z.string().trim().optional(),
  startDate: optionalDate,
  endDate: optionalDate,
  description: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type ChantierFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function requireSession() {
  const session = await auth();
  if (!session?.user?.companyId) throw new Error("Non authentifié.");
  return session;
}

function parseForm(formData: FormData) {
  return chantierSchema.safeParse({
    name: formData.get("name"),
    siteId: formData.get("siteId"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    responsable: formData.get("responsable"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    description: formData.get("description"),
    notes: formData.get("notes"),
  });
}

export async function createChantier(
  _prevState: ChantierFormState,
  formData: FormData,
): Promise<ChantierFormState> {
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

  const chantier = await prisma.chantier.create({ data: parsed.data });

  revalidatePath("/chantiers");
  revalidatePath(`/sites/${site.id}`);
  redirect(`/chantiers/${chantier.id}`);
}

export async function updateChantier(
  chantierId: string,
  _prevState: ChantierFormState,
  formData: FormData,
): Promise<ChantierFormState> {
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

  const result = await prisma.chantier.updateMany({
    where: { id: chantierId, site: { companyId: session.user.companyId } },
    data: parsed.data,
  });
  if (result.count === 0) {
    return { error: "Chantier introuvable." };
  }

  revalidatePath("/chantiers");
  revalidatePath(`/chantiers/${chantierId}`);
  redirect(`/chantiers/${chantierId}`);
}

export async function deleteChantier(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id"));

  await prisma.chantier.deleteMany({
    where: { id, site: { companyId: session.user.companyId } },
  });
  revalidatePath("/chantiers");
  redirect("/chantiers");
}
