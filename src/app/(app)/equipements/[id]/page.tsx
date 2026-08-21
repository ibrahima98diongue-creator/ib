import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LinkButton } from "@/components/ui/Button";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { DocumentsPanel } from "@/components/documents/DocumentsPanel";
import { equipementStatusLabels } from "@/lib/labels";
import { deleteEquipement } from "@/lib/actions/equipements";
import Link from "next/link";
import { formatDate } from "@/lib/format";

export default async function EquipementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const equipement = await prisma.equipement.findFirst({
    where: { id, installation: { site: { companyId: session!.user.companyId } } },
    include: {
      installation: { include: { site: true } },
      documents: { include: { uploadedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!equipement) notFound();

  const general = (
    <dl className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Type</dt>
        <dd className="text-sm text-[var(--color-text)]">{equipement.type || "—"}</dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Marque</dt>
        <dd className="text-sm text-[var(--color-text)]">{equipement.brand || "—"}</dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Modèle</dt>
        <dd className="text-sm text-[var(--color-text)]">{equipement.model || "—"}</dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">N° de série</dt>
        <dd className="text-sm text-[var(--color-text)]">{equipement.serialNumber || "—"}</dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Date d&apos;installation</dt>
        <dd className="text-sm text-[var(--color-text)]">{formatDate(equipement.installDate)}</dd>
      </div>
      {equipement.notes && (
        <div className="sm:col-span-2">
          <dt className="text-xs text-[var(--color-text-secondary)]">Notes</dt>
          <dd className="text-sm text-[var(--color-text)]">{equipement.notes}</dd>
        </div>
      )}
    </dl>
  );

  const documents = (
    <DocumentsPanel
      linkType="equipement"
      linkId={equipement.id}
      documents={equipement.documents}
      returnTo={`/equipements/${equipement.id}`}
    />
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Équipement
          </p>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">{equipement.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Link
              href={`/installations/${equipement.installation.id}`}
              className="hover:text-[var(--color-primary)]"
            >
              {equipement.installation.name}
            </Link>
            <span>·</span>
            <Link href={`/sites/${equipement.installation.site.id}`} className="hover:text-[var(--color-primary)]">
              {equipement.installation.site.name}
            </Link>
            <Badge tone={equipementStatusLabels[equipement.status].tone}>
              {equipementStatusLabels[equipement.status].label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href={`/equipements/${equipement.id}/modifier`}>Modifier</LinkButton>
          <DeleteButton
            action={deleteEquipement}
            id={equipement.id}
            confirmMessage={`Supprimer l'équipement "${equipement.name}" ?`}
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
