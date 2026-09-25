import { flexRender, SortDirection } from "@tanstack/react-table";
import { FunctionComponent } from "react";
import {
  TableauCelluleEnTete,
  TableauEnTete,
} from "@/components/shared/Tableau";
import type { TableauDesChantiers } from "@/components/PageAccueil/PageChantiers/TableauChantiers/useTableauChantiers";

interface TableauRéformesEnTêteProps {
  tableau: TableauDesChantiers;
}

function renseignerAttributAriaSort(typeDeTri: false | SortDirection) {
  if (!typeDeTri) return "none";

  const tupleTriAttributAriaSort = {
    asc: "ascending",
    desc: "descending",
  } as const;

  return tupleTriAttributAriaSort[typeDeTri];
}

const TableauRéformesEnTête: FunctionComponent<TableauRéformesEnTêteProps> = ({
  tableau,
}) => {
  return (
    <TableauEnTete className="bg-dsfr-blue-france-925 border border-dsfr-grey-925">
      {tableau.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableauCelluleEnTete
              aria-sort={renseignerAttributAriaSort(
                header.column.getIsSorted(),
              )}
              className="px-2 first:rounded-tl-lg last:rounded-tr-lg"
              key={header.id}
              style={{
                width: header.column.columnDef.meta?.width ?? undefined,
              }}
            >
              <div className="fr-mb-0 fr-text fr-text--sm title inline-block max-[78rem]:!text-xs">
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </div>
            </TableauCelluleEnTete>
          ))}
        </tr>
      ))}
    </TableauEnTete>
  );
};

export default TableauRéformesEnTête;
