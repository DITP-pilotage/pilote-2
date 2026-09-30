import api from "@/server/infrastructure/api/trpc/api";
import { SelecteurGroupement } from "./SelecteurGroupement";
import { TableauAnnuaire } from "./TableauAnnuaire";
import { pluriel } from "./lignesAnnuaire";
import {
  REGROUPEMENTS_RESPONSABLES,
  useTableauResponsables,
} from "./useTableauResponsables";

export function TableauResponsables() {
  const { data, isLoading } = api.annuaire.responsables.useQuery();
  const { table, regroupement } = useTableauResponsables(data);
  const nombrePersonnes = new Set(
    table.getFilteredRowModel().rows.map((ligne) => ligne.original.personne.id),
  ).size;

  return (
    <TableauAnnuaire
      caption="Responsables locaux"
      isLoading={isLoading}
      libelleResultats={pluriel(nombrePersonnes, "responsable", "responsables")}
      libelleAucun="Aucun responsable"
      selecteurGroupement={
        <SelecteurGroupement
          onChange={(valeur) => table.setGrouping([valeur])}
          options={REGROUPEMENTS_RESPONSABLES}
          valeur={regroupement}
        />
      }
      table={table}
    />
  );
}
