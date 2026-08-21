import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRapportStats } from "@/lib/rapport";
import { formatKwh } from "@/lib/format";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>
    </div>
  );
}

export default async function RapportsPage() {
  const session = await auth();
  const stats = await getRapportStats(session!.user.companyId);
  const isEmpty = stats.clientsCount === 0 && stats.sitesCount === 0;

  return (
    <div>
      <PageHeader
        title="Rapports"
        description="Vue d'ensemble de votre activité."
        action={
          !isEmpty && (
            <a
              href={`/api/export/rapport`}
              className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--color-primary)] px-4 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
            >
              Exporter le rapport
            </a>
          )
        }
      />

      {isEmpty ? (
        <EmptyState
          title="Aucune donnée disponible"
          description="Le rapport sera disponible dès que vous aurez ajouté des clients et des sites."
          actions={
            <LinkButton href="/clients/nouveau" variant="primary">
              + Ajouter un client
            </LinkButton>
          }
        />
      ) : (
        <>
          <Section title="Gestion">
            <StatTile label="Clients" value={stats.clientsCount} />
            <StatTile label="Sites" value={`${stats.activeSitesCount} / ${stats.sitesCount} actifs`} />
            <StatTile label="Installations" value={stats.installationsCount} />
            <StatTile label="Équipements" value={stats.equipementsCount} />
          </Section>

          <Section title="Opérations">
            <StatTile label="Chantiers en cours" value={stats.chantiersEnCours} />
            <StatTile label="Chantiers terminés" value={stats.chantiersTermines} />
            <StatTile label="Maintenances à venir" value={stats.maintenancesAVenir} />
            <StatTile label="Maintenances terminées" value={stats.maintenancesTerminees} />
          </Section>

          <Section title="Nettoyage et tâches">
            <StatTile label="Nettoyages en cours" value={stats.nettoyagesEnCours} />
            <StatTile label="Tâches à faire" value={stats.tachesAFaire} />
            <StatTile label="Tâches terminées" value={stats.tachesTerminees} />
          </Section>

          <Section title="Production">
            <StatTile label="Ce mois-ci" value={formatKwh(stats.productionMonthKwh)} />
            <StatTile label="Cette année" value={formatKwh(stats.productionYearKwh)} />
          </Section>
        </>
      )}
    </div>
  );
}
