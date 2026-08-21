"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fieldErrors, GENERIC_ERROR } from "@/lib/validation";

const numeric = (message: string) =>
  z
    .union([z.literal(""), z.coerce.number({ error: message })])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v));

const meteoSchema = z.object({
  siteId: z.string().trim().min(1, "Le site est obligatoire."),
  date: z.string().trim().min(1, "La date est obligatoire."),
  irradiation: numeric("Irradiation invalide."),
  ghi: numeric("GHI invalide."),
  dni: numeric("DNI invalide."),
  dhi: numeric("DHI invalide."),
  temperature: numeric("Température invalide."),
  windSpeed: numeric("Vent invalide."),
  precipitation: numeric("Précipitations invalides."),
  notes: z.string().trim().optional(),
});

export type MeteoFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function requireSession() {
  const session = await auth();
  if (!session?.user?.companyId) throw new Error("Non authentifié.");
  return session;
}

function parseForm(formData: FormData) {
  return meteoSchema.safeParse({
    siteId: formData.get("siteId"),
    date: formData.get("date"),
    irradiation: formData.get("irradiation"),
    ghi: formData.get("ghi"),
    dni: formData.get("dni"),
    dhi: formData.get("dhi"),
    temperature: formData.get("temperature"),
    windSpeed: formData.get("windSpeed"),
    precipitation: formData.get("precipitation"),
    notes: formData.get("notes"),
  });
}

export async function createMeteo(
  _prevState: MeteoFormState,
  formData: FormData,
): Promise<MeteoFormState> {
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

  const existing = await prisma.meteo.findUnique({
    where: { siteId_date: { siteId: site.id, date: new Date(parsed.data.date) } },
  });
  if (existing) {
    return {
      error: GENERIC_ERROR,
      fieldErrors: { date: "Une donnée météo existe déjà pour ce site à cette date. Modifiez-la plutôt." },
    };
  }

  await prisma.meteo.create({
    data: { ...parsed.data, date: new Date(parsed.data.date) },
  });

  revalidatePath("/meteo");
  redirect("/meteo");
}

export async function updateMeteo(
  meteoId: string,
  _prevState: MeteoFormState,
  formData: FormData,
): Promise<MeteoFormState> {
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

  const duplicate = await prisma.meteo.findUnique({
    where: { siteId_date: { siteId: site.id, date: new Date(parsed.data.date) } },
  });
  if (duplicate && duplicate.id !== meteoId) {
    return {
      error: GENERIC_ERROR,
      fieldErrors: { date: "Une donnée météo existe déjà pour ce site à cette date." },
    };
  }

  const result = await prisma.meteo.updateMany({
    where: { id: meteoId, site: { companyId: session.user.companyId } },
    data: { ...parsed.data, date: new Date(parsed.data.date) },
  });
  if (result.count === 0) {
    return { error: "Donnée météo introuvable." };
  }

  revalidatePath("/meteo");
  redirect("/meteo");
}

export async function deleteMeteo(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id"));

  await prisma.meteo.deleteMany({
    where: { id, site: { companyId: session.user.companyId } },
  });
  revalidatePath("/meteo");
  redirect("/meteo");
}
