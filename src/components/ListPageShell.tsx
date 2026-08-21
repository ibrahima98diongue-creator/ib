import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";

// Coquille commune à toutes les pages de liste (Clients, Sites,
// Installations, Équipements, Chantiers, Maintenance, Nettoyage,
// Production, Météo, To-Do...) : même en-tête + bouton d'ajout, même état
// vide guidé, même pagination. Évite de dupliquer cette structure dans
// chaque page — seul le contenu du tableau change d'une entité à l'autre.
export function ListPageShell({
  title,
  description,
  count,
  addHref,
  addLabel,
  emptyTitle,
  emptyDescription,
  emptyActions,
  headerExtra,
  page,
  totalPages,
  buildPageHref,
  children,
}: {
  title: string;
  description?: string;
  count: number;
  addHref: string;
  addLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyActions?: React.ReactNode;
  headerExtra?: React.ReactNode;
  // Pagination : facultative, n'affiche la navigation que si les 3 props
  // sont fournies ensemble (les pages qui ne paginent pas les omettent).
  page?: number;
  totalPages?: number;
  buildPageHref?: (page: number) => string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        action={
          count > 0 && (
            <div className="flex items-center gap-2">
              {headerExtra}
              <LinkButton href={addHref} variant="primary">
                {addLabel}
              </LinkButton>
            </div>
          )
        }
      />
      {count === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} actions={emptyActions} />
      ) : (
        <>
          {children}
          {page !== undefined && totalPages !== undefined && buildPageHref && (
            <Pagination page={page} totalPages={totalPages} buildHref={buildPageHref} />
          )}
        </>
      )}
    </div>
  );
}
