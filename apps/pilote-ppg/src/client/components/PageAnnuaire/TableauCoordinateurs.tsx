import api from "@/server/infrastructure/api/trpc/api";
import { TableauAdmin } from "@/components/_commons/TableauAdmin/TableauAdmin";
import { SelecteurGroupement } from "./SelecteurGroupement";
import {
  REGROUPEMENTS_COORDINATEURS,
  useTableauCoordinateurs,
} from "./useTableauCoordinateurs";

export function TableauCoordinateurs() {
  const { data, isLoading } = api.annuaire.coordinateurs.useQuery();
  const { table, regroupement } = useTableauCoordinateurs(data);

  return (
    <div className="flex flex-col gap-4">
      <SelecteurGroupement
        onChange={(valeur) => table.setGrouping([valeur])}
        options={REGROUPEMENTS_COORDINATEURS}
        valeur={regroupement}
      />
      <TableauAdmin
        caption="Coordinateurs PILOTE"
        isLoading={isLoading}
        libelles={{
          aucun: "Aucun coordinateur",
          aucunResultat: "Aucun coordinateur ne correspond à",
        }}
        table={table}
      />
    </div>
  );
}
