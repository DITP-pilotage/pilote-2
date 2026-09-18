import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { flexRender } from "@tanstack/react-table";
import api from "@/server/infrastructure/api/trpc/api";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import Loader from "@/components/_commons/Loader/Loader";
import { clsxm } from "@/utils/clsxm";
import { useTableauAdminChantiers } from "./useTableauAdminChantiers";

const PageAdminChantiers = () => {
  const router = useRouter();
  const { data: chantiers, isLoading } = api.metadataChantier.lister.useQuery();
  const [recherche, setRecherche] = useState("");

  const chantiersFiltres = useMemo(
    () =>
      chantiers?.filter((chantier) => {
        const q = recherche.toLowerCase().trim();
        if (!q) return true;
        return (
          chantier.chantierId.toLowerCase().includes(q) ||
          chantier.chNom.toLowerCase().includes(q)
        );
      }),
    [chantiers, recherche],
  );

  const { table } = useTableauAdminChantiers(chantiersFiltres ?? []);
  const rows = table.getRowModel().rows;

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">
              Panel administrateur
            </p>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestion des chantiers
            </h1>
            {!isLoading && chantiers && (
              <p className="mt-1 text-sm text-gray-500">
                {chantiers.length} chantier{chantiers.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Link
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-sm text-sm font-medium hover:bg-dsfr-blue-france-sun-113-hover transition-colors shadow-sm"
            href="/panel-administrateur/chantiers/nouveau?_action=creer-chantier"
          >
            <span className="text-base leading-none">+</span>
            Créer un chantier
          </Link>
        </div>

        <div className="mb-4 max-w-sm">
          <BarreDeRecherche
            changementDeLaRechercheCallback={(event) =>
              setRecherche(event.target.value)
            }
            valeur={recherche}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="relative py-20">
              <Loader />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-medium text-gray-500">
                {recherche ? "Aucun résultat" : "Aucun chantier"}
              </p>
              {recherche ? (
                <p className="text-sm mt-1">
                  Aucun chantier ne correspond à «&nbsp;{recherche}&nbsp;».
                </p>
              ) : (
                <p className="text-sm mt-1">
                  Créez votre premier chantier pour commencer.
                </p>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    className="border-b border-gray-200 bg-gray-50"
                    key={headerGroup.id}
                  >
                    {headerGroup.headers.map((header) => (
                      <th
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        key={header.id}
                      >
                        {header.column.getCanSort() ? (
                          <button
                            className="flex items-center gap-1 !p-0 !font-semibold !text-gray-500 hover:!text-gray-700"
                            onClick={header.column.getToggleSortingHandler()}
                            type="button"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {{ asc: " ↑", desc: " ↓" }[
                              header.column.getIsSorted() as string
                            ] ?? ""}
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr
                    className="hover:bg-dsfr-alt-blue-france transition-colors cursor-pointer"
                    key={row.id}
                    onClick={() =>
                      router.push(
                        `/panel-administrateur/chantiers/${row.original.chantierId}`,
                      )
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        className={clsxm("px-6 py-4", {
                          "font-mono text-xs text-gray-400":
                            cell.column.id === "chantierId",
                          "font-medium text-gray-900":
                            cell.column.id === "chNom",
                          "text-xs text-gray-500 whitespace-nowrap":
                            cell.column.id === "updatedAt",
                        })}
                        key={cell.id}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {rows.length > 0 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span>Lignes par page :</span>
                <select
                  className="border border-gray-200 rounded-sm px-2 py-1 bg-white"
                  onChange={(event) =>
                    table.setPageSize(Number(event.target.value))
                  }
                  value={table.getState().pagination.pageSize}
                >
                  {[10, 20, 50].map((taille) => (
                    <option key={taille} value={taille}>
                      {taille}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span>
                  Page {table.getState().pagination.pageIndex + 1} sur{" "}
                  {table.getPageCount()}
                </span>
                <button
                  className="px-3 py-1 border border-gray-200 rounded-sm disabled:opacity-50"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                  type="button"
                >
                  Précédent
                </button>
                <button
                  className="px-3 py-1 border border-gray-200 rounded-sm disabled:opacity-50"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                  type="button"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageAdminChantiers;
