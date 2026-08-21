import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Badge, type Tone } from "@/components/ui/Badge";
import Link from "next/link";

// Forme commune à Chantiers, Maintenance et Nettoyage : nom, statut,
// priorité, date, responsable — et, en liste globale, le site concerné.
// Réutilisé à la fois par les pages de liste et par les onglets de la
// fiche site, pour ne pas dupliquer ce tableau à six endroits.
export type InterventionItem = {
  id: string;
  href: string;
  name: string;
  status: { label: string; tone: Tone };
  priority: { label: string; tone: Tone };
  date: string | null;
  responsable: string | null;
  site?: { name: string; href: string };
  type?: string;
};

export function InterventionsTable({ items }: { items: InterventionItem[] }) {
  const showSite = items.some((item) => item.site);
  const showType = items.some((item) => item.type);

  return (
    <Table>
      <Thead>
        <Th>Nom</Th>
        {showSite && <Th>Site</Th>}
        {showType && <Th>Type</Th>}
        <Th>Statut</Th>
        <Th>Priorité</Th>
        <Th>Date</Th>
        <Th>Responsable</Th>
        <Th />
      </Thead>
      <Tbody>
        {items.map((item) => (
          <tr key={item.id} className="hover:bg-gray-50">
            <Td>
              <Link href={item.href} className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]">
                {item.name}
              </Link>
            </Td>
            {showSite && (
              <Td className="text-[var(--color-text-secondary)]">
                {item.site && (
                  <Link href={item.site.href} className="hover:text-[var(--color-primary)]">
                    {item.site.name}
                  </Link>
                )}
              </Td>
            )}
            {showType && <Td className="text-[var(--color-text-secondary)]">{item.type ?? "—"}</Td>}
            <Td>
              <Badge tone={item.status.tone}>{item.status.label}</Badge>
            </Td>
            <Td>
              <Badge tone={item.priority.tone}>{item.priority.label}</Badge>
            </Td>
            <Td className="text-[var(--color-text-secondary)]">{item.date ?? "—"}</Td>
            <Td className="text-[var(--color-text-secondary)]">{item.responsable || "—"}</Td>
            <Td className="text-right">
              <Link href={item.href} className="text-sm font-medium text-[var(--color-primary)] hover:underline">
                Consulter
              </Link>
            </Td>
          </tr>
        ))}
      </Tbody>
    </Table>
  );
}

// Version utilisée dans les onglets de la fiche site : ajoute son propre
// titre, compteur, bouton d'ajout et état vide (la page de liste globale
// utilise ListPageShell pour cette partie-là et InterventionsTable seule).
export function InterventionsSection({
  title,
  items,
  addHref,
  addLabel,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  items: InterventionItem[];
  addHref: string;
  addLabel: string;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">
          {title} ({items.length})
        </h2>
        <LinkButton href={addHref} variant="primary" size="sm">
          {addLabel}
        </LinkButton>
      </div>
      {items.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actions={
            <LinkButton href={addHref} variant="primary">
              {addLabel}
            </LinkButton>
          }
        />
      ) : (
        <InterventionsTable items={items} />
      )}
    </div>
  );
}
