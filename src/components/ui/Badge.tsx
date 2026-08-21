// Une seule échelle de couleurs pour tout statut/priorité dans l'application.
// Ne jamais créer de nouvelle couleur ailleurs : réutiliser ces tons.
export type Tone = "critical" | "high" | "medium" | "low" | "neutral" | "info";

const toneStyles: Record<Tone, { color: string; background: string }> = {
  critical: { color: "var(--color-critical)", background: "var(--color-critical-bg)" },
  high: { color: "var(--color-high)", background: "var(--color-high-bg)" },
  medium: { color: "var(--color-medium)", background: "var(--color-medium-bg)" },
  low: { color: "var(--color-low)", background: "var(--color-low-bg)" },
  neutral: { color: "var(--color-neutral)", background: "var(--color-neutral-bg)" },
  info: { color: "var(--color-info)", background: "var(--color-info-bg)" },
};

// Pour les cas où seule la couleur (pas le badge complet) est nécessaire,
// par ex. un point de couleur dans une cellule de calendrier.
export function toneColor(tone: Tone) {
  return toneStyles[tone].color;
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  const style = toneStyles[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ color: style.color, backgroundColor: style.background }}
    >
      {children}
    </span>
  );
}
