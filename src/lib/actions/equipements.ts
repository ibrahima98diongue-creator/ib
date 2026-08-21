"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fieldErrors, GENERIC_ERROR } from "@/lib/validation";
import { EquipementStatus } from "@/generated/prisma/enums";

const equipementSchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire."),
  installationId: z.string().trim().min(1, "L'installation est obligatoire."),
  type: z.string().trim().optional(),
  status: z.enum(EquipementStatus),
  brand: z.string().trim().optional(),
  model: z.string().trim().optional(),
  serialNumber: z.string().trim().optional(),
  installDate: z
    .union([z.literal(""), z.string()])
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  notes: z.string().trim().optional(),
});

export type EquipementFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function requireSession() {
  const session = await auth();
  if (!session?.user?.companyId) throw new Error("Non authentifié.");
  return session;
}

function parseForm(formData: FormData) {
  return equipementSchema.safeParse({
    name: formData.get("name"),
    installationId: formData.get("installationId"),
    type: formData.get("type"),
    status: formData.get("status"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    serialNumber: formData.get("serialNumber"),
    installDate: formData.get("installDate"),
    notes: formData.get("notes"),
  });
}

export async function createEquipement(
  _prevState: EquipementFormState,
  formData: FormData,
): Promise<EquipementFormState> {
  const session = await requireSession();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: GENERIC_ERROR, fieldErrors: fieldErrors(parsed.error) };
  }

  const installation = await prisma.installation.findFirst({
    where: { id: parsed.data.installationId, site: { companyId: session.user.companyId } },
  });
  if (!installation) {
    return { error: GENERIC_ERROR, fieldErrors: { installationId: "Installation invalide." } };
  }

  const equipement = await prisma.equipement.create({ data: parsed.data });

  revalidatePath("/equipements");
  revalidatePath(`/installations/${installation.id}`);
  redirect(`/equipements/${equipement.id}`);
}

export async function updateEquipement(
  equipementId: string,
  _prevState: EquipementFormState,
  formData: FormData,
): Promise<EquipementFormState> {
  const session = await requireSession();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: GENERIC_ERROR, fieldErrors: fieldErrors(parsed.error) };
  }

  const installation = await prisma.installation.findFirst({
    where: { id: parsed.data.installationId, site: { companyId: session.user.companyId } },
  });
  if (!installation) {
    return { error: GENERIC_ERROR, fieldErrors: { installationId: "Installation invalide." } };
  }

  const result = await prisma.equipement.updateMany({
    where: { id: equipementId, installation: { site: { companyId: session.user.companyId } } },
    data: parsed.data,
  });
  if (result.count === 0) {
    return { error: "Équipement introuvable." };
  }

  revalidatePath("/equipements");
  revalidatePath(`/equipements/${equipementId}`);
  redirect(`/equipements/${equipementId}`);
}

export async function deleteEquipement(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id"));

  await prisma.equipement.deleteMany({
    where: { id, installation: { site: { companyId: session.user.companyId } } },
  });
  revalidatePath("/equipements");
  redirect("/equipements");
}
