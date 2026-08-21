"use client";

import { useActionState } from "react";
import { FormSection, Field, inputClass } from "@/components/ui/Form";
import { Button, LinkButton } from "@/components/ui/Button";
import type { EquipementFormState } from "@/lib/actions/equipements";
import type { EquipementModel as Equipement, InstallationModel as Installation } from "@/generated/prisma/models";
import { EquipementStatus } from "@/generated/prisma/enums";
import { equipementStatusLabels } from "@/lib/labels";

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function EquipementForm({
  action,
  equipement,
  installations,
  defaultInstallationId,
}: {
  action: (prevState: EquipementFormState, formData: FormData) => Promise<EquipementFormState>;
  equipement?: Equipement;
  installations: Pick<Installation, "id" | "name">[];
  defaultInstallationId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="max-w-2xl">
      <FormSection title="Informations principales">
        <Field label="Nom de l'équipement" htmlFor="name" required error={state.fieldErrors?.name}>
          <input id="name" name="name" defaultValue={equipement?.name} required className={inputClass} />
        </Field>
        <Field label="Installation" htmlFor="installationId" required error={state.fieldErrors?.installationId}>
          <select
            id="installationId"
            name="installationId"
            defaultValue={equipement?.installationId ?? defaultInstallationId ?? ""}
            required
            className={inputClass}
          >
            <option value="" disabled>
              Sélectionner une installation
            </option>
            {installations.map((installation) => (
              <option key={installation.id} value={installation.id}>
                {installation.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type" htmlFor="type" error={state.fieldErrors?.type}>
          <input
            id="type"
            name="type"
            placeholder="Onduleur, panneau, transformateur..."
            defaultValue={equipement?.type ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Statut" htmlFor="status" required error={state.fieldErrors?.status}>
          <select
            id="status"
            name="status"
            defaultValue={equipement?.status ?? EquipementStatus.EN_SERVICE}
            className={inputClass}
          >
            {Object.values(EquipementStatus).map((value) => (
              <option key={value} value={value}>
                {equipementStatusLabels[value].label}
              </option>
            ))}
          </select>
        </Field>
      </FormSection>

      <FormSection title="Informations avancées" description="Facultatif">
        <Field label="Marque" htmlFor="brand" error={state.fieldErrors?.brand}>
          <input id="brand" name="brand" defaultValue={equipement?.brand ?? ""} className={inputClass} />
        </Field>
        <Field label="Modèle" htmlFor="model" error={state.fieldErrors?.model}>
          <input id="model" name="model" defaultValue={equipement?.model ?? ""} className={inputClass} />
        </Field>
        <Field label="N° de série" htmlFor="serialNumber" error={state.fieldErrors?.serialNumber}>
          <input
            id="serialNumber"
            name="serialNumber"
            defaultValue={equipement?.serialNumber ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Date d'installation" htmlFor="installDate" error={state.fieldErrors?.installDate}>
          <input
            id="installDate"
            name="installDate"
            type="date"
            defaultValue={toDateInputValue(equipement?.installDate)}
            className={inputClass}
          />
        </Field>
        <Field label="Notes" htmlFor="notes" full error={state.fieldErrors?.notes}>
          <textarea id="notes" name="notes" rows={2} defaultValue={equipement?.notes ?? ""} className={inputClass} />
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
        <LinkButton href={equipement ? `/equipements/${equipement.id}` : "/equipements"} variant="ghost">
          Annuler
        </LinkButton>
      </div>
    </form>
  );
}
