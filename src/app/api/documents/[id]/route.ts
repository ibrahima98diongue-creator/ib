import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { documentFilePath } from "@/lib/storage";

// Sert le fichier d'un document après vérification que l'utilisateur
// connecté appartient bien à l'entreprise propriétaire (isolation
// multi-entreprise — un document n'est jamais accessible en dehors de ce
// contrôle, contrairement à un fichier placé dans /public).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;
  const document = await prisma.document.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!document) {
    return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  }

  try {
    const file = await readFile(documentFilePath(session.user.companyId, document.storedName));
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": document.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(document.name)}"`,
        "Content-Length": String(file.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable sur le serveur." }, { status: 404 });
  }
}
