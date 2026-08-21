"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fieldErrors, GENERIC_ERROR } from "@/lib/validation";
import { UserRole } from "@/generated/prisma/enums";

export type SettingsFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

async function requireSession() {
  const session = await auth();
  if (!session?.user?.companyId) throw new Error("Non authentifié.");
  return session;
}

function requireAdmin(role: string) {
  if (role !== UserRole.ADMIN) {
    throw new Error("Action réservée aux administrateurs.");
  }
}

// -----------------------------------------------------------------------
// Entreprise
// -----------------------------------------------------------------------

const companyNameSchema = z.object({ name: z.string().trim().min(1, "Le nom est obligatoire.") });

export async function updateCompanyName(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const session = await requireSession();
  requireAdmin(session.user.role);

  const parsed = companyNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: GENERIC_ERROR, fieldErrors: fieldErrors(parsed.error) };
  }

  await prisma.company.update({ where: { id: session.user.companyId }, data: { name: parsed.data.name } });
  revalidatePath("/parametres");
  return { success: "Entreprise mise à jour." };
}

// -----------------------------------------------------------------------
// Utilisateurs
// -----------------------------------------------------------------------

const newUserSchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire."),
  email: z.string().trim().email("Email invalide."),
  password: z.string().min(8, "8 caractères minimum."),
  role: z.enum(UserRole),
});

export async function createUser(_prevState: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const session = await requireSession();
  requireAdmin(session.user.role);

  const parsed = newUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: GENERIC_ERROR, fieldErrors: fieldErrors(parsed.error) };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: GENERIC_ERROR, fieldErrors: { email: "Cet email est déjà utilisé." } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      companyId: session.user.companyId,
      name: parsed.data.name,
      email,
      passwordHash,
      role: parsed.data.role,
    },
  });

  revalidatePath("/parametres");
  return { success: "Utilisateur créé." };
}

export async function updateUserRole(userId: string, role: string) {
  const session = await requireSession();
  requireAdmin(session.user.role);

  if (userId === session.user.id) {
    throw new Error("Vous ne pouvez pas modifier votre propre rôle.");
  }
  if (!Object.values(UserRole).includes(role as UserRole)) {
    throw new Error("Rôle invalide.");
  }

  await prisma.user.updateMany({
    where: { id: userId, companyId: session.user.companyId },
    data: { role: role as UserRole },
  });
  revalidatePath("/parametres");
}

export async function deleteUser(formData: FormData) {
  const session = await requireSession();
  requireAdmin(session.user.role);

  const userId = String(formData.get("id"));
  if (userId === session.user.id) {
    throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
  }

  const target = await prisma.user.findFirst({ where: { id: userId, companyId: session.user.companyId } });
  if (!target) return;

  if (target.role === UserRole.ADMIN) {
    const adminCount = await prisma.user.count({ where: { companyId: session.user.companyId, role: UserRole.ADMIN } });
    if (adminCount <= 1) {
      throw new Error("Impossible de supprimer le dernier administrateur.");
    }
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/parametres");
}

// -----------------------------------------------------------------------
// Mon compte
// -----------------------------------------------------------------------

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis."),
    newPassword: z.string().min(8, "8 caractères minimum."),
  });

export async function changeMyPassword(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const session = await requireSession();

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { error: GENERIC_ERROR, fieldErrors: fieldErrors(parsed.error) };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Utilisateur introuvable." };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { error: GENERIC_ERROR, fieldErrors: { currentPassword: "Mot de passe actuel incorrect." } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { success: "Mot de passe mis à jour." };
}
