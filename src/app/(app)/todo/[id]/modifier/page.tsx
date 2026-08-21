import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { TaskForm } from "../../TaskForm";
import { updateTask } from "@/lib/actions/tasks";

export default async function ModifierTachePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const task = await prisma.task.findFirst({ where: { id, companyId: session!.user.companyId } });
  if (!task) notFound();

  const action = updateTask.bind(null, task.id);

  return (
    <div>
      <PageHeader title={`Modifier ${task.title}`} />
      <TaskForm action={action} task={task} />
    </div>
  );
}
