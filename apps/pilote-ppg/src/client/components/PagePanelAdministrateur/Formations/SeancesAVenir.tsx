import { api } from "@/server/framework/trpc/api";
import { formaterDate } from "@/client/utils/date/date";
import { TableauAdmin } from "@/components/_commons/TableauAdmin/TableauAdmin";
import { useTableauSeancesAVenir } from "./useTableauSeancesAVenir";

const LIBELLES = {
  aucun: "Aucune séance à venir",
  aucunResultat: "Aucune séance ne correspond à",
};

export const SeancesAVenir = () => {
  const { data, isLoading } = api.formation.listSeancesAVenir.useQuery();
  const table = useTableauSeancesAVenir(data?.seances ?? []);

  return (
    <div className="flex flex-col gap-4">
      {data && (
        <p className="text-sm text-gray-600">
          {data.dateImport
            ? `Données RDV-SP importées le ${formaterDate(data.dateImport, "DD/MM/YYYY [à] H[h]mm")}`
            : "Aucune donnée RDV-SP importée pour l'instant."}
        </p>
      )}
      <TableauAdmin
        caption="Séances de formation à venir"
        isLoading={isLoading}
        libelles={LIBELLES}
        table={table}
      />
    </div>
  );
};
