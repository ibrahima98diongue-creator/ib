import { z } from "zod";

// Transforme les erreurs Zod en un dictionnaire { champ: message } exploitable
// directement par les formulaires (un message clair sous chaque champ).
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export const GENERIC_ERROR =
  "Impossible d'enregistrer les données. Vérifiez les champs obligatoires.";
