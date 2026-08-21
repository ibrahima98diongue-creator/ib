"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fieldErrors, GENERIC_ERROR } from "@/lib/validation";
import { Priority, TaskStatus } from "@/generated/prisma/enums";

const taskSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire."),
  assignee: z.string().trim().optional(),
  dueDate: z
    .union([z.literal(""), z.string()])
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  priority: z.enum(Priority),
  status: z.enum(TaskStatus),
  description: z.string().trim().optional(),
});

export type TaskFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function requireSession() {
  const session = await auth();
  if (!session?.user?.companyId) throw new Error("Non authentifié.");
  return session;
}

function parseForm(formData: FormData) {
  return taskSchema.safeParse({
    title: formData.get("title"),
    assignee: formData.get("assignee"),
    dueDate: formData.get("dueDate"),
    priority: formData.get("priority"),
    status: formData.get("status"),
    description: formData.get("description"),
  });
}

export async function createTask(
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const session = await requireSession();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: GENERIC_ERROR, fieldErrors: fieldErrors(parsed.error) };
  }

  await prisma.task.create({ data: { ...parsed.data, companyId: session.user.companyId } });

  revalidatePath("/todo");
  redirect("/todo");
}

export async function updateTask(
  taskId: string,
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const session = await requireSession();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: GENERIC_ERROR, fieldErrors: fieldErrors(parsed.error) };
  }

  const result = await prisma.task.updateMany({
    where: { id: taskId, companyId: session.user.companyId },
    data: parsed.data,
  });
  if (result.count === 0) {
    return { error: "Tâche introuvable." };
  }

  revalidatePath("/todo");
  redirect("/todo");
}

export async function deleteTask(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id"));

  await prisma.task.deleteMany({ where: { id, companyId: session.user.companyId } });
  revalidatePath("/todo");
  redirect("/todo");
}

// Utilisé par la vue Kanban (glisser-déposer) : ne change que le statut,
// sans repasser par le formulaire complet.
export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const session = await requireSession();

  await prisma.task.updateMany({
    where: { id: taskId, companyId: session.user.companyId },
    data: { status },
  });

  revalidatePath("/todo");
}
