"use client";

import dynamic from "next/dynamic";
import type { MapSite } from "./WorldMap";

// Leaflet a besoin de `window` : chargement uniquement côté client.
const WorldMap = dynamic(() => import("./WorldMap").then((mod) => mod.WorldMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[560px] items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text-secondary)]">
      Chargement de la carte…
    </div>
  ),
});

export function WorldMapLoader({ sites }: { sites: MapSite[] }) {
  return <WorldMap sites={sites} />;
}
