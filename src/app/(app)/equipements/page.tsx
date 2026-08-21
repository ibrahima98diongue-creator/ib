import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListPageShell } from "@/components/ListPageShell";
import { LinkButton } from "@/components/ui/Button";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { equipementStatusLabels } from "@/lib/labels";
import Link from "next/link";

export default async function EquipementsPage() {
  const session = await auth();
  const [equipements, hasInstallations] = await Promise.all([
    prisma.equipement.findMany({
      where: { installation: { site: { companyId: session!.user.companyId } } },
      include: { installation: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.installation.count({ where: { site: { companyId: session!.user.companyId } } }),
  ]);

  return (
    <ListPageShell
      title="Équipements"
      description="Les équipements rattachés à vos installations."
      count={equipements.length}
      addHref="/equipements/nouveau"
      addLabel="+ Ajouter un équipement"
      emptyTitle="Aucun équipement"
      emptyDescription={
        hasInstallations > 0
          ? "Vous n'avez encore aucun équipement."
          : "Créez d'abord une installation, puis ajoutez ses équipements."
      }
      emptyActions={
        hasInstallations > 0 ? (
          <LinkButton href="/equipements/nouveau" variant="primary">
            + Ajouter un équipement
          </LinkButton>
        ) : (
          <LinkButton href="/installations/nouveau" variant="primary">
            + Ajouter une installation
          </LinkButton>
        )
      }
    >
      <Table>
        <Thead>
          <Th>Nom</Th>
          <Th>Installation</Th>
          <Th>Type</Th>
          <Th>N° de série</Th>
          <Th>Statut</Th>
          <Th />
        </Thead>
        <Tbody>
          {equipements.map((equipement) => (
            <tr key={equipement.id} className="hover:bg-gray-50">
              <Td>
                <Link
                  href={`/equipements/${equipement.id}`}
                  className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                >
                  {equipement.name}
                </Link>
              </Td>
              <Td className="text-[var(--color-text-secondary)]">
                <Link href={`/installations/${equipement.installation.id}`} className="hover:text-[var(--color-primary)]">
                  {equipement.installation.name}
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
    </ListPageShell>
  );
}
