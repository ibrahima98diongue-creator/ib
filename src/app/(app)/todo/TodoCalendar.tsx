import Link from "next/link";
import { clsx } from "clsx";
import { getMonthGrid, toDateParam } from "@/lib/dates";
import { priorityLabels } from "@/lib/labels";
import { toneColor } from "@/components/ui/Badge";
import type { TaskModel as Task } from "@/generated/prisma/models";

const weekdayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function TodoCalendar({ month, tasks }: { month: Date; tasks: Task[] }) {
  const weeks = getMonthGrid(month);
  const tasksByDay = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const key = toDateParam(task.dueDate);
    tasksByDay.set(key, [...(tasksByDay.get(key) ?? []), task]);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
      <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-bg)] text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
        {weekdayLabels.map((label) => (
          <div key={label} className="px-2 py-2">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((day) => {
          const key = toDateParam(day);
          const dayTasks = tasksByDay.get(key) ?? [];
          const inMonth = day.getMonth() === month.getMonth();
          const isToday = key === toDateParam(new Date());
          return (
            <div
              key={key}
              className={clsx(
                "min-h-[96px] border-b border-r border-[var(--color-border)] p-1.5 last:border-r-0",
                !inMonth && "bg-[var(--color-bg)]",
              )}
            >
              <p
                className={clsx(
                  "mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs",
                  isToday
                    ? "bg-[var(--color-primary)] font-medium text-white"
                    : inMonth
                      ? "text-[var(--color-text)]"
                      : "text-[var(--color-text-muted)]",
                )}
              >
                {day.getDate()}
              </p>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <Link
                    key={task.id}
                    href={`/todo/${task.id}/modifier`}
                    className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-xs text-[var(--color-text)] hover:underline"
                    title={task.title}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: toneColor(priorityLabels[task.priority].tone) }}
                    />
                    <span className="truncate">{task.title}</span>
                  </Link>
                ))}
                {dayTasks.length > 3 && (
                  <p className="px-1.5 text-xs text-[var(--color-text-secondary)]">
                    +{dayTasks.length - 3} autre{dayTasks.length - 3 > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
