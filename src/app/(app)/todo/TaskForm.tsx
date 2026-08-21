"use client";

import { useActionState } from "react";
import { FormSection, Field, inputClass } from "@/components/ui/Form";
import { Button, LinkButton } from "@/components/ui/Button";
import type { TaskFormState } from "@/lib/actions/tasks";
import type { TaskModel as Task } from "@/generated/prisma/models";
import { Priority, TaskStatus } from "@/generated/prisma/enums";
import { priorityLabels, taskStatusLabels } from "@/lib/labels";

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function TaskForm({
  action,
  task,
  defaultStatus,
}: {
  action: (prevState: TaskFormState, formData: FormData) => Promise<TaskFormState>;
  task?: Task;
  defaultStatus?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="max-w-2xl">
      <FormSection title="Informations principales">
        <Field label="Titre" htmlFor="title" required full error={state.fieldErrors?.title}>
          <input id="title" name="title" defaultValue={task?.title} required className={inputClass} />
        </Field>
        <Field label="Responsable" htmlFor="assignee" error={state.fieldErrors?.assignee}>
          <input id="assignee" name="assignee" defaultValue={task?.assignee ?? ""} className={inputClass} />
        </Field>
        <Field label="Échéance" htmlFor="dueDate" error={state.fieldErrors?.dueDate}>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={toDateInputValue(task?.dueDate)}
            className={inputClass}
          />
        </Field>
        <Field label="Priorité" htmlFor="priority" required error={state.fieldErrors?.priority}>
          <select
            id="priority"
            name="priority"
            defaultValue={task?.priority ?? Priority.MOYENNE}
            className={inputClass}
          >
            {Object.values(Priority).map((value) => (
              <option key={value} value={value}>
                {priorityLabels[value].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Statut" htmlFor="status" required error={state.fieldErrors?.status}>
          <select
            id="status"
            name="status"
            defaultValue={task?.status ?? defaultStatus ?? TaskStatus.A_FAIRE}
            className={inputClass}
          >
            {Object.values(TaskStatus).map((value) => (
              <option key={value} value={value}>
                {taskStatusLabels[value].label}
              </option>
            ))}
          </select>
        </Field>
      </FormSection>

      <FormSection title="Informations avancées" description="Facultatif">
        <Field label="Description" htmlFor="description" full error={state.fieldErrors?.description}>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={task?.description ?? ""}
            className={inputClass}
          />
        </Field>
      </FormSection>

      {state.error && (
        <p className="mb-4 rounded-md bg-[var(--color-critical-bg)] px-3 py-2 text-sm text-[var(--color-critical)]">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Enregistrement..." : "Enregistrer"}
        </Button>
        <LinkButton href="/todo" variant="ghost">
          Annuler
        </LinkButton>
      </div>
    </form>
  );
}
