import { PageHeader } from "@/components/ui/PageHeader";
import { TaskForm } from "../TaskForm";
import { createTask } from "@/lib/actions/tasks";

export default async function NouvelleTachePage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut } = await searchParams;

  return (
    <div>
      <PageHeader title="Ajouter une tâche" />
      <TaskForm action={createTask} defaultStatus={statut} />
    </div>
  );
}
