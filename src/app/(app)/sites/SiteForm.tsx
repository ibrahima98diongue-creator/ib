"use client";

import { useActionState } from "react";
import { FormSection, Field, inputClass } from "@/components/ui/Form";
import { Button, LinkButton } from "@/components/ui/Button";
import type { SiteFormState } from "@/lib/actions/sites";
import type { SiteModel as Site, ClientModel as Client } from "@/generated/prisma/models";
import { SiteStatus } from "@/generated/prisma/enums";
import { siteStatusLabels } from "@/lib/labels";

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function SiteForm({
  action,
  site,
  clients,
  defaultClientId,
}: {
  action: (prevState: SiteFormState, formData: FormData) => Promise<SiteFormState>;
  site?: Site;
  clients: Pick<Client, "id" | "name">[];
  defaultClientId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="max-w-2xl">
      <FormSection title="Informations principales">
        <Field label="Nom du site" htmlFor="name" required error={state.fieldErrors?.name}>
          <input id="name" name="name" defaultValue={site?.name} required className={inputClass} />
        </Field>
        <Field label="Client" htmlFor="clientId" required error={state.fieldErrors?.clientId}>
          <select
            id="clientId"
            name="clientId"
            defaultValue={site?.clientId ?? defaultClientId ?? ""}
            required
            className={inputClass}
          >
            <option value="" disabled>
              Sélectionner un client
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Pays" htmlFor="country" error={state.fieldErrors?.country}>
          <input id="country" name="country" defaultValue={site?.country ?? ""} className={inputClass} />
        </Field>
        <Field label="Puissance (kWc)" htmlFor="powerKwc" error={state.fieldErrors?.powerKwc}>
          <input
            id="powerKwc"
            name="powerKwc"
            type="number"
            step="0.01"
            defaultValue={site?.powerKwc ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Statut" htmlFor="status" required error={state.fieldErrors?.status}>
          <select
            id="status"
            name="status"
            defaultValue={site?.status ?? SiteStatus.ACTIF}
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
        <Field label="Adresse" htmlFor="address" full error={state.fieldErrors?.address}>
          <textarea id="address" name="address" rows={2} defaultValue={site?.address ?? ""} className={inputClass} />
        </Field>
        <Field label="Latitude" htmlFor="latitude" error={state.fieldErrors?.latitude}>
          <input
            id="latitude"
            name="latitude"
            type="number"
            step="0.000001"
            defaultValue={site?.latitude ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Longitude" htmlFor="longitude" error={state.fieldErrors?.longitude}>
          <input
            id="longitude"
            name="longitude"
            type="number"
            step="0.000001"
            defaultValue={site?.longitude ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Date de mise en service" htmlFor="commissioningDate" error={state.fieldErrors?.commissioningDate}>
          <input
            id="commissioningDate"
            name="commissioningDate"
            type="date"
            defaultValue={toDateInputValue(site?.commissioningDate)}
            className={inputClass}
          />
        </Field>
        <Field label="Notes" htmlFor="notes" full error={state.fieldErrors?.notes}>
          <textarea id="notes" name="notes" rows={2} defaultValue={site?.notes ?? ""} className={inputClass} />
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
        <LinkButton href={site ? `/sites/${site.id}` : "/sites"} variant="ghost">
          Annuler
        </LinkButton>
      </div>
    </form>
  );
}
