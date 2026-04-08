import { Fragment, FunctionComponent, useMemo, useState } from "react";
import { $Enums } from "@prisma/client";
import { flexRender } from "@tanstack/react-table";
import { clsxm } from "@/utils/clsxm";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { useTableauLogs } from "./useTableauLogs";
import { ModalePurge } from "./ModalePurge";

const CATEGORIES = [
  "auth",
  "chantier",
  "import",
  "indicateur",
  "notification",
  "pva",
  "rapport",
  "utilisateur",
  "systeme",
];

const BADGE_STYLES: Record<$Enums.log_level, string> = {
  ERROR: "bg-red-100 text-red-800",
  WARN: "bg-orange-100 text-orange-800",
  INFO: "bg-blue-100 text-blue-800",
  DEBUG: "bg-gray-100 text-gray-600",
};

function formaterDate(date: Date | string): string {
  const dateISO = typeof date === "string" ? date : date.toISOString();
  return PiloteDateFormatter.isoDateTimeFranceMetropolitaine(dateISO);
}

export const TableauLogs: FunctionComponent = () => {
  const {
    table,
    total,
    page,
    setPage,
    totalPages,
    filtreLevel,
    setFiltreLevel,
    filtreCategorie,
    setFiltreCategorie,
    filtreRecherche,
    setFiltreRecherche,
    dateDebut,
    setDateDebut,
    logsExpandus,
    toggleExpansion,
  } = useTableauLogs();

  const [modalePurgeOuverte, setModalePurgeOuverte] = useState(false);

  return (
    <div>
      {/* Filtres */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="filtre-level"
          >
            Niveau
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
            id="filtre-level"
            onChange={(event) =>
              setFiltreLevel(
                (event.target.value as $Enums.log_level) || undefined,
              )
            }
            value={filtreLevel ?? ""}
          >
            <option value="">Tous</option>
            {Object.values($Enums.log_level).map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="filtre-categorie"
          >
            Catégorie
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
            id="filtre-categorie"
            onChange={(event) =>
              setFiltreCategorie(event.target.value || undefined)
            }
            value={filtreCategorie ?? ""}
          >
            <option value="">Toutes</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="filtre-date-debut"
          >
            Date début
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            id="filtre-date-debut"
            onChange={(event) =>
              setDateDebut(
                event.target.value
                  ? new Date(event.target.value).toISOString()
                  : undefined,
              )
            }
            type="date"
            value={dateDebut ? dateDebut.slice(0, 10) : ""}
          />
        </div>
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="filtre-recherche"
          >
            Recherche
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            id="filtre-recherche"
            onChange={(event) =>
              setFiltreRecherche(event.target.value || undefined)
            }
            placeholder="Rechercher dans les messages..."
            type="text"
            value={filtreRecherche ?? ""}
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    className={clsxm(
                      "px-4 py-3 text-left font-medium text-gray-600",
                      header.id === "expand" && "w-10",
                    )}
                    key={header.id}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const log = row.original;
              return (
                <Fragment key={row.id}>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">
                      {formaterDate(log.timestamp)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={clsxm(
                          "inline-block px-2 py-0.5 rounded text-xs font-medium",
                          BADGE_STYLES[log.level],
                        )}
                      >
                        {log.level}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-700">{log.categorie}</td>
                    <td className="px-4 py-2 max-w-[400px] truncate text-gray-800">
                      {log.message}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">
                      {log.source}
                    </td>
                    <td className="px-4 py-2">
                      {log.contexte != null && (
                        <button
                          aria-controls={`contexte-${log.id}`}
                          aria-expanded={logsExpandus.has(log.id)}
                          aria-label={`${logsExpandus.has(log.id) ? "Masquer" : "Afficher"} le contexte du log`}
                          className="text-gray-400 hover:text-gray-700 transition-colors"
                          onClick={() => toggleExpansion(log.id)}
                          type="button"
                        >
                          {logsExpandus.has(log.id) ? "▼" : "▶"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {logsExpandus.has(log.id) && log.contexte != null && (
                    <tr id={`contexte-${log.id}`}>
                      <td className="p-4 bg-dsfr-grey-50" colSpan={6}>
                        <pre className="text-dsfr-grey-925 font-mono text-xs whitespace-pre-wrap m-0">
                          {JSON.stringify(log.contexte, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-600">
          {total} logs — Page {page} / {totalPages}
        </p>
        <div className="flex items-center gap-3">
          <PaginationPages
            page={page}
            setPage={setPage}
            totalPages={totalPages}
          />
          <button
            className="px-3 py-1.5 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50"
            onClick={() => setModalePurgeOuverte(true)}
            type="button"
          >
            Purger les logs
          </button>
        </div>
      </div>

      <ModalePurge
        onFermer={() => setModalePurgeOuverte(false)}
        open={modalePurgeOuverte}
      />
    </div>
  );
};

const PaginationPages: FunctionComponent<{
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
}> = ({ page, setPage, totalPages }) => {
  const pages = useMemo(() => {
    const result: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) result.push(i);
      return result;
    }
    result.push(1);
    if (page > 3) result.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      result.push(i);
    }
    if (page < totalPages - 2) result.push("...");
    result.push(totalPages);
    return result;
  }, [page, totalPages]);

  const btnClass =
    "px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex gap-1">
      <button
        className={btnClass}
        disabled={page <= 1}
        onClick={() => setPage(1)}
        type="button"
      >
        «
      </button>
      <button
        className={btnClass}
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
        type="button"
      >
        ‹
      </button>
      {pages.map((p, index) =>
        p === "..." ? (
          <span
            className="px-2 py-1.5 text-sm text-gray-400"
            key={`ellipsis-${index}`}
          >
            …
          </span>
        ) : (
          <button
            className={clsxm(
              btnClass,
              p === page &&
                "bg-primary text-white border-primary hover:bg-primary",
            )}
            key={p}
            onClick={() => setPage(p)}
            type="button"
          >
            {p}
          </button>
        ),
      )}
      <button
        className={btnClass}
        disabled={page >= totalPages}
        onClick={() => setPage(page + 1)}
        type="button"
      >
        ›
      </button>
      <button
        className={btnClass}
        disabled={page >= totalPages}
        onClick={() => setPage(totalPages)}
        type="button"
      >
        »
      </button>
    </div>
  );
};
