"use client";

import { useActionState } from "react";
import { FormSection, Field, inputClass } from "@/components/ui/Form";
import { Button, LinkButton } from "@/components/ui/Button";
import type { ProductionFormState } from "@/lib/actions/productions";
import type { ProductionModel as Production, SiteModel as Site } from "@/generated/prisma/models";

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function ProductionForm({
  action,
  production,
  sites,
  defaultSiteId,
}: {
  action: (prevState: ProductionFormState, formData: FormData) => Promise<ProductionFormState>;
  production?: Production;
  sites: Pick<Site, "id" | "name">[];
  defaultSiteId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="max-w-2xl">
      <FormSection title="Informations principales">
        <Field label="Site" htmlFor="siteId" required error={state.fieldErrors?.siteId}>
          <select
            id="siteId"
            name="siteId"
            defaultValue={production?.siteId ?? defaultSiteId ?? ""}
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
        <Field label="Date" htmlFor="date" required error={state.fieldErrors?.date}>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={toDateInputValue(production?.date) || new Date().toISOString().slice(0, 10)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Production (kWh)" htmlFor="energyKwh" required full error={state.fieldErrors?.energyKwh}>
          <input
            id="energyKwh"
            name="energyKwh"
            type="number"
            step="0.01"
            min="0"
            defaultValue={production?.energyKwh ?? ""}
            required
            className={inputClass}
          />
        </Field>
      </FormSection>

      <FormSection title="Informations avancées" description="Facultatif">
        <Field label="Notes" htmlFor="notes" full error={state.fieldErrors?.notes}>
          <textarea id="notes" name="notes" rows={2} defaultValue={production?.notes ?? ""} className={inputClass} />
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
        <LinkButton href="/production" variant="ghost">
          Annuler
        </LinkButton>
      </div>
    </form>
  );
}
