import { flexRender, type Table } from "@tanstack/react-table";
import { FunctionComponent, useCallback } from "react";
import { useRouter } from "next/router";
import type { FeaturesTableauAdminUtilisateurs } from "@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/useTableauAdminUtilisateurs";
import { UtilisateurListeGestionContrat } from "@/server/app/contrats/UtilisateurListeGestionContrat";

interface TableauAdminUtilisateursContenuProps {
  tableau: Table<
    FeaturesTableauAdminUtilisateurs,
    UtilisateurListeGestionContrat
  >;
}

const TableauAdminUtilisateursContenu: FunctionComponent<
  TableauAdminUtilisateursContenuProps
> = ({ tableau }) => {
  const router = useRouter();

  const auClicSurLaLigne = useCallback(
    (identifiantUtilisateur: string) => {
      router.push(`/admin/utilisateur/${identifiantUtilisateur}`);
    },
    [router],
  );

  return (
    <tbody>
      {tableau.getRowModel().rows.map((row) => (
        <tr
          className="cursor-pointer even:hover:bg-dsfr-grey-950-hover odd:hover:bg-dsfr-grey-975-hover"
          key={row.id}
          onClick={() => auClicSurLaLigne(row.original.id)}
        >
          {row.getVisibleCells().map((cell) => (
            <td
              className="fr-py-1w max-w-[10px] overflow-hidden text-ellipsis whitespace-nowrap"
              key={cell.id}
              title={cell.row.getValue(cell.column.id)}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};

export default TableauAdminUtilisateursContenu;
