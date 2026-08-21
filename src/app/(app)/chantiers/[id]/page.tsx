import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LinkButton } from "@/components/ui/Button";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { DocumentsPanel } from "@/components/documents/DocumentsPanel";
import { chantierStatusLabels, priorityLabels } from "@/lib/labels";
import { deleteChantier } from "@/lib/actions/chantiers";
import Link from "next/link";
import { formatDate } from "@/lib/format";

export default async function ChantierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const chantier = await prisma.chantier.findFirst({
    where: { id, site: { companyId: session!.user.companyId } },
    include: {
      site: { include: { client: true } },
      documents: { include: { uploadedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!chantier) notFound();

  const general = (
    <dl className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Client</dt>
        <dd className="text-sm text-[var(--color-text)]">{chantier.site.client.name}</dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Responsable</dt>
        <dd className="text-sm text-[var(--color-text)]">{chantier.responsable || "—"}</dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Date de début</dt>
        <dd className="text-sm text-[var(--color-text)]">{formatDate(chantier.startDate)}</dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Date de fin</dt>
        <dd className="text-sm text-[var(--color-text)]">{formatDate(chantier.endDate)}</dd>
      </div>
      {chantier.description && (
        <div className="sm:col-span-2">
          <dt className="text-xs text-[var(--color-text-secondary)]">Description</dt>
          <dd className="text-sm text-[var(--color-text)]">{chantier.description}</dd>
        </div>
      )}
      {chantier.notes && (
        <div className="sm:col-span-2">
          <dt className="text-xs text-[var(--color-text-secondary)]">Notes</dt>
          <dd className="text-sm text-[var(--color-text)]">{chantier.notes}</dd>
        </div>
      )}
    </dl>
  );

  const documents = (
    <DocumentsPanel
      linkType="chantier"
      linkId={chantier.id}
      documents={chantier.documents}
      returnTo={`/chantiers/${chantier.id}`}
    />
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Chantier
          </p>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">{chantier.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Link href={`/sites/${chantier.site.id}`} className="hover:text-[var(--color-primary)]">
              {chantier.site.name}
            </Link>
            <Badge tone={chantierStatusLabels[chantier.status].tone}>
              {chantierStatusLabels[chantier.status].label}
            </Badge>
            <Badge tone={priorityLabels[chantier.priority].tone}>
              {priorityLabels[chantier.priority].label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href={`/chantiers/${chantier.id}/modifier`}>Modifier</LinkButton>
          <DeleteButton
            action={deleteChantier}
            id={chantier.id}
            confirmMessage={`Supprimer le chantier "${chantier.name}" ?`}
          />
        </div>
      </div>

      <Tabs
        tabs={[
          { id: "general", label: "Général", content: general },
          { id: "documents", label: "Documents", content: documents },
        ]}
      />
    </div>
  );
}
