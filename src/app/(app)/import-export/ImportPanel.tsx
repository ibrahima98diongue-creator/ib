"use client";

import { useState } from "react";
import { previewImport, commitImport, type PreviewResult } from "@/lib/actions/importExport";
import { importableEntities, type ImportEntityKey } from "@/lib/importExport";
import { inputClass } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";

const entityKeys = Object.keys(importableEntities) as ImportEntityKey[];

function downloadTemplate(entity: ImportEntityKey) {
  const columns = importableEntities[entity].columns;
  const csv = columns.join(",") + "\r\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `modele-${entity}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportPanel() {
  const [entity, setEntity] = useState<ImportEntityKey>("clients");
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [pending, setPending] = useState(false);

  async function handleFile(file: File) {
    const text = await file.text();
    setFileName(file.name);
    setCsvText(text);
    setResult(null);
    setPending(true);
    try {
      const preview = await previewImport(entity, text);
      setPreview(preview);
    } finally {
      setPending(false);
    }
  }

  async function handleConfirm() {
    if (!csvText) return;
    setPending(true);
    try {
      const result = await commitImport(entity, csvText);
      setResult(result);
      setPreview(null);
      setCsvText(null);
      setFileName(null);
    } finally {
      setPending(false);
    }
  }

  function reset() {
    setPreview(null);
    setCsvText(null);
    setFileName(null);
    setResult(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="entity" className="block text-sm font-medium text-[var(--color-text)]">
            Type de données
          </label>
          <select
            id="entity"
            value={entity}
            onChange={(e) => {
              setEntity(e.target.value as ImportEntityKey);
              reset();
            }}
            className={`mt-1 ${inputClass}`}
          >
            {entityKeys.map((key) => (
              <option key={key} value={key}>
                {importableEntities[key].label}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" variant="secondary" onClick={() => downloadTemplate(entity)}>
          Télécharger un modèle CSV
        </Button>
        <div>
          <label htmlFor="csv-file" className="block text-sm font-medium text-[var(--color-text)]">
            Fichier CSV
          </label>
          <input
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            className="mt-1 text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      </div>

      {pending && <p className="mt-4 text-sm text-[var(--color-text-secondary)]">Analyse en cours…</p>}

      {result && (
        <p className="mt-4 rounded-md bg-[var(--color-low-bg)] px-3 py-2 text-sm text-[var(--color-low)]">
          {result.imported} ligne{result.imported > 1 ? "s" : ""} importée{result.imported > 1 ? "s" : ""}.
          {result.skipped > 0 && ` ${result.skipped} ligne${result.skipped > 1 ? "s" : ""} ignorée${result.skipped > 1 ? "s" : ""} (déjà existante ou invalide).`}
        </p>
      )}

      {preview && (
        <div className="mt-4">
          <p className="mb-3 text-sm text-[var(--color-text-secondary)]">
            {fileName} — {preview.validCount} ligne{preview.validCount > 1 ? "s" : ""} valide
            {preview.validCount > 1 ? "s" : ""}
            {preview.invalidCount > 0 && (
              <span className="text-[var(--color-critical)]">
                {" "}
                · {preview.invalidCount} ligne{preview.invalidCount > 1 ? "s" : ""} en erreur
              </span>
            )}
          </p>

          <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-white">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                  {preview.columns.map((col) => (
                    <th key={col} className="px-3 py-2 font-medium">
                      {col}
                    </th>
                  ))}
                  <th className="px-3 py-2 font-medium">Erreur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {preview.rows.map((row, i) => (
                  <tr key={i} className={row.error ? "bg-[var(--color-critical-bg)]" : undefined}>
                    {preview.columns.map((col) => (
                      <td key={col} className="px-3 py-2 text-[var(--color-text-secondary)]">
                        {row.raw[col] || "—"}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-[var(--color-critical)]">{row.error ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button
              type="button"
              variant="primary"
              disabled={pending || preview.validCount === 0}
              onClick={handleConfirm}
            >
              {pending ? "Import en cours…" : `Confirmer l'import (${preview.validCount})`}
            </Button>
            <Button type="button" variant="ghost" onClick={reset}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
