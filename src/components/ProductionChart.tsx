"use client";

import { useState } from "react";

export type ProductionChartPoint = { label: string; value: number };

function topRoundedRectPath(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0) return "";
  const radius = Math.min(r, w / 2, h);
  return `M${x},${y + h} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${y + h} Z`;
}

// Graphique en barres à une seule série (une seule couleur suffit, pas de
// légende nécessaire) — utilisé uniquement quand des données réelles
// existent, jamais avec des valeurs inventées.
export function ProductionChart({
  data,
  unit = "kWh",
}: {
  data: ProductionChartPoint[];
  unit?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const width = 720;
  const height = 220;
  const paddingLeft = 44;
  const paddingBottom = 24;
  const paddingTop = 12;
  const plotWidth = width - paddingLeft - 8;
  const plotHeight = height - paddingTop - paddingBottom;
  const max = Math.max(1, ...data.map((d) => d.value));
  const barGap = 4;
  const step = plotWidth / data.length;
  const barWidth = Math.max(2, step - barGap);
  const yTicks = [0, max / 2, max];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`Production quotidienne en ${unit}`}>
        {yTicks.map((t, i) => {
          const y = height - paddingBottom - (t / max) * plotHeight;
          return (
            <g key={i}>
              <line x1={paddingLeft} y1={y} x2={width} y2={y} stroke="var(--color-border)" strokeDasharray="2,3" />
              <text x={paddingLeft - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="var(--color-text-secondary)">
                {Math.round(t)}
              </text>
            </g>
          );
        })}
        <line
          x1={paddingLeft}
          y1={height - paddingBottom}
          x2={width}
          y2={height - paddingBottom}
          stroke="var(--color-border-strong)"
        />
        {data.map((d, i) => {
          const x = paddingLeft + i * step;
          const h = (d.value / max) * plotHeight;
          const y = height - paddingBottom - h;
          return (
            <g
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="cursor-default"
            >
              {/* zone de survol plus large que la barre elle-même */}
              <rect x={x} y={paddingTop} width={step} height={plotHeight} fill="transparent" />
              <path
                d={topRoundedRectPath(x + barGap / 2, y, barWidth, h, 3)}
                fill={hover === i ? "var(--color-primary-hover)" : "var(--color-primary)"}
              />
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[110%] whitespace-nowrap rounded-md border border-[var(--color-border)] bg-white px-2 py-1 text-xs shadow-[var(--shadow-sm)]"
          style={{
            left: `${((paddingLeft + hover * step + step / 2) / width) * 100}%`,
            top: 0,
          }}
        >
          <p className="font-medium text-[var(--color-text)]">{data[hover].label}</p>
          <p className="text-[var(--color-text-secondary)]">
            {data[hover].value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} {unit}
          </p>
        </div>
      )}
    </div>
  );
}
