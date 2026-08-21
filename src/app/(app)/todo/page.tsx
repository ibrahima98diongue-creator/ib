import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListPageShell } from "@/components/ListPageShell";
import { LinkButton } from "@/components/ui/Button";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { TodoKanban } from "./TodoKanban";
import { TodoCalendar } from "./TodoCalendar";
import { deleteTask } from "@/lib/actions/tasks";
import { priorityLabels, taskStatusLabels } from "@/lib/labels";
import { addMonths, parseDateParam, startOfMonth, toDateParam } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { clsx } from "clsx";
import Link from "next/link";

type Vue = "liste" | "kanban" | "calendrier";

function buildHref(vue: Vue, date?: Date) {
  return date ? `/todo?vue=${vue}&date=${toDateParam(date)}` : `/todo?vue=${vue}`;
}

export default async function TodoPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; date?: string }>;
}) {
  const { vue: vueParam, date: dateParam } = await searchParams;
  const vue: Vue = vueParam === "kanban" || vueParam === "calendrier" ? vueParam : "liste";
  const month = startOfMonth(parseDateParam(dateParam));

  const session = await auth();
  const tasks = await prisma.task.findMany({
    where: { companyId: session!.user.companyId },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return (
    <ListPageShell
      title="To-Do"
      description="Les tâches de votre équipe."
      count={tasks.length}
      addHref="/todo/nouveau"
      addLabel="+ Ajouter une tâche"
      emptyTitle="Aucune tâche"
      emptyDescription="Vous n'avez encore aucune tâche."
      emptyActions={
        <LinkButton href="/todo/nouveau" variant="primary">
          + Ajouter une tâche
        </LinkButton>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex overflow-hidden rounded-md border border-[var(--color-border-strong)]">
          {(["liste", "kanban", "calendrier"] as Vue[]).map((v) => (
            <Link
              key={v}
              href={buildHref(v, v === "calendrier" ? month : undefined)}
              className={clsx(
                "px-3 py-1.5 text-sm font-medium capitalize",
                v === vue
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text-secondary)] hover:bg-gray-50",
              )}
            >
              {v}
            </Link>
          ))}
        </div>

        {vue === "calendrier" && (
          <div className="flex items-center gap-3">
            <Link
              href={buildHref("calendrier", addMonths(month, -1))}
              className="rounded-md border border-[var(--color-border-strong)] px-2.5 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-gray-50"
            >
              ← Précédent
            </Link>
            <span className="text-sm font-medium capitalize text-[var(--color-text)]">
              {new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(month)}
            </span>
            <Link
              href={buildHref("calendrier", addMonths(month, 1))}
              className="rounded-md border border-[var(--color-border-strong)] px-2.5 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-gray-50"
            >
              Suivant →
            </Link>
          </div>
        )}
      </div>

      {vue === "liste" && (
        <Table>
          <Thead>
            <Th>Titre</Th>
            <Th>Responsable</Th>
            <Th>Échéance</Th>
            <Th>Priorité</Th>
            <Th>Statut</Th>
            <Th />
          </Thead>
          <Tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50">
                <Td>
                  <Link
                    href={`/todo/${task.id}/modifier`}
                    className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                  >
                    {task.title}
                  </Link>
                </Td>
                <Td className="text-[var(--color-text-secondary)]">{task.assignee || "—"}</Td>
                <Td className="text-[var(--color-text-secondary)]">{formatDate(task.dueDate)}</Td>
                <Td>
                  <Badge tone={priorityLabels[task.priority].tone}>{priorityLabels[task.priority].label}</Badge>
                </Td>
                <Td>
                  <Badge tone={taskStatusLabels[task.status].tone}>{taskStatusLabels[task.status].label}</Badge>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/todo/${task.id}/modifier`}
                      className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                      Modifier
                    </Link>
                    <DeleteButton
                      action={deleteTask}
                      id={task.id}
                      confirmMessage={`Supprimer la tâche "${task.title}" ?`}
                    />
                  </div>
                </Td>
              </tr>
            ))}
          </Tbody>
        </Table>
      )}

      {vue === "kanban" && <TodoKanban tasks={tasks} />}

      {vue === "calendrier" && <TodoCalendar month={month} tasks={tasks} />}
    </ListPageShell>
  );
}
