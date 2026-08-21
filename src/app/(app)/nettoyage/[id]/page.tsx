import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LinkButton } from "@/components/ui/Button";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { Badge } from "@/components/ui/Badge";
import { chantierStatusLabels, priorityLabels } from "@/lib/labels";
import { deleteNettoyage } from "@/lib/actions/nettoyages";
import Link from "next/link";
import { formatDate } from "@/lib/format";

export default async function NettoyageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const nettoyage = await prisma.nettoyage.findFirst({
    where: { id, site: { companyId: session!.user.companyId } },
    include: { site: { include: { client: true } } },
  });

  if (!nettoyage) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Nettoyage
          </p>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">{nettoyage.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Link href={`/sites/${nettoyage.site.id}`} className="hover:text-[var(--color-primary)]">
              {nettoyage.site.name}
            </Link>
            <Badge tone={chantierStatusLabels[nettoyage.status].tone}>
              {chantierStatusLabels[nettoyage.status].label}
            </Badge>
            <Badge tone={priorityLabels[nettoyage.priority].tone}>
              {priorityLabels[nettoyage.priority].label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href={`/nettoyage/${nettoyage.id}/modifier`}>Modifier</LinkButton>
          <DeleteButton
            action={deleteNettoyage}
            id={nettoyage.id}
            confirmMessage={`Supprimer le nettoyage "${nettoyage.title}" ?`}
          />
        </div>
      </div>

      <dl className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-[var(--color-text-secondary)]">Client</dt>
          <dd className="text-sm text-[var(--color-text)]">{nettoyage.site.client.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--color-text-secondary)]">Responsable</dt>
          <dd className="text-sm text-[var(--color-text)]">{nettoyage.responsable || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--color-text-secondary)]">Date prévue</dt>
          <dd className="text-sm text-[var(--color-text)]">{formatDate(nettoyage.scheduledDate)}</dd>
        </div>
        {nettoyage.description && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-[var(--color-text-secondary)]">Description</dt>
            <dd className="text-sm text-[var(--color-text)]">{nettoyage.description}</dd>
          </div>
        )}
        {nettoyage.notes && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-[var(--color-text-secondary)]">Notes</dt>
            <dd className="text-sm text-[var(--color-text)]">{nettoyage.notes}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
