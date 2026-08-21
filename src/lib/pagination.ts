// Pagination partagée par toutes les pages de liste — évite de charger des
// tableaux entiers non bornés (Clients, Sites, Chantiers...) qui deviennent
// lents dès que le nombre de lignes grandit.
export const PAGE_SIZE = 25;

export function parsePage(pageParam: string | undefined): number {
  const page = Number(pageParam);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function totalPagesFor(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

export function skipFor(page: number): number {
  return (page - 1) * PAGE_SIZE;
}