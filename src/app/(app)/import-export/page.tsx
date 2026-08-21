import { PageHeader } from "@/components/ui/PageHeader";
import { ImportPanel } from "./ImportPanel";
import { exportableEntities } from "@/lib/importExport";

export default function ImportExportPage() {
  return (
    <div>
      <PageHeader title="Import / Export" description="Importer ou exporter vos données au format CSV." />

      <section className="mb-10">
        <h2 className="mb-1 text-base font-semibold text-[var(--color-text)]">Importer</h2>
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          Un aperçu s&apos;affiche avant toute validation : les lignes en erreur sont signalées et ne sont pas importées.
        </p>
        <ImportPanel />
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold text-[var(--color-text)]">Exporter</h2>
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          Télécharger vos données au format CSV.
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(exportableEntities).map(([key, label]) => (
            <a
              key={key}
              href={`/api/export/${key}`}
              className="rounded-md border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-gray-50"
            >
              {label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
