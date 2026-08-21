"use client";

import { useActionState, useState } from "react";
import { FormSection, Field, inputClass } from "@/components/ui/Form";
import { Button, LinkButton } from "@/components/ui/Button";
import type { MaintenanceFormState } from "@/lib/actions/maintenances";
import type { MaintenanceModel as Maintenance, SiteModel as Site } from "@/generated/prisma/models";
import { MaintenanceStatus, MaintenanceType, Priority } from "@/generated/prisma/enums";
import { maintenanceStatusLabels, maintenanceTypeLabels, priorityLabels } from "@/lib/labels";

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

type EquipementOption = { id: string; name: string; siteId: string };

export function MaintenanceForm({
  action,
  maintenance,
  sites,
  equipements,
  defaultSiteId,
}: {
  action: (prevState: MaintenanceFormState, formData: FormData) => Promise<MaintenanceFormState>;
  maintenance?: Maintenance;
  sites: Pick<Site, "id" | "name">[];
  equipements: EquipementOption[];
  defaultSiteId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [siteId, setSiteId] = useState(maintenance?.siteId ?? defaultSiteId ?? "");
  const availableEquipements = equipements.filter((e) => e.siteId === siteId);

  return (
    <form action={formAction} className="max-w-2xl">
      <FormSection title="Informations principales">
        <Field label="Titre" htmlFor="title" required full error={state.fieldErrors?.title}>
          <input id="title" name="title" defaultValue={maintenance?.title} required className={inputClass} />
        </Field>
        <Field label="Site" htmlFor="siteId" required error={state.fieldErrors?.siteId}>
          <select
            id="siteId"
            name="siteId"
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
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
        <Field label="Type" htmlFor="type" required error={state.fieldErrors?.type}>
          <select
            id="type"
            name="type"
            defaultValue={maintenance?.type ?? MaintenanceType.PREVENTIVE}
            className={inputClass}
          >
            {Object.values(MaintenanceType).map((value) => (
              <option key={value} value={value}>
                {maintenanceTypeLabels[value]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Statut" htmlFor="status" required error={state.fieldErrors?.status}>
          <select
            id="status"
            name="status"
            defaultValue={maintenance?.status ?? MaintenanceStatus.A_PLANIFIER}
            className={inputClass}
          >
            {Object.values(MaintenanceStatus).map((value) => (
              <option key={value} value={value}>
                {maintenanceStatusLabels[value].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Priorité" htmlFor="priority" required error={state.fieldErrors?.priority}>
          <select
            id="priority"
            name="priority"
            defaultValue={maintenance?.priority ?? Priority.MOYENNE}
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
            defaultValue={toDateInputValue(maintenance?.scheduledDate)}
            className={inputClass}
          />
        </Field>
        <Field label="Responsable" htmlFor="responsable" error={state.fieldErrors?.responsable}>
          <input
            id="responsable"
            name="responsable"
            defaultValue={maintenance?.responsable ?? ""}
            className={inputClass}
          />
        </Field>
      </FormSection>

      <FormSection title="Informations avancées" description="Facultatif">
        <Field label="Équipement concerné" htmlFor="equipementId" error={state.fieldErrors?.equipementId}>
          <select
            id="equipementId"
            name="equipementId"
            defaultValue={maintenance?.equipementId ?? ""}
            disabled={!siteId}
            className={inputClass}
          >
            <option value="">Aucun équipement précis</option>
            {availableEquipements.map((equipement) => (
              <option key={equipement.id} value={equipement.id}>
                {equipement.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Description" htmlFor="description" full error={state.fieldErrors?.description}>
          <textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={maintenance?.description ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Notes" htmlFor="notes" full error={state.fieldErrors?.notes}>
          <textarea id="notes" name="notes" rows={2} defaultValue={maintenance?.notes ?? ""} className={inputClass} />
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
        <LinkButton href={maintenance ? `/maintenance/${maintenance.id}` : "/maintenance"} variant="ghost">
          Annuler
        </LinkButton>
      </div>
    </form>
  );
}
