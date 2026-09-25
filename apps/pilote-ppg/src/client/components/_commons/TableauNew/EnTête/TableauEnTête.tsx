import { flexRender, SortDirection } from "@tanstack/react-table";
import {
  TableauCelluleEnTete,
  TableauEnTete,
} from "@/components/shared/Tableau";
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

export default function TableauEnTête<TContexte extends object>({
  tableau,
}: TableauEnTêteProps<TContexte>) {
  return (
    <TableauEnTete className="bg-dsfr-blue-france-925 border border-dsfr-grey-925">
      {tableau.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableauCelluleEnTete
              aria-sort={renseignerAttributAriaSort(
                header.column.getIsSorted(),
              )}
              className="py-2 px-1 min-[62rem]:px-4 first:rounded-tl-lg last:rounded-tr-lg"
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
            </TableauCelluleEnTete>
          ))}
        </tr>
      ))}
    </TableauEnTete>
  );
}
