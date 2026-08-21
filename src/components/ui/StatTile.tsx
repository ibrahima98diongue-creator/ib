import Link from "next/link";
import { Card } from "@/components/ui/Card";

// Tuile chiffrée réutilisée par le tableau de bord, Production et
// Rapports — avec ou sans lien vers la page détaillée correspondante.
export function StatTile({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href?: string;
}) {
  const content = (
    <Card className={href ? "transition-shadow hover:shadow-md" : undefined}>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{value}</p>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
