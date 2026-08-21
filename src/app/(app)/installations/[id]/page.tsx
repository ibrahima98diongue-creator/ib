import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LinkButton } from "@/components/ui/Button";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { DocumentsPanel } from "@/components/documents/DocumentsPanel";
import { siteStatusLabels, equipementStatusLabels } from "@/lib/labels";
import { deleteInstallation } from "@/lib/actions/installations";
import Link from "next/link";
import { formatDate } from "@/lib/format";

const deleteErrors: Record<string, string> = {
  "a-des-equipements": "Cette installation a des équipements rattachés. Supprimez d'abord ses équipements.",
};

export default async function InstallationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { id } = await params;
  const { erreur } = await searchParams;
  const session = await auth();

  const installation = await prisma.installation.findFirst({
    where: { id, site: { companyId: session!.user.companyId } },
    include: {
      site: { include: { client: true } },
      equipements: { orderBy: { name: "asc" } },
      documents: { include: { uploadedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!installation) notFound();

  const general = (
    <dl className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Site</dt>
        <dd className="text-sm text-[var(--color-text)]">
          <Link href={`/sites/${installation.site.id}`} className="hover:text-[var(--color-primary)]">
            {installation.site.name}
          </Link>
        </dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Client</dt>
        <dd className="text-sm text-[var(--color-text)]">{installation.site.client.name}</dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Type</dt>
        <dd className="text-sm text-[var(--color-text)]">{installation.type || "—"}</dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Capacité</dt>
        <dd className="text-sm text-[var(--color-text)]">
          {installation.capacityKwc ? `${installation.capacityKwc} kWc` : "—"}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Date de mise en service</dt>
        <dd className="text-sm text-[var(--color-text)]">{formatDate(installation.commissioningDate)}</dd>
      </div>
      {installation.notes && (
        <div className="sm:col-span-2">
          <dt className="text-xs text-[var(--color-text-secondary)]">Notes</dt>
          <dd className="text-sm text-[var(--color-text)]">{installation.notes}</dd>
        </div>
      )}
    </dl>
  );

  const equipements = (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">
          Équipements ({installation.equipements.length})
        </h2>
        <LinkButton href={`/equipements/nouveau?installationId=${installation.id}`} variant="primary" size="sm">
          + Ajouter un équipement
        </LinkButton>
      </div>
      {installation.equipements.length === 0 ? (
        <EmptyState
          title="Aucun équipement"
          description="Cette installation n'a encore aucun équipement."
          actions={
            <LinkButton href={`/equipements/nouveau?installationId=${installation.id}`} variant="primary">
              + Ajouter un équipement
            </LinkButton>
          }
        />
      ) : (
        <Table>
          <Thead>
            <Th>Nom</Th>
            <Th>Type</Th>
            <Th>N° de série</Th>
            <Th>Statut</Th>
            <Th />
          </Thead>
          <Tbody>
            {installation.equipements.map((equipement) => (
              <tr key={equipement.id} className="hover:bg-gray-50">
                <Td>
                  <Link
                    href={`/equipements/${equipement.id}`}
                    className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                  >
                    {equipement.name}
                  </Link>
                </Td>
                <Td className="text-[var(--color-text-secondary)]">{equipement.type || "—"}</Td>
                <Td className="text-[var(--color-text-secondary)]">{equipement.serialNumber || "—"}</Td>
                <Td>
                  <Badge tone={equipementStatusLabels[equipement.status].tone}>
                    {equipementStatusLabels[equipement.status].label}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <Link
                    href={`/equipements/${equipement.id}`}
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                  >
                    Consulter
                  </Link>
                </Td>
              </tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );

  const documents = (
    <DocumentsPanel
      linkType="installation"
      linkId={installation.id}
      documents={installation.documents}
      returnTo={`/installations/${installation.id}`}
    />
  );

  return (
    <div>
      <ErrorBanner message={erreur ? deleteErrors[erreur] : undefined} />
      <div className="flex flex-wrap items-start justify-between gap-4 pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Installation
          </p>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">{installation.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Link href={`/sites/${installation.site.id}`} className="hover:text-[var(--color-primary)]">
              {installation.site.name}
            </Link>
            {installation.type && <span>· {installation.type}</span>}
            <Badge tone={siteStatusLabels[installation.status].tone}>
              {siteStatusLabels[installation.status].label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href={`/installations/${installation.id}/modifier`}>Modifier</LinkButton>
          <DeleteButton
            action={deleteInstallation}
            id={installation.id}
            confirmMessage={`Supprimer l'installation "${installation.name}" ?`}
          />
        </div>
      </div>

      <Tabs
        tabs={[
          { id: "general", label: "Général", content: general },
          { id: "equipements", label: "Équipements", content: equipements },
          { id: "documents", label: "Documents", content: documents },
        ]}
      />
    </div>
  );
}
