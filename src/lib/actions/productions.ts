"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fieldErrors, GENERIC_ERROR } from "@/lib/validation";

const productionSchema = z.object({
  siteId: z.string().trim().min(1, "Le site est obligatoire."),
  date: z.string().trim().min(1, "La date est obligatoire."),
  energyKwh: z.coerce.number({ error: "Production invalide." }).min(0, "La production ne peut pas être négative."),
  notes: z.string().trim().optional(),
});

export type ProductionFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function requireSession() {
  const session = await auth();
  if (!session?.user?.companyId) throw new Error("Non authentifié.");
  return session;
}

function parseForm(formData: FormData) {
  return productionSchema.safeParse({
    siteId: formData.get("siteId"),
    date: formData.get("date"),
    energyKwh: formData.get("energyKwh"),
    notes: formData.get("notes"),
  });
}

export async function createProduction(
  _prevState: ProductionFormState,
  formData: FormData,
): Promise<ProductionFormState> {
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

  const existing = await prisma.production.findUnique({
    where: { siteId_date: { siteId: site.id, date: new Date(parsed.data.date) } },
  });
  if (existing) {
    return {
      error: GENERIC_ERROR,
      fieldErrors: { date: "Une production existe déjà pour ce site à cette date. Modifiez-la plutôt." },
    };
  }

  await prisma.production.create({
    data: { ...parsed.data, date: new Date(parsed.data.date) },
  });

  revalidatePath("/production");
  revalidatePath(`/sites/${site.id}`);
  redirect("/production");
}

export async function updateProduction(
  productionId: string,
  _prevState: ProductionFormState,
  formData: FormData,
): Promise<ProductionFormState> {
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

  const duplicate = await prisma.production.findUnique({
    where: { siteId_date: { siteId: site.id, date: new Date(parsed.data.date) } },
  });
  if (duplicate && duplicate.id !== productionId) {
    return {
      error: GENERIC_ERROR,
      fieldErrors: { date: "Une production existe déjà pour ce site à cette date." },
    };
  }

  const result = await prisma.production.updateMany({
    where: { id: productionId, site: { companyId: session.user.companyId } },
    data: { ...parsed.data, date: new Date(parsed.data.date) },
  });
  if (result.count === 0) {
    return { error: "Production introuvable." };
  }

  revalidatePath("/production");
  revalidatePath(`/sites/${site.id}`);
  redirect("/production");
}

export async function deleteProduction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id"));

  await prisma.production.deleteMany({
    where: { id, site: { companyId: session.user.companyId } },
  });
  revalidatePath("/production");
  redirect("/production");
}
