// Petits utilitaires de date, sans dépendance externe (le besoin reste
// simple : calculer des bornes jour/semaine/mois pour le planning).

export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Semaine du lundi au dimanche.
export function startOfWeek(date: Date) {
  const d = startOfDay(date);
  const day = d.getDay(); // 0 = dimanche
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

export function startOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function startOfYear(date: Date) {
  const d = new Date(date.getFullYear(), 0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Grille complète du mois (semaines du lundi au dimanche), en incluant les
// jours de fin/début des mois voisins nécessaires pour compléter la grille.
export function getMonthGrid(date: Date): Date[][] {
  const firstOfMonth = startOfMonth(date);
  const lastOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const gridStart = startOfWeek(firstOfMonth);
  const gridEnd = startOfWeek(lastOfMonth);

  const weeks: Date[][] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

export function parseDateParam(value: string | undefined) {
  if (!value) return new Date();
  const parsed = new Date(value + "T00:00:00");
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function toDateParam(date: Date) {
  return date.toISOString().slice(0, 10);
}
