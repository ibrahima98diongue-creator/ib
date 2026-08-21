import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { chantierStatusLabels, maintenanceStatusLabels, priorityLabels } from "@/lib/labels";
import type { Tone } from "@/components/ui/Badge";
import { startOfDay, startOfWeek, startOfMonth, addDays, addMonths, parseDateParam, toDateParam } from "@/lib/dates";
import { formatDateShort } from "@/lib/format";
import { clsx } from "clsx";
import Link from "next/link";

type Vue = "jour" | "semaine" | "mois";

function getRange(vue: Vue, date: Date) {
  if (vue === "jour") {
    const start = startOfDay(date);
    return { start, end: addDays(start, 1) };
  }
  if (vue === "mois") {
    const start = startOfMonth(date);
    return { start, end: startOfMonth(addMonths(start, 1)) };
  }
  const start = startOfWeek(date);
  return { start, end: addDays(start, 7) };
}

function shiftDate(vue: Vue, date: Date, direction: 1 | -1) {
  if (vue === "jour") return addDays(date, direction);
  if (vue === "mois") return addMonths(date, direction);
  return addDays(date, direction * 7);
}

function formatLabel(vue: Vue, date: Date) {
  if (vue === "jour") {
    return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
  }
  if (vue === "mois") {
    return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date);
  }
  const { start, end } = getRange(vue, date);
  const last = addDays(end, -1);
  const sameMonth = start.getMonth() === last.getMonth();
  const startLabel = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: sameMonth ? undefined : "long" }).format(start);
  const endLabel = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(last);
  return `Semaine du ${startLabel} au ${endLabel}`;
}

function buildHref(vue: Vue, date: Date) {
  return `/planning?vue=${vue}&date=${toDateParam(date)}`;
}

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; date?: string }>;
}) {
  const { vue: vueParam, date: dateParam } = await searchParams;
  const vue: Vue = vueParam === "jour" || vueParam === "mois" ? vueParam : "semaine";
  const date = parseDateParam(dateParam);
  const { start, end } = getRange(vue, date);

  const session = await auth();
  const companyId = session!.user.companyId;

  const [chantiers, maintenances, nettoyages] = await Promise.all([
    prisma.chantier.findMany({
      where: {
        site: { companyId },
        OR: [
          { startDate: { gte: start, lt: end } },
          { endDate: { gte: start, lt: end } },
          { AND: [{ startDate: { lte: start } }, { OR: [{ endDate: null }, { endDate: { gte: start } }] }] },
        ],
      },
      include: { site: { select: { id: true, name: true } } },
    }),
    prisma.maintenance.findMany({
      where: { site: { companyId }, scheduledDate: { gte: start, lt: end } },
      include: { site: { select: { id: true, name: true } } },
    }),
    prisma.nettoyage.findMany({
      where: { site: { companyId }, scheduledDate: { gte: start, lt: end } },
      include: { site: { select: { id: true, name: true } } },
    }),
  ]);

  type Entry = {
    id: string;
    kind: "Chantier" | "Maintenance" | "Nettoyage";
    href: string;
    name: string;
    site: string;
    date: Date | null;
    responsable: string | null;
    priorityLabel: { label: string; tone: Tone };
    statusLabel: { label: string; tone: Tone };
  };

  const entries: Entry[] = [
    ...chantiers.map((c) => ({
      id: c.id,
      kind: "Chantier" as const,
      href: `/chantiers/${c.id}`,
      name: c.name,
      site: c.site.name,
      date: c.startDate,
      responsable: c.responsable,
      priorityLabel: priorityLabels[c.priority],
      statusLabel: chantierStatusLabels[c.status],
    })),
    ...maintenances.map((m) => ({
      id: m.id,
      kind: "Maintenance" as const,
      href: `/maintenance/${m.id}`,
      name: m.title,
      site: m.site.name,
      date: m.scheduledDate,
      responsable: m.responsable,
      priorityLabel: priorityLabels[m.priority],
      statusLabel: maintenanceStatusLabels[m.status],
    })),
    ...nettoyages.map((n) => ({
      id: n.id,
      kind: "Nettoyage" as const,
      href: `/nettoyage/${n.id}`,
      name: n.title,
      site: n.site.name,
      date: n.scheduledDate,
      responsable: n.responsable,
      priorityLabel: priorityLabels[n.priority],
      statusLabel: chantierStatusLabels[n.status],
    })),
  ].sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));

  return (
    <div>
      <PageHeader title="Planning" description="Chantiers, maintenances et nettoyages planifiés." />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex overflow-hidden rounded-md border border-[var(--color-border-strong)]">
          {(["jour", "semaine", "mois"] as Vue[]).map((v) => (
            <Link
              key={v}
              href={buildHref(v, date)}
              className={clsx(
                "px-3 py-1.5 text-sm font-medium capitalize",
                v === vue
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text-secondary)] hover:bg-gray-50",
              )}
            >
              {v}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={buildHref(vue, shiftDate(vue, date, -1))}
            className="rounded-md border border-[var(--color-border-strong)] px-2.5 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-gray-50"
          >
            ← Précédent
          </Link>
          <span className="text-sm font-medium capitalize text-[var(--color-text)]">{formatLabel(vue, date)}</span>
          <Link
            href={buildHref(vue, shiftDate(vue, date, 1))}
            className="rounded-md border border-[var(--color-border-strong)] px-2.5 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-gray-50"
          >
            Suivant →
          </Link>
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="Aucun événement prévu sur cette période"
          description="Aucun chantier, maintenance ou nettoyage planifié pour cette période."
          actions={
            <>
              <LinkButton href="/chantiers/nouveau" variant="primary">
                + Ajouter un chantier
              </LinkButton>
              <LinkButton href="/maintenance/nouveau">+ Ajouter une maintenance</LinkButton>
              <LinkButton href="/nettoyage/nouveau">+ Ajouter un nettoyage</LinkButton>
            </>
          }
        />
      ) : (
        <Table>
          <Thead>
            <Th>Date</Th>
            <Th>Type</Th>
            <Th>Nom</Th>
            <Th>Site</Th>
            <Th>Responsable</Th>
            <Th>Priorité</Th>
            <Th>Statut</Th>
          </Thead>
          <Tbody>
            {entries.map((entry) => (
              <tr key={`${entry.kind}-${entry.id}`} className="hover:bg-gray-50">
                <Td className="text-[var(--color-text-secondary)]">
                  {formatDateShort(entry.date)}
                </Td>
                <Td className="text-[var(--color-text-secondary)]">{entry.kind}</Td>
                <Td>
                  <Link href={entry.href} className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]">
                    {entry.name}
                  </Link>
                </Td>
                <Td className="text-[var(--color-text-secondary)]">{entry.site}</Td>
                <Td className="text-[var(--color-text-secondary)]">{entry.responsable || "—"}</Td>
                <Td>
                  <Badge tone={entry.priorityLabel.tone}>{entry.priorityLabel.label}</Badge>
                </Td>
                <Td>
                  <Badge tone={entry.statusLabel.tone}>{entry.statusLabel.label}</Badge>
                </Td>
              </tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
