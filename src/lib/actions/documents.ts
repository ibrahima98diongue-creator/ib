"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { saveUploadedFile, deleteStoredFile } from "@/lib/storage";

export type DocumentFormState = {
  error?: string;
};

const linkTypes = ["client", "site", "installation", "equipement", "chantier", "maintenance"] as const;
type LinkType = (typeof linkTypes)[number];

// Chemin de retour (page appelante) et vérification d'appartenance à
// l'entreprise, pour chaque type d'entité pouvant recevoir un document.
const linkConfig: Record<
  LinkType,
  {
    field: "clientId" | "siteId" | "installationId" | "equipementId" | "chantierId" | "maintenanceId";
    findOwned: (companyId: string, id: string) => Promise<{ id: string } | null>;
    path: (id: string) => string;
  }
> = {
  client: {
    field: "clientId",
    findOwned: (companyId, id) => prisma.client.findFirst({ where: { id, companyId }, select: { id: true } }),
    path: (id) => `/clients/${id}`,
  },
  site: {
    field: "siteId",
    findOwned: (companyId, id) => prisma.site.findFirst({ where: { id, companyId }, select: { id: true } }),
    path: (id) => `/sites/${id}`,
  },
  installation: {
    field: "installationId",
    findOwned: (companyId, id) =>
      prisma.installation.findFirst({ where: { id, site: { companyId } }, select: { id: true } }),
    path: (id) => `/installations/${id}`,
  },
  equipement: {
    field: "equipementId",
    findOwned: (companyId, id) =>
      prisma.equipement.findFirst({
        where: { id, installation: { site: { companyId } } },
        select: { id: true },
      }),
    path: (id) => `/equipements/${id}`,
  },
  chantier: {
    field: "chantierId",
    findOwned: (companyId, id) =>
      prisma.chantier.findFirst({ where: { id, site: { companyId } }, select: { id: true } }),
    path: (id) => `/chantiers/${id}`,
  },
  maintenance: {
    field: "maintenanceId",
    findOwned: (companyId, id) =>
      prisma.maintenance.findFirst({ where: { id, site: { companyId } }, select: { id: true } }),
    path: (id) => `/maintenance/${id}`,
  },
};

const uploadSchema = z.object({
  linkType: z.enum(linkTypes),
  linkId: z.string().trim().min(1),
  // .nullish() plutôt que .optional() : le champ "name" n'existe pas dans le
  // formulaire (pas de champ de renommage), donc formData.get() renvoie
  // `null`, pas `undefined`.
  name: z.string().trim().nullish(),
});

async function requireSession() {
  const session = await auth();
  if (!session?.user?.companyId) throw new Error("Non authentifié.");
  return session;
}

export async function uploadDocument(
  _prevState: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const session = await requireSession();

  const parsed = uploadSchema.safeParse({
    linkType: formData.get("linkType"),
    linkId: formData.get("linkId"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: "Impossible d'enregistrer les données. Vérifiez les champs obligatoires." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Veuillez sélectionner un fichier." };
  }

  const config = linkConfig[parsed.data.linkType];
  const owned = await config.findOwned(session.user.companyId, parsed.data.linkId);
  if (!owned) {
    return { error: "Élément introuvable." };
  }

  const { storedName, size } = await saveUploadedFile(session.user.companyId, file);

  await prisma.document.create({
    data: {
      companyId: session.user.companyId,
      name: parsed.data.name || file.name,
      storedName,
      mimeType: file.type || null,
      size,
      uploadedById: session.user.id,
      [config.field]: parsed.data.linkId,
    },
  });

  revalidatePath("/documents");
  revalidatePath(config.path(parsed.data.linkId));
  return {};
}

export async function deleteDocument(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id"));
  const returnTo = String(formData.get("returnTo") || "/documents");

  const document = await prisma.document.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!document) {
    redirect(returnTo);
  }

  await prisma.document.delete({ where: { id: document.id } });
  await deleteStoredFile(session.user.companyId, document.storedName);

  revalidatePath("/documents");
  revalidatePath(returnTo);
  redirect(returnTo);
}
