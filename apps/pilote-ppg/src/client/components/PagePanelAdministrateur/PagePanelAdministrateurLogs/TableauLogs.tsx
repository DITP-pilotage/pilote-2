import { Fragment, FunctionComponent, useState } from "react";
import { $Enums } from "@prisma/client";
import { flexRender } from "@tanstack/react-table";
import { clsxm } from "@/utils/clsxm";
import { CATEGORIES_LOG, libelleCategorieLog } from "@/utils/categoriesLog";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { Table } from "@/components/shared/Table";
import { DataTableEmpty } from "@/components/shared/DataTable/Empty";
import { PaginationView } from "@/components/shared/DataTable/Pagination";
import { useTableauLogs } from "./useTableauLogs";
import { ModalePurge } from "./ModalePurge";

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

const CELLULE = "text-[length:inherit] leading-[inherit]";

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
            {Object.entries(CATEGORIES_LOG).map(([categorie, libelle]) => (
              <option key={categorie} value={categorie}>
                {libelle}
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
      {table.getRowModel().rows.length === 0 ? (
        <DataTableEmpty
          empty={{ title: "Aucun log" }}
          hasActiveFilters={false}
          onResetFilters={() => {}}
        />
      ) : (
        <Table.Root
          caption="Journal applicatif"
          captionHidden
          className="w-full text-sm"
        >
          <Table.Header>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Row key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Table.ColumnHeaderCell
                    className={clsxm(
                      CELLULE,
                      "px-4 py-3 md:px-4 md:py-3",
                      header.id === "expand" && "w-10",
                    )}
                    key={header.id}
                  >
                    {header.id === "expand" ? (
                      <span className="sr-only">Contexte</span>
                    ) : header.isPlaceholder ? null : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </Table.ColumnHeaderCell>
                ))}
              </Table.Row>
            ))}
          </Table.Header>
          <Table.Body>
            {table.getRowModel().rows.map((row, index) => {
              const log = row.original;
              return (
                <Fragment key={row.id}>
                  <Table.Row
                    className={
                      index % 2 === 1
                        ? "bg-dsfr-grey-1000 hover:bg-dsfr-grey-975-hover"
                        : "bg-white hover:bg-dsfr-grey-975-hover"
                    }
                  >
                    <Table.Cell
                      className={clsxm(
                        CELLULE,
                        "px-4 py-2 md:px-4 md:py-2 font-mono text-xs whitespace-nowrap",
                      )}
                    >
                      {formaterDate(log.timestamp)}
                    </Table.Cell>
                    <Table.Cell
                      className={clsxm(CELLULE, "px-4 py-2 md:px-4 md:py-2")}
                    >
                      <span
                        className={clsxm(
                          "inline-block px-2 py-0.5 rounded text-xs font-medium",
                          BADGE_STYLES[log.level],
                        )}
                      >
                        {log.level}
                      </span>
                    </Table.Cell>
                    <Table.Cell
                      className={clsxm(CELLULE, "px-4 py-2 md:px-4 md:py-2")}
                    >
                      {libelleCategorieLog(log.categorie)}
                    </Table.Cell>
                    <Table.Cell
                      className={clsxm(
                        CELLULE,
                        "px-4 py-2 md:px-4 md:py-2 max-w-[400px] truncate",
                      )}
                    >
                      {log.message}
                    </Table.Cell>
                    <Table.Cell
                      className={clsxm(
                        CELLULE,
                        "px-4 py-2 md:px-4 md:py-2 font-mono text-xs text-gray-500",
                      )}
                    >
                      {log.source}
                    </Table.Cell>
                    <Table.Cell
                      className={clsxm(CELLULE, "px-4 py-2 md:px-4 md:py-2")}
                    >
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
                    </Table.Cell>
                  </Table.Row>
                  {logsExpandus.has(log.id) && log.contexte != null && (
                    <Table.Row id={`contexte-${log.id}`}>
                      <Table.Cell
                        className={clsxm(CELLULE, "p-4 md:p-4 bg-dsfr-grey-50")}
                        colSpan={6}
                      >
                        <pre className="text-dsfr-grey-925 font-mono text-xs whitespace-pre-wrap m-0">
                          {JSON.stringify(log.contexte, null, 2)}
                        </pre>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Fragment>
              );
            })}
          </Table.Body>
        </Table.Root>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-600">
          {total} logs — Page {page} / {totalPages}
        </p>
        <div className="flex items-center gap-3">
          <PaginationView
            className="mt-0 mb-0"
            onPageChange={(pageIndex) => setPage(pageIndex + 1)}
            pageCount={totalPages}
            pageIndex={page - 1}
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
