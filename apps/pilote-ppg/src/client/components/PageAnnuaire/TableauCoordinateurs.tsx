import { api } from "@/server/framework/trpc/api";
import { SelecteurGroupement } from "./SelecteurGroupement";
import { TableauAnnuaire } from "./TableauAnnuaire";
import { pluriel } from "./lignesAnnuaire";
import {
  REGROUPEMENTS_COORDINATEURS,
  useTableauCoordinateurs,
} from "./useTableauCoordinateurs";

export function TableauCoordinateurs() {
  const { data, isLoading } = api.annuaire.coordinateurs.useQuery();
  const { table, regroupement } = useTableauCoordinateurs(data);
  const nombrePersonnes = new Set(
    table.getFilteredRowModel().rows.map((ligne) => ligne.original.personne.id),
  ).size;

  return (
    <TableauAnnuaire
      caption="Coordinateurs PILOTE"
      isLoading={isLoading}
      libelleResultats={pluriel(
        nombrePersonnes,
        "coordinateur",
        "coordinateurs",
      )}
      libelleAucun="Aucun coordinateur"
      selecteurGroupement={
        <SelecteurGroupement
          onChange={(valeur) => table.setGrouping([valeur])}
          options={REGROUPEMENTS_COORDINATEURS}
          valeur={regroupement}
        />
      }
      table={table}
    />
  );
}
