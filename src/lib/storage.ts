import { writeFile, unlink, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

// Stockage local des documents, hors de /public pour qu'aucun fichier ne
// soit jamais accessible sans passer par la vérification d'accès de
// /api/documents/[id] (isolation multi-entreprise). Le chemin reste
// statiquement analysable (sous-dossier fixe) pour que Next.js ne trace
// pas tout le projet au build.
function storageDir(companyId: string) {
  return path.join(process.cwd(), "storage", "documents", companyId);
}

export async function saveUploadedFile(companyId: string, file: File) {
  const dir = storageDir(companyId);
  await mkdir(dir, { recursive: true });

  const ext = path.extname(file.name);
  const storedName = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, storedName), buffer);

  return { storedName, size: buffer.length };
}

export function documentFilePath(companyId: string, storedName: string) {
  return path.join(storageDir(companyId), storedName);
}

export async function deleteStoredFile(companyId: string, storedName: string) {
  try {
    await unlink(documentFilePath(companyId, storedName));
  } catch {
    // Le fichier a peut-être déjà été supprimé — ce n'est pas bloquant.
  }
}
