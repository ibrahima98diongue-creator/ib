import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListPageShell } from "@/components/ListPageShell";
import { LinkButton } from "@/components/ui/Button";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteMeteo } from "@/lib/actions/meteo";
import { formatDate } from "@/lib/format";
import Link from "next/link";

function formatValue(value: number | null, unit: string) {
  if (value === null) return "—";
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ${unit}`;
}

export default async function MeteoPage() {
  const session = await auth();
  const [entries, hasSites] = await Promise.all([
    prisma.meteo.findMany({
      where: { site: { companyId: session!.user.companyId } },
      include: { site: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.site.count({ where: { companyId: session!.user.companyId } }),
  ]);

  return (
    <ListPageShell
      title="Météo / Irradiation"
      description="Les relevés météo et d'irradiation de vos sites."
      count={entries.length}
      addHref="/meteo/nouveau"
      addLabel="+ Ajouter une donnée météo"
      headerExtra={<LinkButton href="/import-export">Importer</LinkButton>}
      emptyTitle="Aucune donnée météo"
      emptyDescription={
        hasSites > 0
          ? "Vous n'avez encore aucune donnée météo."
          : "Créez d'abord un site avant d'ajouter une donnée météo."
      }
      emptyActions={
        hasSites > 0 ? (
          <>
            <LinkButton href="/meteo/nouveau" variant="primary">
              + Ajouter une donnée météo
            </LinkButton>
            <LinkButton href="/import-export">Importer un fichier</LinkButton>
          </>
        ) : (
          <LinkButton href="/sites/nouveau" variant="primary">
            + Ajouter un site
          </LinkButton>
        )
      }
    >
      <Table>
        <Thead>
          <Th>Date</Th>
          <Th>Site</Th>
          <Th>Irradiation</Th>
          <Th>Température</Th>
          <Th>Vent</Th>
          <Th />
        </Thead>
        <Tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50">
              <Td className="text-[var(--color-text-secondary)]">{formatDate(entry.date)}</Td>
              <Td>
                <Link
                  href={`/sites/${entry.site.id}`}
                  className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                >
                  {entry.site.name}
                </Link>
              </Td>
              <Td className="text-[var(--color-text-secondary)]">{formatValue(entry.irradiation, "kWh/m²")}</Td>
              <Td className="text-[var(--color-text-secondary)]">{formatValue(entry.temperature, "°C")}</Td>
              <Td className="text-[var(--color-text-secondary)]">{formatValue(entry.windSpeed, "km/h")}</Td>
              <Td className="text-right">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/meteo/${entry.id}/modifier`}
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                  >
                    Modifier
                  </Link>
                  <DeleteButton
                    action={deleteMeteo}
                    id={entry.id}
                    confirmMessage={`Supprimer la donnée météo du ${formatDate(entry.date)} pour "${entry.site.name}" ?`}
                  />
                </div>
              </Td>
            </tr>
          ))}
        </Tbody>
      </Table>
    </ListPageShell>
  );
}
