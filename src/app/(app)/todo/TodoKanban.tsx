"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";
import { priorityLabels, taskStatusLabels } from "@/lib/labels";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { TaskStatus } from "@/generated/prisma/enums";
import type { TaskModel as Task } from "@/generated/prisma/models";
import { formatDateShort } from "@/lib/format";

export function TodoKanban({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const columns = Object.values(TaskStatus).map((status) => ({
    status,
    tasks: tasks.filter((t) => t.status === status),
  }));

  function handleDrop(status: TaskStatus, event: React.DragEvent) {
    event.preventDefault();
    setDragOverColumn(null);
    const taskId = event.dataTransfer.getData("text/plain");
    if (!taskId) return;
    startTransition(async () => {
      await updateTaskStatus(taskId, status);
      router.refresh();
    });
  }

  return (
    <div className={clsx("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", isPending && "opacity-60")}>
      {columns.map((column) => (
        <div
          key={column.status}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverColumn(column.status);
          }}
          onDragLeave={() => setDragOverColumn(null)}
          onDrop={(e) => handleDrop(column.status, e)}
          className={clsx(
            "flex min-h-[200px] flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3",
            dragOverColumn === column.status && "border-[var(--color-primary)] bg-[var(--color-primary-bg)]",
          )}
        >
          <div className="mb-1 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              {taskStatusLabels[column.status].label}
            </h3>
            <span className="text-xs text-[var(--color-text-secondary)]">{column.tasks.length}</span>
          </div>

          {column.tasks.map((task) => {
            return (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", task.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                className="cursor-grab rounded-md border border-[var(--color-border)] bg-white p-3 shadow-[var(--shadow-sm)] active:cursor-grabbing"
              >
                <Link
                  href={`/todo/${task.id}/modifier`}
                  className="text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                >
                  {task.title}
                </Link>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone={priorityLabels[task.priority].tone}>{priorityLabels[task.priority].label}</Badge>
                  {task.dueDate && (
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {formatDateShort(task.dueDate)}
                    </span>
                  )}
                </div>
                {task.assignee && (
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{task.assignee}</p>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
