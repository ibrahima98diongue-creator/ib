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
import { InterventionsSection } from "@/components/InterventionsSection";
import { DocumentsPanel } from "@/components/documents/DocumentsPanel";
import { ProductionChart } from "@/components/ProductionChart";
import { Card } from "@/components/ui/Card";
import { siteStatusLabels, chantierStatusLabels, maintenanceStatusLabels, priorityLabels } from "@/lib/labels";
import { deleteSite } from "@/lib/actions/sites";
import { addDays, startOfDay, toDateParam } from "@/lib/dates";
import Link from "next/link";
import { formatDate, formatDateShort, formatKwh } from "@/lib/format";

const deleteErrors: Record<string, string> = {
  "a-des-installations": "Ce site a des installations rattachées. Supprimez d'abord ses installations.",
};

export default async function SiteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { id } = await params;
  const { erreur } = await searchParams;
  const session = await auth();

  const site = await prisma.site.findFirst({
    where: { id, companyId: session!.user.companyId },
    include: {
      client: true,
      installations: { orderBy: { name: "asc" } },
      chantiers: { orderBy: [{ startDate: "asc" }, { name: "asc" }] },
      maintenances: { orderBy: [{ scheduledDate: "asc" }, { title: "asc" }] },
      nettoyages: { orderBy: [{ scheduledDate: "asc" }, { title: "asc" }] },
      documents: { include: { uploadedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      productions: { orderBy: { date: "desc" }, take: 30 },
    },
  });

  if (!site) notFound();

  const general = (
    <dl className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Client</dt>
        <dd className="text-sm text-[var(--color-text)]">
          <Link href={`/clients/${site.client.id}`} className="hover:text-[var(--color-primary)]">
            {site.client.name}
          </Link>
        </dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Pays</dt>
        <dd className="text-sm text-[var(--color-text)]">{site.country || "—"}</dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Puissance</dt>
        <dd className="text-sm text-[var(--color-text)]">
          {site.powerKwc ? `${site.powerKwc} kWc` : "—"}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">Date de mise en service</dt>
        <dd className="text-sm text-[var(--color-text)]">{formatDate(site.commissioningDate)}</dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-xs text-[var(--color-text-secondary)]">Adresse</dt>
        <dd className="text-sm text-[var(--color-text)]">{site.address || "—"}</dd>
      </div>
      {(site.latitude || site.longitude) && (
        <div>
          <dt className="text-xs text-[var(--color-text-secondary)]">Coordonnées</dt>
          <dd className="text-sm text-[var(--color-text)]">
            {site.latitude ?? "—"}, {site.longitude ?? "—"}
          </dd>
        </div>
      )}
      {site.notes && (
        <div className="sm:col-span-2">
          <dt className="text-xs text-[var(--color-text-secondary)]">Notes</dt>
          <dd className="text-sm text-[var(--color-text)]">{site.notes}</dd>
        </div>
      )}
    </dl>
  );

  const installations = (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">
          Installations ({site.installations.length})
        </h2>
        <LinkButton href={`/installations/nouveau?siteId=${site.id}`} variant="primary" size="sm">
          + Ajouter une installation
        </LinkButton>
      </div>
      {site.installations.length === 0 ? (
        <EmptyState
          title="Aucune installation"
          description="Ce site n'a encore aucune installation."
          actions={
            <LinkButton href={`/installations/nouveau?siteId=${site.id}`} variant="primary">
              + Ajouter une installation
            </LinkButton>
          }
        />
      ) : (
        <Table>
          <Thead>
            <Th>Nom</Th>
            <Th>Type</Th>
            <Th>Capacité</Th>
            <Th>Statut</Th>
            <Th />
          </Thead>
          <Tbody>
            {site.installations.map((installation) => (
              <tr key={installation.id} className="hover:bg-gray-50">
                <Td>
                  <Link
                    href={`/installations/${installation.id}`}
                    className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                  >
                    {installation.name}
                  </Link>
                </Td>
                <Td className="text-[var(--color-text-secondary)]">{installation.type || "—"}</Td>
                <Td className="text-[var(--color-text-secondary)]">
                  {installation.capacityKwc ? `${installation.capacityKwc} kWc` : "—"}
                </Td>
                <Td>
                  <Badge tone={siteStatusLabels[installation.status].tone}>
                    {siteStatusLabels[installation.status].label}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <Link
                    href={`/installations/${installation.id}`}
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

  const last30Start = addDays(startOfDay(new Date()), -29);
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const day = addDays(last30Start, i);
    const total = site.productions
      .filter((p) => toDateParam(p.date) === toDateParam(day))
      .reduce((t, p) => t + p.energyKwh, 0);
    return {
      label: formatDateShort(day),
      value: total,
    };
  });
  const hasRecentProduction = chartData.some((d) => d.value > 0);

  const production = (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">
          Production ({site.productions.length})
        </h2>
        <LinkButton href={`/production/nouveau?siteId=${site.id}`} variant="primary" size="sm">
          + Ajouter une production
        </LinkButton>
      </div>
      {site.productions.length === 0 ? (
        <EmptyState
          title="Aucune donnée de production"
          description="Ce site n'a encore aucune donnée de production."
          actions={
            <LinkButton href={`/production/nouveau?siteId=${site.id}`} variant="primary">
              + Ajouter une production
            </LinkButton>
          }
        />
      ) : (
        <>
          {hasRecentProduction && (
            <Card className="mb-4">
              <ProductionChart data={chartData} />
            </Card>
          )}
          <Table>
            <Thead>
              <Th>Date</Th>
              <Th>Production</Th>
            </Thead>
            <Tbody>
              {site.productions.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <Td className="text-[var(--color-text-secondary)]">{formatDate(p.date)}</Td>
                  <Td className="font-medium text-[var(--color-text)]">{formatKwh(p.energyKwh)}</Td>
                </tr>
              ))}
            </Tbody>
          </Table>
          <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
            <Link href="/production" className="text-[var(--color-primary)] hover:underline">
              Voir tous les relevés de production
            </Link>
          </p>
        </>
      )}
    </div>
  );

  const chantiers = (
    <InterventionsSection
      title="Chantiers"
      addHref={`/chantiers/nouveau?siteId=${site.id}`}
      addLabel="+ Ajouter un chantier"
      emptyTitle="Aucun chantier"
      emptyDescription="Ce site n'a encore aucun chantier."
      items={site.chantiers.map((c) => ({
        id: c.id,
        href: `/chantiers/${c.id}`,
        name: c.name,
        status: chantierStatusLabels[c.status],
        priority: priorityLabels[c.priority],
        date: formatDate(c.startDate),
        responsable: c.responsable,
      }))}
    />
  );

  const maintenances = (
    <InterventionsSection
      title="Maintenance"
      addHref={`/maintenance/nouveau?siteId=${site.id}`}
      addLabel="+ Ajouter une maintenance"
      emptyTitle="Aucune maintenance"
      emptyDescription="Ce site n'a encore aucune maintenance."
      items={site.maintenances.map((m) => ({
        id: m.id,
        href: `/maintenance/${m.id}`,
        name: m.title,
        status: maintenanceStatusLabels[m.status],
        priority: priorityLabels[m.priority],
        date: formatDate(m.scheduledDate),
        responsable: m.responsable,
      }))}
    />
  );

  const nettoyages = (
    <InterventionsSection
      title="Nettoyage"
      addHref={`/nettoyage/nouveau?siteId=${site.id}`}
      addLabel="+ Ajouter un nettoyage"
      emptyTitle="Aucun nettoyage"
      emptyDescription="Ce site n'a encore aucun nettoyage."
      items={site.nettoyages.map((n) => ({
        id: n.id,
        href: `/nettoyage/${n.id}`,
        name: n.title,
        status: chantierStatusLabels[n.status],
        priority: priorityLabels[n.priority],
        date: formatDate(n.scheduledDate),
        responsable: n.responsable,
      }))}
    />
  );

  const documents = (
    <DocumentsPanel
      linkType="site"
      linkId={site.id}
      documents={site.documents}
      returnTo={`/sites/${site.id}`}
    />
  );

  return (
    <div>
      <ErrorBanner message={erreur ? deleteErrors[erreur] : undefined} />
      <div className="flex flex-wrap items-start justify-between gap-4 pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Site
          </p>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">{site.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Link href={`/clients/${site.client.id}`} className="hover:text-[var(--color-primary)]">
              {site.client.name}
            </Link>
            {site.country && <span>· {site.country}</span>}
            {site.powerKwc && <span>· {site.powerKwc} kWc</span>}
            <Badge tone={siteStatusLabels[site.status].tone}>
              {siteStatusLabels[site.status].label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href={`/sites/${site.id}/modifier`}>Modifier</LinkButton>
          <DeleteButton
            action={deleteSite}
            id={site.id}
            confirmMessage={`Supprimer le site "${site.name}" ?`}
          />
        </div>
      </div>

      <Tabs
        tabs={[
          { id: "general", label: "Général", content: general },
          { id: "installations", label: "Installations", content: installations },
          { id: "production", label: "Production", content: production },
          { id: "chantiers", label: "Chantiers", content: chantiers },
          { id: "maintenance", label: "Maintenance", content: maintenances },
          { id: "nettoyage", label: "Nettoyage", content: nettoyages },
          { id: "documents", label: "Documents", content: documents },
        ]}
      />
    </div>
  );
}
