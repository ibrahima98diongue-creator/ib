"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { siteStatusLabels } from "@/lib/labels";
import { SiteStatus } from "@/generated/prisma/enums";
import { formatKwh } from "@/lib/format";

export type MapSite = {
  id: string;
  name: string;
  clientName: string;
  latitude: number;
  longitude: number;
  powerKwc: number | null;
  status: SiteStatus;
  productionThisYear: number | null;
  nextMaintenance: { title: string; date: string } | null;
};

// Marqueur en forme de goutte, dans la couleur du statut du site — pas
// d'image externe à charger, juste du SVG inline (évite le classique souci
// de chemins d'icônes Leaflet cassés par le bundler).
function markerIcon(tone: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34">
      <path d="M13 0C5.8 0 0 5.8 0 13c0 9.75 13 21 13 21s13-11.25 13-21C26 5.8 20.2 0 13 0Z" fill="${tone}"/>
      <circle cx="13" cy="13" r="5" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -30],
  });
}

const toneHex: Record<string, string> = {
  low: "#227a4b",
  medium: "#a98212",
  neutral: "#5b6572",
};

export function WorldMap({ sites }: { sites: MapSite[] }) {
  const center: [number, number] =
    sites.length > 0
      ? [sites.reduce((s, x) => s + x.latitude, 0) / sites.length, sites.reduce((s, x) => s + x.longitude, 0) / sites.length]
      : [20, 0];

  return (
    <div className="h-[560px] overflow-hidden rounded-lg border border-[var(--color-border)]">
      <MapContainer center={center} zoom={sites.length > 0 ? 4 : 2} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {sites.map((site) => {
          const tone = siteStatusLabels[site.status].tone;
          return (
            <Marker
              key={site.id}
              position={[site.latitude, site.longitude]}
              icon={markerIcon(toneHex[tone] ?? toneHex.neutral)}
            >
              <Popup>
                <div className="min-w-[200px] space-y-1.5">
                  <p className="font-semibold text-[var(--color-text)]">{site.name}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{site.clientName}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {site.powerKwc ? `${site.powerKwc} kWc` : "Puissance non renseignée"}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Production (année) :{" "}
                    {site.productionThisYear !== null ? formatKwh(site.productionThisYear) : "aucune donnée"}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Prochaine maintenance :{" "}
                    {site.nextMaintenance ? `${site.nextMaintenance.title} (${site.nextMaintenance.date})` : "aucune"}
                  </p>
                  <div>
                    <Badge tone={tone}>{siteStatusLabels[site.status].label}</Badge>
                  </div>
                  <Link
                    href={`/sites/${site.id}`}
                    className="mt-1 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
                  >
                    Voir le site →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
