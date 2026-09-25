import { flexRender, Row, Table } from "@tanstack/react-table";
import { FunctionComponent, useCallback } from "react";
import { useRouter } from "next/router";
import {
  TableauCellule,
  TableauCorps,
  TableauLigne,
} from "@/components/shared/Tableau";
import { htmlId } from "@/components/PageRapportDétaillé/PageRapportDétaillé";
import { DonnéesTableauChantiers } from "@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface";
import { featuresTableauChantiers } from "../useRapportDétailléTableauChantiers";

interface TableauChantiersContenuProps {
  tableau: Table<typeof featuresTableauChantiers, DonnéesTableauChantiers>;
}

const RapportDétailléTableauChantiersContenu: FunctionComponent<
  TableauChantiersContenuProps
> = ({ tableau }) => {
  const router = useRouter();

  const auClicSurLaLigne = useCallback(
    (row: Row<typeof featuresTableauChantiers, DonnéesTableauChantiers>) => {
      if (row.getIsGrouped()) {
        row.getToggleExpandedHandler()();
      } else {
        void router.push(`#${htmlId.chantier(row.original.id)}`);
      }
    },
    [router],
  );

  return (
    <TableauCorps>
      {tableau.getRowModel().rows.map((row) => (
        <TableauLigne
          className="ligne-chantier cursor-pointer even:hover:bg-dsfr-grey-950-hover odd:hover:bg-dsfr-grey-975-hover"
          key={row.id}
          onClick={() => auClicSurLaLigne(row)}
        >
          {row.getVisibleCells().map((cell) => (
            <TableauCellule key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableauCellule>
          ))}
        </TableauLigne>
      ))}
    </TableauCorps>
  );
};

export default RapportDétailléTableauChantiersContenu;
