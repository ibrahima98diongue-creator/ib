"use client";

import { useActionState } from "react";
import { FormSection, Field, inputClass } from "@/components/ui/Form";
import { Button, LinkButton } from "@/components/ui/Button";
import type { MeteoFormState } from "@/lib/actions/meteo";
import type { MeteoModel as Meteo, SiteModel as Site } from "@/generated/prisma/models";

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function MeteoForm({
  action,
  meteo,
  sites,
  defaultSiteId,
}: {
  action: (prevState: MeteoFormState, formData: FormData) => Promise<MeteoFormState>;
  meteo?: Meteo;
  sites: Pick<Site, "id" | "name">[];
  defaultSiteId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="max-w-2xl">
      <FormSection title="Informations principales" description="Les données météo et d'irradiation du jour.">
        <Field label="Site" htmlFor="siteId" required error={state.fieldErrors?.siteId}>
          <select
            id="siteId"
            name="siteId"
            defaultValue={meteo?.siteId ?? defaultSiteId ?? ""}
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
            defaultValue={toDateInputValue(meteo?.date) || new Date().toISOString().slice(0, 10)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Irradiation (kWh/m²)" htmlFor="irradiation" error={state.fieldErrors?.irradiation}>
          <input
            id="irradiation"
            name="irradiation"
            type="number"
            step="0.01"
            defaultValue={meteo?.irradiation ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="GHI (W/m²)" htmlFor="ghi" error={state.fieldErrors?.ghi}>
          <input id="ghi" name="ghi" type="number" step="0.1" defaultValue={meteo?.ghi ?? ""} className={inputClass} />
        </Field>
        <Field label="DNI (W/m²)" htmlFor="dni" error={state.fieldErrors?.dni}>
          <input id="dni" name="dni" type="number" step="0.1" defaultValue={meteo?.dni ?? ""} className={inputClass} />
        </Field>
        <Field label="DHI (W/m²)" htmlFor="dhi" error={state.fieldErrors?.dhi}>
          <input id="dhi" name="dhi" type="number" step="0.1" defaultValue={meteo?.dhi ?? ""} className={inputClass} />
        </Field>
        <Field label="Température (°C)" htmlFor="temperature" error={state.fieldErrors?.temperature}>
          <input
            id="temperature"
            name="temperature"
            type="number"
            step="0.1"
            defaultValue={meteo?.temperature ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Vent (km/h)" htmlFor="windSpeed" error={state.fieldErrors?.windSpeed}>
          <input
            id="windSpeed"
            name="windSpeed"
            type="number"
            step="0.1"
            defaultValue={meteo?.windSpeed ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Précipitations (mm)" htmlFor="precipitation" error={state.fieldErrors?.precipitation}>
          <input
            id="precipitation"
            name="precipitation"
            type="number"
            step="0.1"
            defaultValue={meteo?.precipitation ?? ""}
            className={inputClass}
          />
        </Field>
      </FormSection>

      <FormSection title="Informations avancées" description="Facultatif">
        <Field label="Notes" htmlFor="notes" full error={state.fieldErrors?.notes}>
          <textarea id="notes" name="notes" rows={2} defaultValue={meteo?.notes ?? ""} className={inputClass} />
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
        <LinkButton href="/meteo" variant="ghost">
          Annuler
        </LinkButton>
      </div>
    </form>
  );
}
