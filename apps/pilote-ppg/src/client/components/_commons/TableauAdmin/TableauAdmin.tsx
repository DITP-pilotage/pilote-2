import { LigneTableau, TableauDe } from "../Tableau/typesTableau";
import { useRouter } from "next/router";
import { flexRender } from "@tanstack/react-table";
import type { ReactNode } from "react";
import Loader from "@/components/_commons/Loader/Loader";
import { PaginationCompacte } from "@/components/_commons/PaginationCompacte/PaginationCompacte";
import { clsxm } from "@/utils/clsxm";
import { lireRechercheGlobale } from "./utils";

export type LibellesTableauAdmin = {
  aucun: string;
  aucunResultat: string;
  invitationCreation?: string;
  iconeVide?: string;
};

const EtatVide = ({
  recherche,
  aDesFiltresActifs,
  libelles,
}: {
  recherche: string;
  aDesFiltresActifs: boolean;
  libelles: LibellesTableauAdmin;
}) => {
  const titre =
    recherche || aDesFiltresActifs ? "Aucun résultat" : libelles.aucun;

  let description: ReactNode;
  if (recherche) {
    description = (
      <>
        {libelles.aucunResultat} «&nbsp;{recherche}&nbsp;».
      </>
    );
  } else if (aDesFiltresActifs) {
    description = "Aucun élément ne correspond aux filtres sélectionnés.";
  } else {
    description = libelles.invitationCreation;
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      {libelles.iconeVide && (
        <p className="text-4xl mb-3">{libelles.iconeVide}</p>
      )}
      <p className="font-medium text-gray-500">{titre}</p>
      {description && <p className="text-sm mt-1">{description}</p>}
    </div>
  );
};

export function TableauAdmin<TRow extends LigneTableau>({
  table,
  isLoading,
  filtres,
  aDesFiltresActifs,
  hrefLigne,
  classesColonnes = {},
  libelles,
}: {
  table: TableauDe<TRow>;
  isLoading: boolean;
  filtres: ReactNode;
  aDesFiltresActifs: boolean;
  hrefLigne: (ligne: TRow) => string;
  classesColonnes?: Record<string, string>;
  libelles: LibellesTableauAdmin;
}) {
  const router = useRouter();
  const rows = table.getRowModel().rows;
  const recherche = lireRechercheGlobale(table);

  return (
    <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-200 overflow-hidden">
      {!isLoading && filtres}

      {isLoading ? (
        <div className="relative py-20">
          <Loader />
        </div>
      ) : rows.length === 0 ? (
        <EtatVide
          aDesFiltresActifs={aDesFiltresActifs}
          libelles={libelles}
          recherche={recherche}
        />
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
                onClick={() => router.push(hrefLigne(row.original))}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    className={clsxm(
                      "px-6 py-4",
                      classesColonnes[cell.column.id],
                    )}
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
  );
}
