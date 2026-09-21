import { useRouter } from "next/router";
import { flexRender } from "@tanstack/react-table";
import api from "@/server/infrastructure/api/trpc/api";
import { Lien } from "@/components/_commons/Lien/Lien";
import Loader from "@/components/_commons/Loader/Loader";
import { PaginationCompacte } from "@/components/_commons/PaginationCompacte/PaginationCompacte";
import { clsxm } from "@/utils/clsxm";
import { useTableauAdminChantiers } from "./useTableauAdminChantiers";
import { FiltresAdminChantiers } from "./FiltresAdminChantiers";

const PageAdminChantiers = () => {
  const router = useRouter();
  const { data: chantiers, isLoading } = api.metadataChantier.lister.useQuery();
  const { data: perimetres } = api.metadataChantier.listerPerimetres.useQuery();

  const { table, aDesFiltresActifs, reinitialiserLesFiltres } =
    useTableauAdminChantiers(chantiers ?? []);
  const rows = table.getRowModel().rows;
  const recherche = (table.getState().globalFilter as string | undefined) ?? "";
  const nombreChantiersFiltres = table.getFilteredRowModel().rows.length;

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
                {nombreChantiersFiltres} chantier
                {nombreChantiersFiltres !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Lien
            href="/panel-administrateur/chantiers/nouveau?_action=creer-chantier"
            label="+ Créer un chantier"
            variant="button"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-200 overflow-hidden">
          {!isLoading && (
            <FiltresAdminChantiers
              aDesFiltresActifs={aDesFiltresActifs}
              perimetres={perimetres ?? []}
              reinitialiserLesFiltres={reinitialiserLesFiltres}
              table={table}
            />
          )}

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
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
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
            <PaginationCompacte
              changementDePageCallback={(numeroDePage) =>
                table.setPageIndex(numeroDePage - 1)
              }
              changementTailleDePageCallback={(tailleDePage) =>
                table.setPageSize(tailleDePage)
              }
              nombreDePages={table.getPageCount()}
              numeroDePageCourante={table.getState().pagination.pageIndex + 1}
              tailleDePage={table.getState().pagination.pageSize}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PageAdminChantiers;
