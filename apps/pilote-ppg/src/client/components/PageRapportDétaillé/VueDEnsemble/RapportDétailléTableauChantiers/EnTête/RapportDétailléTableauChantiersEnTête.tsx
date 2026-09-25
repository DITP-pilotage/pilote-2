import { flexRender, Table } from "@tanstack/react-table";
import { FunctionComponent } from "react";
import {
  TableauCelluleEnTete,
  TableauEnTete,
} from "@/components/shared/Tableau";
import { DonnéesTableauChantiers } from "@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface";
import { featuresTableauChantiers } from "../useRapportDétailléTableauChantiers";

interface TableauChantiersEnTêteProps {
  tableau: Table<typeof featuresTableauChantiers, DonnéesTableauChantiers>;
}

const RapportDétailléTableauChantiersEnTête: FunctionComponent<
  TableauChantiersEnTêteProps
> = ({ tableau }) => {
  return (
    <TableauEnTete className="bg-dsfr-blue-france-925 border border-dsfr-grey-925">
      {tableau.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableauCelluleEnTete
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
            </TableauCelluleEnTete>
          ))}
        </tr>
      ))}
    </TableauEnTete>
  );
};

export default RapportDétailléTableauChantiersEnTête;
