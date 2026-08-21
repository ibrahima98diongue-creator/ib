"use client";

import { useActionState } from "react";
import { Field, inputClass } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { updateCompanyName, type SettingsFormState } from "@/lib/actions/settings";

export function CompanyForm({ name }: { name: string }) {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(updateCompanyName, {});

  return (
    <form action={formAction} className="max-w-sm">
      <Field label="Nom de l'entreprise" htmlFor="name" required error={state.fieldErrors?.name}>
        <input id="name" name="name" defaultValue={name} required className={inputClass} />
      </Field>
      {state.error && <p className="mt-2 text-sm text-[var(--color-critical)]">{state.error}</p>}
      {state.success && <p className="mt-2 text-sm text-[var(--color-low)]">{state.success}</p>}
      <Button type="submit" variant="primary" className="mt-3" disabled={pending}>
        {pending ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
