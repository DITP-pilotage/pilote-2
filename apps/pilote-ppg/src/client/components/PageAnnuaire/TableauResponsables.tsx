import api from "@/server/infrastructure/api/trpc/api";
import { TableauAdmin } from "@/components/_commons/TableauAdmin/TableauAdmin";
import { SelecteurGroupement } from "./SelecteurGroupement";
import {
  REGROUPEMENTS_RESPONSABLES,
  useTableauResponsables,
} from "./useTableauResponsables";

export function TableauResponsables() {
  const { data, isLoading } = api.annuaire.responsables.useQuery();
  const { table, regroupement } = useTableauResponsables(data);

  return (
    <div className="flex flex-col gap-4">
      <SelecteurGroupement
        onChange={(valeur) => table.setGrouping([valeur])}
        options={REGROUPEMENTS_RESPONSABLES}
        valeur={regroupement}
      />
      <TableauAdmin
        caption="Responsables locaux"
        isLoading={isLoading}
        libelles={{
          aucun: "Aucun responsable",
          aucunResultat: "Aucun responsable ne correspond à",
        }}
        table={table}
      />
    </div>
  );
}
