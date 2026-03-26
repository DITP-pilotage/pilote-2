import { flexRender, SortDirection } from "@tanstack/react-table";
import BoutonsDeTri from "@/components/_commons/Tableau/EnTête/BoutonsDeTri/BoutonsDeTri";
import TableauEnTêteProps from "./TableauEnTête.interface";

function renseignerAttributAriaSort(typeDeTri: false | SortDirection) {
  if (!typeDeTri) return "none";

  const tupleTriAttributAriaSort = {
    asc: "ascending",
    desc: "descending",
  } as const;

  return tupleTriAttributAriaSort[typeDeTri];
}

export default function TableauEnTête<T>({ tableau }: TableauEnTêteProps<T>) {
  return (
    <thead className="!bg-dsfr-blue-france-925 border border-dsfr-grey-925 [&_th:first-of-type]:rounded-tl-lg [&_th:last-child]:rounded-tr-lg max-[49rem]:[&_.label]:!text-xs">
      {tableau.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <th
              aria-sort={renseignerAttributAriaSort(
                header.column.getIsSorted(),
              )}
              className="fr-py-1w fr-px-1v fr-px-lg-2w"
              key={header.id}
              style={{
                width: header.column.columnDef.meta?.width ?? undefined,
              }}
            >
              <div className="flex flex-col justify-between w-full">
                <span className="bold">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </span>
                {header.column.getCanSort() && (
                  <BoutonsDeTri
                    changementDirectionDeTriCallback={(tri) =>
                      tri === false
                        ? header.column.clearSorting()
                        : header.column.toggleSorting(tri === "desc")
                    }
                    directionDeTri={header.column.getIsSorted()}
                    nomColonneÀTrier={header.column.columnDef.id ?? ""}
                  />
                )}
              </div>
            </th>
          ))}
        </tr>
      ))}
    </thead>
  );
}
