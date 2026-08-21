import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteDocument } from "@/lib/actions/documents";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatFileSize } from "@/lib/format";

export type DocumentRow = {
  id: string;
  name: string;
  size: number | null;
  mimeType: string | null;
  createdAt: Date;
  uploadedBy: { name: string } | null;
};

export function DocumentsPanel({
  linkType,
  linkId,
  documents,
  returnTo,
}: {
  linkType: "client" | "site" | "installation" | "equipement" | "chantier" | "maintenance";
  linkId: string;
  documents: DocumentRow[];
  returnTo: string;
}) {
  return (
    <div>
      <div className="mb-4">
        <DocumentUploadForm linkType={linkType} linkId={linkId} />
      </div>

      {documents.length === 0 ? (
        <EmptyState title="Aucun document" description="Aucun document n'a encore été ajouté ici." />
      ) : (
        <Table>
          <Thead>
            <Th>Nom</Th>
            <Th>Taille</Th>
            <Th>Ajouté le</Th>
            <Th>Par</Th>
            <Th />
          </Thead>
          <Tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <Td className="font-medium text-[var(--color-text)]">{doc.name}</Td>
                <Td className="text-[var(--color-text-secondary)]">{formatFileSize(doc.size)}</Td>
                <Td className="text-[var(--color-text-secondary)]">{formatDate(doc.createdAt)}</Td>
                <Td className="text-[var(--color-text-secondary)]">{doc.uploadedBy?.name || "—"}</Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-3">
                    <a
                      href={`/api/documents/${doc.id}`}
                      className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                      Télécharger
                    </a>
                    <DeleteButton
                      action={async (formData) => {
                        "use server";
                        formData.set("returnTo", returnTo);
                        await deleteDocument(formData);
                      }}
                      id={doc.id}
                      confirmMessage={`Supprimer le document "${doc.name}" ?`}
                      label="Supprimer"
                    />
                  </div>
                </Td>
              </tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
