import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteDocument } from "@/lib/actions/documents";
import { inputClass } from "@/components/ui/Form";
import { formatDate, formatFileSize } from "@/lib/format";
import Link from "next/link";

const typeLabels: Record<string, string> = {
  client: "Client",
  site: "Site",
  installation: "Installation",
  equipement: "Équipement",
  chantier: "Chantier",
  maintenance: "Maintenance",
};

function resolveLink(doc: {
  client: { id: string; name: string } | null;
  site: { id: string; name: string } | null;
  installation: { id: string; name: string } | null;
  equipement: { id: string; name: string } | null;
  chantier: { id: string; name: string } | null;
  maintenance: { id: string; title: string } | null;
}) {
  if (doc.client) return { type: "client", href: `/clients/${doc.client.id}`, label: doc.client.name };
  if (doc.site) return { type: "site", href: `/sites/${doc.site.id}`, label: doc.site.name };
  if (doc.installation)
    return { type: "installation", href: `/installations/${doc.installation.id}`, label: doc.installation.name };
  if (doc.equipement)
    return { type: "equipement", href: `/equipements/${doc.equipement.id}`, label: doc.equipement.name };
  if (doc.chantier) return { type: "chantier", href: `/chantiers/${doc.chantier.id}`, label: doc.chantier.name };
  if (doc.maintenance)
    return { type: "maintenance", href: `/maintenance/${doc.maintenance.id}`, label: doc.maintenance.title };
  return null;
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;
  const session = await auth();

  const allDocuments = await prisma.document.findMany({
    where: {
      companyId: session!.user.companyId,
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    include: {
      client: { select: { id: true, name: true } },
      site: { select: { id: true, name: true } },
      installation: { select: { id: true, name: true } },
      equipement: { select: { id: true, name: true } },
      chantier: { select: { id: true, name: true } },
      maintenance: { select: { id: true, title: true } },
      uploadedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalCount = allDocuments.length;
  const documents = type
    ? allDocuments.filter((doc) => resolveLink(doc)?.type === type)
    : allDocuments;

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Recherchez, filtrez et consultez tous les documents de vos clients, sites, installations, équipements, chantiers et maintenances."
      />

      <form className="mb-4 flex flex-wrap items-center gap-3" method="get">
        <input
          type="search"
          name="q"
          placeholder="Rechercher un document…"
          defaultValue={q}
          className={`max-w-xs ${inputClass}`}
        />
        <select name="type" defaultValue={type ?? ""} className={`max-w-[200px] ${inputClass}`}>
          <option value="">Tous les types</option>
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-gray-50"
        >
          Filtrer
        </button>
      </form>

      {totalCount === 0 ? (
        <EmptyState
          title="Aucun document"
          description="Vous n'avez encore ajouté aucun document. Les documents s'ajoutent directement depuis la fiche d'un client, site, installation, équipement, chantier ou maintenance."
        />
      ) : documents.length === 0 ? (
        <EmptyState
          title="Aucun résultat"
          description="Aucun document ne correspond à votre recherche."
        />
      ) : (
        <Table>
          <Thead>
            <Th>Nom</Th>
            <Th>Rattaché à</Th>
            <Th>Taille</Th>
            <Th>Ajouté le</Th>
            <Th>Par</Th>
            <Th />
          </Thead>
          <Tbody>
            {documents.map((doc) => {
              const link = resolveLink(doc);
              return (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <Td className="font-medium text-[var(--color-text)]">{doc.name}</Td>
                  <Td className="text-[var(--color-text-secondary)]">
                    {link ? (
                      <Link href={link.href} className="hover:text-[var(--color-primary)]">
                        {typeLabels[link.type]} · {link.label}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </Td>
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
                        action={deleteDocument}
                        id={doc.id}
                        confirmMessage={`Supprimer le document "${doc.name}" ?`}
                      />
                    </div>
                  </Td>
                </tr>
              );
            })}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
