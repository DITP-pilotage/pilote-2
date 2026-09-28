import api from "@/server/infrastructure/api/trpc/api";
import { Lien } from "@/components/_commons/Lien/Lien";
import { TableauAdmin } from "@/components/_commons/TableauAdmin/TableauAdmin";
import { useTableauAdminPpgs } from "./useTableauAdminPpgs";

const LIBELLES = {
  aucun: "Aucun PPG",
  aucunResultat: "Aucun PPG ne correspond à",
};

const PageAdminPpgs = () => {
  const { data: ppgs, isLoading } = api.metadataPpg.lister.useQuery();
  const table = useTableauAdminPpgs(ppgs ?? []);
  const nombrePpgsFiltres = table.getFilteredRowModel().rows.length;

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">
              Référentiels dépréciés
            </p>
            <h1 className="text-3xl font-bold text-gray-900">PPG</h1>
            {!isLoading && ppgs && (
              <p className="mt-1 text-sm text-gray-500">
                {nombrePpgsFiltres} PPG
              </p>
            )}
          </div>
          <Lien
            href="/panel-administrateur/referentiels-deprecies/ppgs/nouveau?_action=creer-ppg"
            label="+ Créer un PPG"
            variant="button"
          />
        </div>

        <TableauAdmin
          caption="Liste des PPG"
          isLoading={isLoading}
          libelles={LIBELLES}
          table={table}
        />
      </div>
    </div>
  );
};

export default PageAdminPpgs;
