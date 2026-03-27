import { flexRender, Table } from "@tanstack/react-table";
import { FunctionComponent } from "react";
import { DonnéesTableauChantiers } from "@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface";

interface TableauChantiersEnTêteProps {
  tableau: Table<DonnéesTableauChantiers>;
}

const RapportDétailléTableauChantiersEnTête: FunctionComponent<
  TableauChantiersEnTêteProps
> = ({ tableau }) => {
  return (
    <thead className="!bg-dsfr-blue-france-925 border border-dsfr-grey-925">
      {tableau.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <th
              className="first:rounded-tl-lg last:rounded-tr-lg"
              key={header.id}
              style={{
                width: header.column.columnDef.meta?.width ?? undefined,
              }}
            >
              <p className="fr-mb-0 fr-text--sm inline-block">
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </p>
            </th>
          ))}
        </tr>
      ))}
    </thead>
  );
};

export default RapportDétailléTableauChantiersEnTête;
