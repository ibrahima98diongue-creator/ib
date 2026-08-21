"use client";

import { useActionState } from "react";
import { Field, inputClass } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { changeMyPassword, type SettingsFormState } from "@/lib/actions/settings";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(changeMyPassword, {});

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      <Field label="Mot de passe actuel" htmlFor="currentPassword" required error={state.fieldErrors?.currentPassword}>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </Field>
      <Field label="Nouveau mot de passe" htmlFor="newPassword" required error={state.fieldErrors?.newPassword}>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </Field>
      {state.error && <p className="text-sm text-[var(--color-critical)]">{state.error}</p>}
      {state.success && <p className="text-sm text-[var(--color-low)]">{state.success}</p>}
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Enregistrement..." : "Changer le mot de passe"}
      </Button>
    </form>
  );
}
