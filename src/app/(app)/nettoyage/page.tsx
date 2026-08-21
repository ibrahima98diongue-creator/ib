import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListPageShell } from "@/components/ListPageShell";
import { LinkButton } from "@/components/ui/Button";
import { InterventionsTable } from "@/components/InterventionsSection";
import { chantierStatusLabels, priorityLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";

export default async function NettoyagePage() {
  const session = await auth();
  const [nettoyages, hasSites] = await Promise.all([
    prisma.nettoyage.findMany({
      where: { site: { companyId: session!.user.companyId } },
      include: { site: { select: { id: true, name: true } } },
      orderBy: [{ scheduledDate: "asc" }, { title: "asc" }],
    }),
    prisma.site.count({ where: { companyId: session!.user.companyId } }),
  ]);

  return (
    <ListPageShell
      title="Nettoyage"
      description="Les interventions de nettoyage planifiées sur vos sites."
      count={nettoyages.length}
      addHref="/nettoyage/nouveau"
      addLabel="+ Ajouter un nettoyage"
      emptyTitle="Aucun nettoyage"
      emptyDescription={
        hasSites > 0 ? "Vous n'avez encore aucun nettoyage." : "Créez d'abord un site avant d'ajouter un nettoyage."
      }
      emptyActions={
        hasSites > 0 ? (
          <LinkButton href="/nettoyage/nouveau" variant="primary">
            + Ajouter un nettoyage
          </LinkButton>
        ) : (
          <LinkButton href="/sites/nouveau" variant="primary">
            + Ajouter un site
          </LinkButton>
        )
      }
    >
      <InterventionsTable
        items={nettoyages.map((n) => ({
          id: n.id,
          href: `/nettoyage/${n.id}`,
          name: n.title,
          status: chantierStatusLabels[n.status],
          priority: priorityLabels[n.priority],
          date: formatDate(n.scheduledDate),
          responsable: n.responsable,
          site: { name: n.site.name, href: `/sites/${n.site.id}` },
        }))}
      />
    </ListPageShell>
  );
}
