import { flexRender, SortDirection, Table } from "@tanstack/react-table";
import { FunctionComponent } from "react";
import { ChantierVueDEnsemble } from "@/server/domain/chantier/Chantier.interface";

interface TableauRéformesEnTêteProps {
  tableau: Table<ChantierVueDEnsemble>;
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
    <thead className="!bg-dsfr-blue-france-925 border border-dsfr-grey-925">
      {tableau.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <th
              aria-sort={renseignerAttributAriaSort(
                header.column.getIsSorted(),
              )}
              className="fr-px-1w first:rounded-tl-lg last:rounded-tr-lg"
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
            </th>
          ))}
        </tr>
      ))}
    </thead>
  );
};

export default TableauRéformesEnTête;
