"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fieldErrors, GENERIC_ERROR } from "@/lib/validation";

const clientSchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire."),
  contact: z.string().trim().optional(),
  email: z.union([z.literal(""), z.string().trim().email("Email invalide.")]).optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export type ClientFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function requireSession() {
  const session = await auth();
  if (!session?.user?.companyId) {
    throw new Error("Non authentifié.");
  }
  return session;
}

function parseForm(formData: FormData) {
  return clientSchema.safeParse({
    name: formData.get("name"),
    contact: formData.get("contact"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
  });
}

export async function createClient(
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const session = await requireSession();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: GENERIC_ERROR, fieldErrors: fieldErrors(parsed.error) };
  }

  const client = await prisma.client.create({
    data: { ...parsed.data, companyId: session.user.companyId },
  });

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

export async function updateClient(
  clientId: string,
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const session = await requireSession();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: GENERIC_ERROR, fieldErrors: fieldErrors(parsed.error) };
  }

  const result = await prisma.client.updateMany({
    where: { id: clientId, companyId: session.user.companyId },
    data: parsed.data,
  });
  if (result.count === 0) {
    return { error: "Client introuvable." };
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

export async function deleteClient(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id"));

  const sitesCount = await prisma.site.count({ where: { clientId: id } });
  if (sitesCount > 0) {
    // On ne supprime jamais silencieusement une donnée qui a des dépendances :
    // cela casserait la relation Client -> Site. On revient sur la fiche avec
    // un message clair plutôt que de planter avec une erreur technique.
    redirect(`/clients/${id}?erreur=a-des-sites`);
  }

  await prisma.client.deleteMany({
    where: { id, companyId: session.user.companyId },
  });
  revalidatePath("/clients");
  redirect("/clients");
}
