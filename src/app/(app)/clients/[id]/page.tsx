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
import { siteStatusLabels } from "@/lib/labels";
import { deleteClient } from "@/lib/actions/clients";
import Link from "next/link";

const deleteErrors: Record<string, string> = {
  "a-des-sites": "Ce client a des sites rattachés. Supprimez d'abord ses sites.",
};

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { id } = await params;
  const { erreur } = await searchParams;
  const session = await auth();

  const client = await prisma.client.findFirst({
    where: { id, companyId: session!.user.companyId },
    include: {
      sites: { orderBy: { name: "asc" } },
      documents: { include: { uploadedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!client) notFound();

  const sites = (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">
          Sites ({client.sites.length})
        </h2>
        <LinkButton href={`/sites/nouveau?clientId=${client.id}`} variant="primary" size="sm">
          + Ajouter un site
        </LinkButton>
      </div>

      {client.sites.length === 0 ? (
        <EmptyState
          title="Aucun site"
          description="Ce client n'a encore aucun site."
          actions={
            <LinkButton href={`/sites/nouveau?clientId=${client.id}`} variant="primary">
              + Ajouter un site
            </LinkButton>
          }
        />
      ) : (
        <Table>
          <Thead>
            <Th>Nom</Th>
            <Th>Pays</Th>
            <Th>Puissance</Th>
            <Th>Statut</Th>
            <Th />
          </Thead>
          <Tbody>
            {client.sites.map((site) => (
              <tr key={site.id} className="hover:bg-gray-50">
                <Td>
                  <Link
                    href={`/sites/${site.id}`}
                    className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                  >
                    {site.name}
                  </Link>
                </Td>
                <Td className="text-[var(--color-text-secondary)]">{site.country || "—"}</Td>
                <Td className="text-[var(--color-text-secondary)]">
                  {site.powerKwc ? `${site.powerKwc} kWc` : "—"}
                </Td>
                <Td>
                  <Badge tone={siteStatusLabels[site.status].tone}>
                    {siteStatusLabels[site.status].label}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <Link
                    href={`/sites/${site.id}`}
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
      linkType="client"
      linkId={client.id}
      documents={client.documents}
      returnTo={`/clients/${client.id}`}
    />
  );

  return (
    <div>
      <ErrorBanner message={erreur ? deleteErrors[erreur] : undefined} />
      <div className="flex flex-wrap items-start justify-between gap-4 pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Client
          </p>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">{client.name}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {[client.contact, client.email, client.phone].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href={`/clients/${client.id}/modifier`}>Modifier</LinkButton>
          <DeleteButton
            action={deleteClient}
            id={client.id}
            confirmMessage={`Supprimer le client "${client.name}" ?`}
          />
        </div>
      </div>

      <Tabs
        tabs={[
          { id: "sites", label: "Sites", content: sites },
          { id: "documents", label: "Documents", content: documents },
        ]}
      />
    </div>
  );
}
