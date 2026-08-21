"use client";

import { useActionState } from "react";
import { FormSection, Field, inputClass } from "@/components/ui/Form";
import { Button, LinkButton } from "@/components/ui/Button";
import type { ClientFormState } from "@/lib/actions/clients";
import type { ClientModel as Client } from "@/generated/prisma/models";

export function ClientForm({
  action,
  client,
}: {
  action: (prevState: ClientFormState, formData: FormData) => Promise<ClientFormState>;
  client?: Client;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="max-w-2xl">
      <FormSection title="Informations principales">
        <Field label="Nom du client" htmlFor="name" required error={state.fieldErrors?.name}>
          <input
            id="name"
            name="name"
            defaultValue={client?.name}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Contact" htmlFor="contact" error={state.fieldErrors?.contact}>
          <input
            id="contact"
            name="contact"
            defaultValue={client?.contact ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={client?.email ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Téléphone" htmlFor="phone" error={state.fieldErrors?.phone}>
          <input
            id="phone"
            name="phone"
            defaultValue={client?.phone ?? ""}
            className={inputClass}
          />
        </Field>
      </FormSection>

      <FormSection title="Informations avancées" description="Facultatif">
        <Field label="Adresse" htmlFor="address" full error={state.fieldErrors?.address}>
          <textarea
            id="address"
            name="address"
            rows={2}
            defaultValue={client?.address ?? ""}
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
        <LinkButton href={client ? `/clients/${client.id}` : "/clients"} variant="ghost">
          Annuler
        </LinkButton>
      </div>
    </form>
  );
}
