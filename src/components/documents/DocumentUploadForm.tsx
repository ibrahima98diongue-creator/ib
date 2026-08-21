"use client";

import { useActionState, useRef } from "react";
import { uploadDocument } from "@/lib/actions/documents";
import { inputClass } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";

export function DocumentUploadForm({
  linkType,
  linkId,
}: {
  linkType: "client" | "site" | "installation" | "equipement" | "chantier" | "maintenance";
  linkId: string;
}) {
  const [state, formAction, pending] = useActionState(uploadDocument, {});
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-end gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-3"
    >
      <input type="hidden" name="linkType" value={linkType} />
      <input type="hidden" name="linkId" value={linkId} />
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="file" className="block text-xs font-medium text-[var(--color-text-secondary)]">
          Ajouter un document
        </label>
        <input id="file" name="file" type="file" required className={`mt-1 ${inputClass}`} />
      </div>
      <Button type="submit" variant="primary" size="sm" disabled={pending}>
        {pending ? "Envoi..." : "+ Ajouter"}
      </Button>
      {state.error && <p className="w-full text-sm text-[var(--color-critical)]">{state.error}</p>}
    </form>
  );
}
