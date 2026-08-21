"use client";

import { useActionState } from "react";
import { FormSection, Field, inputClass } from "@/components/ui/Form";
import { Button, LinkButton } from "@/components/ui/Button";
import type { InstallationFormState } from "@/lib/actions/installations";
import type { InstallationModel as Installation, SiteModel as Site } from "@/generated/prisma/models";
import { SiteStatus } from "@/generated/prisma/enums";
import { siteStatusLabels } from "@/lib/labels";

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function InstallationForm({
  action,
  installation,
  sites,
  defaultSiteId,
}: {
  action: (prevState: InstallationFormState, formData: FormData) => Promise<InstallationFormState>;
  installation?: Installation;
  sites: Pick<Site, "id" | "name">[];
  defaultSiteId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="max-w-2xl">
      <FormSection title="Informations principales">
        <Field label="Nom de l'installation" htmlFor="name" required error={state.fieldErrors?.name}>
          <input id="name" name="name" defaultValue={installation?.name} required className={inputClass} />
        </Field>
        <Field label="Site" htmlFor="siteId" required error={state.fieldErrors?.siteId}>
          <select
            id="siteId"
            name="siteId"
            defaultValue={installation?.siteId ?? defaultSiteId ?? ""}
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
        <Field label="Type" htmlFor="type" error={state.fieldErrors?.type}>
          <input
            id="type"
            name="type"
            placeholder="Toiture, sol, ombrière..."
            defaultValue={installation?.type ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Capacité (kWc)" htmlFor="capacityKwc" error={state.fieldErrors?.capacityKwc}>
          <input
            id="capacityKwc"
            name="capacityKwc"
            type="number"
            step="0.01"
            defaultValue={installation?.capacityKwc ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Statut" htmlFor="status" required error={state.fieldErrors?.status}>
          <select
            id="status"
            name="status"
            defaultValue={installation?.status ?? SiteStatus.ACTIF}
            className={inputClass}
          >
            {Object.values(SiteStatus).map((value) => (
              <option key={value} value={value}>
                {siteStatusLabels[value].label}
              </option>
            ))}
          </select>
        </Field>
      </FormSection>

      <FormSection title="Informations avancées" description="Facultatif">
        <Field
          label="Date de mise en service"
          htmlFor="commissioningDate"
          error={state.fieldErrors?.commissioningDate}
        >
          <input
            id="commissioningDate"
            name="commissioningDate"
            type="date"
            defaultValue={toDateInputValue(installation?.commissioningDate)}
            className={inputClass}
          />
        </Field>
        <Field label="Notes" htmlFor="notes" full error={state.fieldErrors?.notes}>
          <textarea id="notes" name="notes" rows={2} defaultValue={installation?.notes ?? ""} className={inputClass} />
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
        <LinkButton href={installation ? `/installations/${installation.id}` : "/installations"} variant="ghost">
          Annuler
        </LinkButton>
      </div>
    </form>
  );
}
