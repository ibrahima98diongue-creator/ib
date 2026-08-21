import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LinkButton } from "@/components/ui/Button";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { DocumentsPanel } from "@/components/documents/DocumentsPanel";
import { maintenanceStatusLabels, priorityLabels, maintenanceTypeLabels } from "@/lib/labels";
import { deleteMaintenance } from "@/lib/actions/maintenances";
import Link from "next/link";
import { formatDate } from "@/lib/format";

export default async function MaintenanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const maintenance = await prisma.maintenance.findFirst({
    where: { id, site: { companyId: session!.user.companyId } },
    include: {
      site: { include: { client: true } },
      equipement: true,
      documents: { include: { uploadedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!maintenance) notFound();

  const general = (
    <dl className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Client</dt>
        <dd className="text-sm text-[var(--color-text)]">{maintenance.site.client.name}</dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Équipement concerné</dt>
        <dd className="text-sm text-[var(--color-text)]">
          {maintenance.equipement ? (
            <Link href={`/equipements/${maintenance.equipement.id}`} className="hover:text-[var(--color-primary)]">
              {maintenance.equipement.name}
            </Link>
          ) : (
            "—"
          )}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Date prévue</dt>
        <dd className="text-sm text-[var(--color-text)]">{formatDate(maintenance.scheduledDate)}</dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Responsable</dt>
        <dd className="text-sm text-[var(--color-text)]">{maintenance.responsable || "—"}</dd>
      </div>
      {maintenance.description && (
        <div className="sm:col-span-2">
          <dt className="text-xs text-[var(--color-text-secondary)]">Description</dt>
          <dd className="text-sm text-[var(--color-text)]">{maintenance.description}</dd>
        </div>
      )}
      {maintenance.notes && (
        <div className="sm:col-span-2">
          <dt className="text-xs text-[var(--color-text-secondary)]">Notes</dt>
          <dd className="text-sm text-[var(--color-text)]">{maintenance.notes}</dd>
        </div>
      )}
    </dl>
  );

  const documents = (
    <DocumentsPanel
      linkType="maintenance"
      linkId={maintenance.id}
      documents={maintenance.documents}
      returnTo={`/maintenance/${maintenance.id}`}
    />
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Maintenance {maintenanceTypeLabels[maintenance.type]}
          </p>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">{maintenance.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Link href={`/sites/${maintenance.site.id}`} className="hover:text-[var(--color-primary)]">
              {maintenance.site.name}
            </Link>
            <Badge tone={maintenanceStatusLabels[maintenance.status].tone}>
              {maintenanceStatusLabels[maintenance.status].label}
            </Badge>
            <Badge tone={priorityLabels[maintenance.priority].tone}>
              {priorityLabels[maintenance.priority].label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href={`/maintenance/${maintenance.id}/modifier`}>Modifier</LinkButton>
          <DeleteButton
            action={deleteMaintenance}
            id={maintenance.id}
            confirmMessage={`Supprimer la maintenance "${maintenance.title}" ?`}
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
