// Formatage partagé — évite de redéfinir la même fonction formatDate() dans
// chaque page (c'était le cas dans une quinzaine de fichiers).

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-FR").format(new Date(date));
}

// Format court (ex. "18 août"), utilisé dans le planning, le tableau de
// bord et les graphiques où l'espace est limité.
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(date));
}

export function formatKwh(value: number): string {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} kWh`;
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
