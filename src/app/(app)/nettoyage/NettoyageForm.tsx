"use client";

import { useActionState } from "react";
import { FormSection, Field, inputClass } from "@/components/ui/Form";
import { Button, LinkButton } from "@/components/ui/Button";
import type { NettoyageFormState } from "@/lib/actions/nettoyages";
import type { NettoyageModel as Nettoyage, SiteModel as Site } from "@/generated/prisma/models";
import { ChantierStatus, Priority } from "@/generated/prisma/enums";
import { chantierStatusLabels, priorityLabels } from "@/lib/labels";

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function NettoyageForm({
  action,
  nettoyage,
  sites,
  defaultSiteId,
}: {
  action: (prevState: NettoyageFormState, formData: FormData) => Promise<NettoyageFormState>;
  nettoyage?: Nettoyage;
  sites: Pick<Site, "id" | "name">[];
  defaultSiteId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="max-w-2xl">
      <FormSection title="Informations principales">
        <Field label="Titre" htmlFor="title" required full error={state.fieldErrors?.title}>
          <input id="title" name="title" defaultValue={nettoyage?.title} required className={inputClass} />
        </Field>
        <Field label="Site" htmlFor="siteId" required error={state.fieldErrors?.siteId}>
          <select
            id="siteId"
            name="siteId"
            defaultValue={nettoyage?.siteId ?? defaultSiteId ?? ""}
            required
            className={inputClass}
          >
            <option value="" disabled>
              Sélectionner un site
            </option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Statut" htmlFor="status" required error={state.fieldErrors?.status}>
          <select
            id="status"
            name="status"
            defaultValue={nettoyage?.status ?? ChantierStatus.A_PLANIFIER}
            className={inputClass}
          >
            {Object.values(ChantierStatus).map((value) => (
              <option key={value} value={value}>
                {chantierStatusLabels[value].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Priorité" htmlFor="priority" required error={state.fieldErrors?.priority}>
          <select
            id="priority"
            name="priority"
            defaultValue={nettoyage?.priority ?? Priority.MOYENNE}
            className={inputClass}
          >
            {Object.values(Priority).map((value) => (
              <option key={value} value={value}>
                {priorityLabels[value].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date prévue" htmlFor="scheduledDate" error={state.fieldErrors?.scheduledDate}>
          <input
            id="scheduledDate"
            name="scheduledDate"
            type="date"
            defaultValue={toDateInputValue(nettoyage?.scheduledDate)}
            className={inputClass}
          />
        </Field>
        <Field label="Responsable" htmlFor="responsable" error={state.fieldErrors?.responsable}>
          <input
            id="responsable"
            name="responsable"
            defaultValue={nettoyage?.responsable ?? ""}
            className={inputClass}
          />
        </Field>
      </FormSection>

      <FormSection title="Informations avancées" description="Facultatif">
        <Field label="Description" htmlFor="description" full error={state.fieldErrors?.description}>
          <textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={nettoyage?.description ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Notes" htmlFor="notes" full error={state.fieldErrors?.notes}>
          <textarea id="notes" name="notes" rows={2} defaultValue={nettoyage?.notes ?? ""} className={inputClass} />
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
        <LinkButton href={nettoyage ? `/nettoyage/${nettoyage.id}` : "/nettoyage"} variant="ghost">
          Annuler
        </LinkButton>
      </div>
    </form>
  );
}
